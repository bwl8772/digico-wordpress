import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in studio/.env before starting Studio.')
}

export default defineConfig({
  name: 'digital-command',
  title: 'Digital Command',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
})
