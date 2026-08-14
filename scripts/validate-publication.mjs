import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteRoot = path.join(repositoryRoot, 'site')
const replayRoot = path.join(siteRoot, 'data', 'election-night', 'v1', 'replays', '2020')
const franceRoot = path.join(siteRoot, 'data', 'france-atlas')
const franceReplayRoot = path.join(franceRoot, 'replay')
const canadaRoot = path.join(siteRoot, 'data', 'canada-atlas')
const canadaReplayPath = path.join(canadaRoot, 'replay', '2025.json')
const publicBasePath = '/3D/'

const routeEntrypoints = [
  path.join(siteRoot, 'index.html'),
  path.join(siteRoot, '404.html'),
  path.join(siteRoot, 'election-atlas', 'index.html'),
  path.join(siteRoot, 'france-atlas', 'index.html'),
  path.join(siteRoot, 'canada-atlas', 'index.html'),
]
const routeMetadata = new Map([
  [path.join(siteRoot, 'index.html'), { lang: 'en', title: 'Presidential Atlas | Interactive 3D Election Maps' }],
  [path.join(siteRoot, '404.html'), { lang: 'en', title: 'Presidential Atlas' }],
  [path.join(siteRoot, 'election-atlas', 'index.html'), { lang: 'en', title: 'United States Presidential Atlas | 2016–2024' }],
  [path.join(siteRoot, 'france-atlas', 'index.html'), { lang: 'fr', title: 'Atlas présidentiel français | Élection 2022' }],
  [path.join(siteRoot, 'canada-atlas', 'index.html'), { lang: 'en', title: 'Canada Federal Election Atlas | 2025' }],
])
const requiredFiles = [
  ...routeEntrypoints,
  path.join(replayRoot, 'manifest.json'),
  path.join(replayRoot, 'national-timeline.json'),
  path.join(franceReplayRoot, 'round-1.json'),
  path.join(franceReplayRoot, 'round-2.json'),
  path.join(franceRoot, 'manifest.json'),
  path.join(franceRoot, 'departments.geojson'),
  path.join(canadaRoot, 'manifest.json'),
  path.join(canadaRoot, 'ridings.geojson'),
  canadaReplayPath,
]

const allowedTopLevelEntries = new Set([
  '.nojekyll',
  '404.html',
  'assets',
  'data',
  'election-atlas',
  'france-atlas',
  'canada-atlas',
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
    if (extension === '.js') {
      const moduleReferences = [
        ...contents.matchAll(/(?:\bfrom\s*|\bimport\s*\()\s*["'](\.[^"']+)["']/g),
      ]
      for (const [, reference] of moduleReferences) {
        const referencedModule = path.resolve(path.dirname(filePath), reference)
        if (!fs.existsSync(referencedModule)) {
          throw new Error(`${publicationPath(filePath)} references missing module ${reference}.`)
        }
      }
    }
  }
}

for (const entrypoint of routeEntrypoints) {
  const html = fs.readFileSync(entrypoint, 'utf8')
  const metadata = routeMetadata.get(entrypoint)
  const language = html.match(/<html\s+[^>]*lang=["']([^"']+)["']/i)?.[1]
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]
  if (!metadata || language !== metadata.lang || title !== metadata.title) {
    throw new Error(`${publicationPath(entrypoint)} has incorrect language or title metadata.`)
  }
  if (!description || description.length < 50) {
    throw new Error(`${publicationPath(entrypoint)} needs a descriptive meta description.`)
  }
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

for (const round of [1, 2]) {
  const replayPath = path.join(franceReplayRoot, `round-${round}.json`)
  const replay = JSON.parse(fs.readFileSync(replayPath, 'utf8'))
  if (
    replay.schemaVersion !== 'france-presidential-replay/v1'
    || replay.round !== round
    || !Array.isArray(replay.jurisdictions)
    || !Array.isArray(replay.pollCloseHours)
    || !Array.isArray(replay.events)
  ) {
    throw new Error(`France round ${round} replay schema is invalid.`)
  }
  if (replay.pollCloseHours.length !== replay.jurisdictions.length) {
    throw new Error(`France round ${round} poll-closing groups do not match its jurisdictions.`)
  }
  const embargoOffset = (
    Date.parse(replay.timeline.embargoLiftsAt) - Date.parse(replay.startsAt)
  ) / 1_000
  const totals = new Array(2 + replay.candidateIds.length).fill(0)
  let previousOffset = -1
  for (const event of replay.events) {
    if (!Number.isInteger(event[0]) || event[0] < previousOffset) {
      throw new Error(`France round ${round} return timestamps are not ordered.`)
    }
    if (event[0] < embargoOffset) {
      throw new Error(`France round ${round} publishes a return before the 20:00 embargo.`)
    }
    if (!replay.jurisdictions[event[1]]) {
      throw new Error(`France round ${round} contains an unknown jurisdiction index.`)
    }
    event.slice(4).forEach((votes, index) => {
      if (!Number.isInteger(votes) || votes < 0) {
        throw new Error(`France round ${round} contains an invalid vote batch.`)
      }
      totals[index] += votes
    })
    previousOffset = event[0]
  }
  const expected = [replay.final.blank, replay.final.invalid, ...replay.final.candidateVotes]
  if (totals.some((votes, index) => votes !== expected[index])) {
    throw new Error(`France round ${round} replay does not reconcile to its official endpoint.`)
  }
}

const franceManifest = JSON.parse(fs.readFileSync(path.join(franceRoot, 'manifest.json'), 'utf8'))
const franceDepartments = JSON.parse(fs.readFileSync(path.join(franceRoot, 'departments.geojson'), 'utf8'))
const expectedOverseasCodes = ['971', '972', '973', '974', '975', '976', '978', '986', '987', '988']
if (!Array.isArray(franceDepartments.features) || franceDepartments.features.length !== 106) {
  throw new Error(`Expected 106 France department and territory features, found ${franceDepartments.features?.length ?? 0}.`)
}
const overseasCodes = franceDepartments.features
  .filter((feature) => feature.properties?.isOverseas)
  .map((feature) => String(feature.properties.code))
  .sort()
if (JSON.stringify(overseasCodes) !== JSON.stringify(expectedOverseasCodes)) {
  throw new Error('France overseas inset codes are incomplete or unexpected.')
}
for (const code of expectedOverseasCodes) {
  const communePath = path.join(franceRoot, 'communes', `${code}.geojson`)
  if (!fs.existsSync(communePath)) {
    throw new Error(`France overseas commune geometry is missing for ${code}.`)
  }
  const collection = JSON.parse(fs.readFileSync(communePath, 'utf8'))
  if (!Array.isArray(collection.features) || collection.features.length === 0) {
    throw new Error(`France overseas commune geometry is empty for ${code}.`)
  }
}
if (
  franceManifest.audit?.metropolitanDepartmentFeatures !== 96
  || franceManifest.audit?.overseasDepartmentFeatures !== 10
  || franceManifest.audit?.departmentsWithCommuneFiles !== 106
) {
  throw new Error('France manifest geography audit does not match the publication inventory.')
}

const canadaManifest = JSON.parse(fs.readFileSync(path.join(canadaRoot, 'manifest.json'), 'utf8'))
const canadaRidings = JSON.parse(fs.readFileSync(path.join(canadaRoot, 'ridings.geojson'), 'utf8'))
const canadaReplay = JSON.parse(fs.readFileSync(canadaReplayPath, 'utf8'))
const canadaPartyIds = Object.keys(canadaManifest.partyMeta ?? {})
if (
  canadaManifest.schemaVersion !== 'canada-federal-atlas/v1'
  || canadaManifest.seatsTotal !== 343
  || canadaManifest.majority !== 172
  || !Array.isArray(canadaRidings.features)
  || canadaRidings.features.length !== 343
) {
  throw new Error('Canada Atlas manifest, seat threshold, or riding inventory is invalid.')
}
const canadaRidingCodes = new Set()
const canadaMappedGeometry = []
const canadaUsedGeometryResultKeys = new Set()
const canadaGeometryStatusCounts = new Map()
let canadaMappedGeometryFeatures = 0
let canadaNonReportingGeometryFeatures = 0
let canadaUnmatchedGeometryFeatures = 0
const canadaTotals = {
  electors: 0,
  voters: 0,
  validVotes: 0,
  rejected: 0,
  partyVotes: Object.fromEntries(canadaPartyIds.map((partyId) => [partyId, 0])),
  seats: Object.fromEntries(canadaPartyIds.map((partyId) => [partyId, 0])),
}
for (const feature of canadaRidings.features) {
  const code = String(feature.properties?.code ?? '')
  const result = feature.properties?.result
  if (!/^\d{5}$/.test(code) || canadaRidingCodes.has(code) || !result) {
    throw new Error(`Invalid or duplicate Canada riding: ${code}`)
  }
  canadaRidingCodes.add(code)
  canadaTotals.electors += result.electors
  canadaTotals.voters += result.voters
  canadaTotals.validVotes += result.totalVotes
  canadaTotals.rejected += result.rejected
  for (const partyId of canadaPartyIds) canadaTotals.partyVotes[partyId] += result.partyVotes[partyId]
  canadaTotals.seats[result.winnerPartyId] += 1

  const pollingPath = path.join(canadaRoot, 'polling-divisions', `${code}.geojson`)
  if (!fs.existsSync(pollingPath)) throw new Error(`Canada polling-division file is missing for ${code}.`)
  const collection = JSON.parse(fs.readFileSync(pollingPath, 'utf8'))
  if (collection.ridingCode !== code || !Array.isArray(collection.features)) {
    throw new Error(`Canada polling-division file is malformed for ${code}.`)
  }
  const expectedException = canadaManifest.audit.ridingsWithoutPollingGeometry.includes(code)
  if (expectedException !== (collection.features.length === 0)) {
    throw new Error(`Canada polling geometry exception is not documented correctly for ${code}.`)
  }
  for (const pollingFeature of collection.features) {
    const props = pollingFeature.properties ?? {}
    const status = props.resultStatus ?? 'unmatched'
    canadaGeometryStatusCounts.set(status, (canadaGeometryStatusCounts.get(status) ?? 0) + 1)
    if (!props.result) {
      if (Array.isArray(props.resultPollNumbers) && props.resultPollNumbers.length) {
        throw new Error(`${props.code} has result aliases but no displayed result.`)
      }
      if (status === 'unmatched' || status === 'unresolved-combination') canadaUnmatchedGeometryFeatures += 1
      else canadaNonReportingGeometryFeatures += 1
      continue
    }
    if (!Array.isArray(props.resultPollNumbers) || props.resultPollNumbers.length === 0) {
      throw new Error(`${props.code} is mapped without official result aliases.`)
    }
    for (const pollNumber of props.resultPollNumbers) {
      const resultKey = `${code}:${pollNumber}`
      if (canadaUsedGeometryResultKeys.has(resultKey)) throw new Error(`${resultKey} is assigned to more than one geometry feature.`)
      canadaUsedGeometryResultKeys.add(resultKey)
    }
    canadaMappedGeometry.push(props)
    canadaMappedGeometryFeatures += 1
  }
}
if (
  canadaMappedGeometryFeatures !== canadaManifest.audit.pollingGeometryMappedFeatures
  || canadaNonReportingGeometryFeatures !== canadaManifest.audit.pollingGeometryNonReportingFeatures
  || canadaUnmatchedGeometryFeatures !== canadaManifest.audit.pollingGeometryUnmatchedFeatures
) throw new Error('Canada polling-geometry feature counts do not reconcile to the manifest audit.')
if (
  (canadaGeometryStatusCounts.get('resolved-suffix') ?? 0) !== canadaManifest.audit.pollingGeometrySuffixResolvedFeatures
  || (canadaGeometryStatusCounts.get('resolved-combination') ?? 0) !== canadaManifest.audit.pollingGeometryCombinationResolvedFeatures
  || (canadaGeometryStatusCounts.get('resolved-source-code') ?? 0) !== canadaManifest.audit.pollingGeometrySourceCodeResolvedFeatures
) throw new Error('Canada polling-geometry resolution counts do not reconcile to the manifest audit.')
if (canadaUnmatchedGeometryFeatures !== 0) throw new Error('At least one reportable Canada polling boundary is still unmatched.')
for (const key of ['electors', 'voters', 'validVotes', 'rejected']) {
  if (canadaTotals[key] !== canadaManifest.national[key]) throw new Error(`Canada national ${key} does not reconcile.`)
}
if (Math.abs(canadaManifest.national.turnout - canadaTotals.voters / canadaTotals.electors * 100) > 1e-9) {
  throw new Error('Canada national turnout does not include every ballot cast.')
}
for (const partyId of canadaPartyIds) {
  if (
    canadaTotals.partyVotes[partyId] !== canadaManifest.national.partyVotes[partyId]
    || canadaTotals.seats[partyId] !== canadaManifest.national.seats[partyId]
  ) throw new Error(`Canada ${partyId} votes or seats do not reconcile.`)
}
if (
  canadaReplay.schemaVersion !== 'canada-federal-replay/v1'
  || canadaReplay.ridings.length !== 343
  || canadaReplay.polls.length !== canadaReplay.events.length
) throw new Error('Canada replay inventory is invalid.')
const canadaReplayPartyVotes = new Array(canadaPartyIds.length).fill(0)
let canadaReplayValid = 0
let canadaReplayRejected = 0
let previousCanadaOffset = -1
const canadaPollIndexes = new Set()
const canadaReplayPollGroups = new Map()
for (const event of canadaReplay.events) {
  if (!Number.isInteger(event[0]) || event[0] < previousCanadaOffset || !canadaReplay.polls[event[1]]) {
    throw new Error('Canada replay timestamps are unordered or reference an unknown poll.')
  }
  canadaPollIndexes.add(event[1])
  const poll = canadaReplay.polls[event[1]]
  const groupKey = `${poll[0]}:${poll[1]}`
  const group = canadaReplayPollGroups.get(groupKey) ?? { batchCount: event[3], batches: new Set() }
  if (!Number.isInteger(event[2]) || event[2] < 1 || event[2] > event[3] || group.batchCount !== event[3]) {
    throw new Error(`Canada replay polling station ${groupKey} has invalid batch metadata.`)
  }
  group.batches.add(event[2])
  canadaReplayPollGroups.set(groupKey, group)
  previousCanadaOffset = event[0]
}
if (canadaPollIndexes.size !== canadaReplay.polls.length) throw new Error('Canada replay polls are duplicated or missing.')
if (canadaReplayPollGroups.size !== canadaReplay.audit.polls) throw new Error('Canada replay polling-station audit does not reconcile.')
for (const [groupKey, group] of canadaReplayPollGroups) {
  if (group.batches.size !== group.batchCount) throw new Error(`Canada replay polling station ${groupKey} is missing a partial return.`)
}
const canadaOfficialPollTotals = new Map()
for (const poll of canadaReplay.polls) {
  canadaReplayValid += poll[4]
  canadaReplayRejected += poll[5]
  canadaPartyIds.forEach((_, index) => { canadaReplayPartyVotes[index] += Number(poll[6 + index]) })
  const ridingCode = canadaReplay.ridings[poll[0]]?.[0]
  if (!ridingCode) throw new Error(`Canada replay poll references unknown riding index ${poll[0]}.`)
  const officialKey = `${ridingCode}:${poll[1]}`
  const official = canadaOfficialPollTotals.get(officialKey) ?? { valid: 0, rejected: 0, parties: new Array(canadaPartyIds.length).fill(0) }
  official.valid += poll[4]
  official.rejected += poll[5]
  canadaPartyIds.forEach((_, index) => { official.parties[index] += Number(poll[6 + index]) })
  canadaOfficialPollTotals.set(officialKey, official)
}
if (canadaReplayValid !== canadaManifest.national.validVotes || canadaReplayRejected !== canadaManifest.national.rejected) {
  throw new Error('Canada replay turnout does not reconcile to the official endpoint.')
}
canadaPartyIds.forEach((partyId, index) => {
  if (canadaReplayPartyVotes[index] !== canadaManifest.national.partyVotes[partyId]) {
    throw new Error(`Canada replay ${partyId} vote does not reconcile.`)
  }
})
for (const props of canadaMappedGeometry) {
  const aggregate = { valid: 0, rejected: 0, parties: new Array(canadaPartyIds.length).fill(0) }
  for (const pollNumber of props.resultPollNumbers) {
    const official = canadaOfficialPollTotals.get(`${props.ridingCode}:${pollNumber}`)
    if (!official) throw new Error(`${props.code} references missing official result ${pollNumber}.`)
    aggregate.valid += official.valid
    aggregate.rejected += official.rejected
    canadaPartyIds.forEach((_, index) => { aggregate.parties[index] += official.parties[index] })
  }
  if (aggregate.valid !== props.result.totalVotes || aggregate.rejected !== props.result.rejected) {
    throw new Error(`${props.code} geometry turnout does not reconcile to its official result buckets.`)
  }
  canadaPartyIds.forEach((partyId, index) => {
    if (aggregate.parties[index] !== props.result.partyVotes[partyId]) {
      throw new Error(`${props.code} geometry ${partyId} vote does not reconcile.`)
    }
  })
}

process.stdout.write(
  `Validated ${routeEntrypoints.length} routes, ${publicFiles.length} public files, ${stateCodes.size} state replays, both France replays, 10 overseas insets, and the 343-riding Canada replay.\n`,
)
