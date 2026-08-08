import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteRoot = path.join(repositoryRoot, 'site')
const replayRoot = path.join(siteRoot, 'data', 'election-night', 'v1', 'replays', '2020')

const requiredFiles = [
  path.join(siteRoot, 'index.html'),
  path.join(siteRoot, '404.html'),
  path.join(siteRoot, 'election-atlas', 'index.html'),
  path.join(siteRoot, 'france-atlas', 'index.html'),
  path.join(replayRoot, 'manifest.json'),
  path.join(replayRoot, 'national-timeline.json'),
]

const forbiddenNames = new Set(['package.json', 'pom.xml'])
const forbiddenExtensions = new Set(['.java', '.jar', '.map', '.ts', '.tsx'])

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(entryPath) : [entryPath]
  })
}

for (const filePath of requiredFiles) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required publication file is missing: ${path.relative(repositoryRoot, filePath)}`)
  }
}

const forbiddenFile = filesUnder(siteRoot).find((filePath) => {
  return forbiddenNames.has(path.basename(filePath)) || forbiddenExtensions.has(path.extname(filePath))
})
if (forbiddenFile) {
  throw new Error(`Refusing to publish private source artifact: ${path.relative(repositoryRoot, forbiddenFile)}`)
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

process.stdout.write(`Validated the Pages boundary, ${stateCodes.size} state replays, and the national timeline.\n`)
