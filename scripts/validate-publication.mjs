import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteRoot = path.join(repositoryRoot, 'site')
const replayRoot = path.join(siteRoot, 'data', 'election-night', 'v1', 'replays', '2020')
const publicBasePath = '/3D/'

const routeEntrypoints = [
  path.join(siteRoot, 'index.html'),
  path.join(siteRoot, '404.html'),
  path.join(siteRoot, 'election-atlas', 'index.html'),
  path.join(siteRoot, 'france-atlas', 'index.html'),
]
const requiredFiles = [
  ...routeEntrypoints,
  path.join(replayRoot, 'manifest.json'),
  path.join(replayRoot, 'national-timeline.json'),
]

const allowedTopLevelEntries = new Set([
  '.nojekyll',
  '404.html',
  'assets',
  'data',
  'election-atlas',
  'france-atlas',
  'index.html',
])
const allowedExtensions = new Set([
  '.css',
  '.csv',
  '.gif',
  '.geojson',
  '.html',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.otf',
  '.png',
  '.svg',
  '.ttf',
  '.wasm',
  '.webp',
  '.woff',
  '.woff2',
])
const forbiddenNames = new Set([
  '.npmrc',
  'gradlew',
  'mvnw',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'pom.xml',
  'yarn.lock',
])
const forbiddenExtensions = new Set([
  '.env',
  '.gradle',
  '.java',
  '.jar',
  '.jsx',
  '.key',
  '.keystore',
  '.kt',
  '.kts',
  '.less',
  '.map',
  '.p12',
  '.pem',
  '.pfx',
  '.properties',
  '.py',
  '.sass',
  '.scss',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
])
const forbiddenDirectories = new Set([
  '.cache',
  '.git',
  '.idea',
  '.vscode',
  '__pycache__',
  'coverage',
  'node_modules',
  'src',
  'target',
])
const textExtensions = new Set(['.css', '.csv', '.geojson', '.html', '.js', '.json', '.svg'])
const secretPatterns = [
  ['private key', /-----BEGIN (?:EC |OPENSSH |RSA )?PRIVATE KEY-----/],
  ['AWS access key', /(?:^|[^A-Z0-9])(?:AKIA|ASIA)[A-Z0-9]{16}(?:$|[^A-Z0-9])/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['OpenAI API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
]

function publicationPath(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join('/')
}

function trackedPublicFiles() {
  const result = spawnSync(
    'git',
    ['-c', `safe.directory=${repositoryRoot}`, 'ls-files', '-z', '--', 'site'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(`Unable to read the Git publication inventory: ${result.stderr.trim()}`)
  }
  return result.stdout
    .split('\0')
    .filter(Boolean)
    .map((relativePath) => path.resolve(repositoryRoot, relativePath))
}

function referencedLocalFile(entrypoint, reference) {
  const cleanReference = reference.split(/[?#]/, 1)[0]
  if (!cleanReference || cleanReference.startsWith('#')) return null
  if (/^(?:[a-z]+:)?\/\//i.test(cleanReference)) return null
  if (/^(?:data|blob|mailto|tel|javascript):/i.test(cleanReference)) return null

  let resolved
  if (cleanReference.startsWith(publicBasePath)) {
    resolved = path.resolve(siteRoot, cleanReference.slice(publicBasePath.length))
  } else if (cleanReference.startsWith('/')) {
    throw new Error(`${publicationPath(entrypoint)} references an unexpected root path: ${reference}`)
  } else {
    resolved = path.resolve(path.dirname(entrypoint), cleanReference)
  }

  const relative = path.relative(siteRoot, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${publicationPath(entrypoint)} references a file outside site/: ${reference}`)
  }
  return resolved
}

for (const filePath of requiredFiles) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required publication file is missing: ${publicationPath(filePath)}`)
  }
}

const publicFiles = trackedPublicFiles()
const topLevelEntries = new Set(
  publicFiles.map((filePath) => publicationPath(filePath).split('/')[1]),
)
for (const entry of topLevelEntries) {
  if (!allowedTopLevelEntries.has(entry)) {
    throw new Error(`Unexpected top-level publication entry: site/${entry}`)
  }
}

for (const filePath of publicFiles) {
  const directorySegments = publicationPath(filePath).split('/').slice(1, -1)
  const forbiddenDirectory = directorySegments.find((segment) => forbiddenDirectories.has(segment.toLowerCase()))
  if (forbiddenDirectory) {
    throw new Error(`Refusing suspicious publication directory in ${publicationPath(filePath)}`)
  }
  const fileName = path.basename(filePath).toLowerCase()
  const extension = path.extname(fileName)
  if (fileName === '.env' || fileName.startsWith('.env.')) {
    throw new Error(`Refusing environment file: ${publicationPath(filePath)}`)
  }
  if (forbiddenNames.has(fileName) || forbiddenExtensions.has(extension)) {
    throw new Error(`Refusing private source artifact: ${publicationPath(filePath)}`)
  }
  if (fileName !== '.nojekyll' && !allowedExtensions.has(extension)) {
    throw new Error(`Publication file type is not allowlisted: ${publicationPath(filePath)}`)
  }

  if (textExtensions.has(extension)) {
    const contents = fs.readFileSync(filePath, 'utf8')
    const detectedSecret = secretPatterns.find(([, pattern]) => pattern.test(contents))
    if (detectedSecret) {
      throw new Error(`Possible ${detectedSecret[0]} found in ${publicationPath(filePath)}`)
    }
  }
}

for (const entrypoint of routeEntrypoints) {
  const html = fs.readFileSync(entrypoint, 'utf8')
  const references = [...html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)]
  if (references.length === 0) {
    throw new Error(`Route entrypoint contains no asset references: ${publicationPath(entrypoint)}`)
  }
  for (const [, reference] of references) {
    const referencedFile = referencedLocalFile(entrypoint, reference)
    if (referencedFile && !fs.existsSync(referencedFile)) {
      throw new Error(`${publicationPath(entrypoint)} references missing asset: ${reference}`)
    }
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(replayRoot, 'manifest.json'), 'utf8'))
const national = JSON.parse(fs.readFileSync(path.join(replayRoot, 'national-timeline.json'), 'utf8'))
if (!Array.isArray(manifest.states) || manifest.states.length !== 51) {
  throw new Error(`Expected 51 manifest entries, found ${manifest.states?.length ?? 0}.`)
}
if (!Array.isArray(national.states) || national.states.length !== 51) {
  throw new Error(`Expected 51 national timelines, found ${national.states?.length ?? 0}.`)
}

const stateCodes = new Set()
for (const entry of manifest.states) {
  const stateCode = String(entry.stateCode || '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(stateCode) || stateCodes.has(stateCode)) {
    throw new Error(`Invalid or duplicate state code: ${stateCode}`)
  }
  stateCodes.add(stateCode)

  const statePath = path.join(replayRoot, 'states', `${stateCode}.json`)
  const replay = JSON.parse(fs.readFileSync(statePath, 'utf8'))
  if (replay.stateCode !== stateCode || !Array.isArray(replay.events) || replay.events.length === 0) {
    throw new Error(`${stateCode} replay is incomplete.`)
  }
}

const stateFiles = fs.readdirSync(path.join(replayRoot, 'states')).filter((fileName) => fileName.endsWith('.json'))
if (stateFiles.length !== stateCodes.size) {
  throw new Error(`Expected exactly ${stateCodes.size} state replay files, found ${stateFiles.length}.`)
}

const nationalStateCodes = new Set(national.states.map((state) => String(state.stateCode || '').toUpperCase()))
if (nationalStateCodes.size !== stateCodes.size || [...stateCodes].some((stateCode) => !nationalStateCodes.has(stateCode))) {
  throw new Error('National timeline jurisdictions do not match the state replay manifest.')
}

process.stdout.write(
  `Validated ${routeEntrypoints.length} routes, ${publicFiles.length} public files, ${stateCodes.size} state replays, and the national timeline.\n`,
)
