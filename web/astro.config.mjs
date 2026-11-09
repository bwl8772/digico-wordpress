// @ts-check
import { defineConfig } from 'astro/config'
import sanity from '@sanity/astro'
import { loadEnv } from 'vite'

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, PUBLIC_SANITY_API_VERSION } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
)

const projectId = PUBLIC_SANITY_PROJECT_ID
const dataset = PUBLIC_SANITY_DATASET || 'production'

if (!projectId) {
  throw new Error('Set PUBLIC_SANITY_PROJECT_ID in web/.env before starting the Astro app.')
}

export default defineConfig({
  site: 'https://digitalcommand.co',
  trailingSlash: 'ignore',
  integrations: [
    sanity({
      projectId,
      dataset,
      apiVersion: PUBLIC_SANITY_API_VERSION || '2026-11-09',
      useCdn: false,
      injectTypes: true,
    }),
  ],
})
