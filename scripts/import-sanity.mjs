import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '../web/node_modules/@sanity/client/dist/index.js'

const projectId = process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || process.env.PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_API_READ_TOKEN
const commit = process.argv.includes('--commit')
const replaceExisting = process.argv.includes('--replace-existing')

if (!projectId || !token) {
  throw new Error('Set a Sanity project ID and API token before importing. See migration/sanity/README.md.')
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-11-09',
  useCdn: false,
})

const input = resolve(import.meta.dirname, '../migration/sanity/import.ndjson')
const documents = (await readFile(input, 'utf8'))
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))

const ids = documents.map((document) => document._id)
const incomingByPath = new Map(
  documents.filter((document) => document.path).map((document) => [document.path, document]),
)
const [existingIds, existingRoutes] = await Promise.all([
  client.fetch(`*[_id in $ids]{_id, _type, _updatedAt}`, { ids }),
  client.fetch(
    `*[_type in ["marketingPage", "post", "category"] && defined(path)]{_id, _type, path, _updatedAt}`,
  ),
])

const pathConflicts = existingRoutes.filter((existing) => {
  const incoming = incomingByPath.get(existing.path)
  return incoming && incoming._id !== existing._id
})

process.stdout.write(`Prepared documents: ${documents.length}\n`)
process.stdout.write(`Existing deterministic IDs: ${existingIds.length}\n`)
process.stdout.write(`Conflicting route owners: ${pathConflicts.length}\n`)

if (pathConflicts.length) {
  for (const conflict of pathConflicts) {
    const incoming = incomingByPath.get(conflict.path)
    process.stderr.write(
      `Path conflict ${conflict.path}: existing ${conflict._type} ${conflict._id}, incoming ${incoming._type} ${incoming._id}\n`,
    )
  }
  throw new Error('Resolve Sanity route conflicts before importing.')
}

if (!commit) {
  process.stdout.write('Preflight only; no Sanity documents were changed.\n')
  process.exit(0)
}

if (existingIds.length && !replaceExisting) {
  throw new Error(
    'Existing deterministic IDs would be replaced. Review the preflight and rerun with --replace-existing only if intentional.',
  )
}

for (let index = 0; index < documents.length; index += 100) {
  const transaction = client.transaction()
  for (const document of documents.slice(index, index + 100)) transaction.createOrReplace(document)
  await transaction.commit({ visibility: 'sync' })
  process.stdout.write(`Imported ${Math.min(index + 100, documents.length)}/${documents.length}\n`)
}
