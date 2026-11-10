// @ts-check
import { defineConfig } from 'astro/config'
import sanity from '@sanity/astro'
import { loadEnv } from 'vite'

const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  PUBLIC_SANITY_API_VERSION,
  SANITY_API_READ_TOKEN,
} = loadEnv(
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
  redirects: {
    '/one-digital-world': '/fellowship',
    '/webinars/charting-a-path-to-digital-dominance': '/webinars',
    '/webinars/ai-for-everyone': '/webinars',
    '/webinars/ai-unlocked': '/webinars',
    '/webinars/drive-impact-with-ai': '/webinars',
    '/webinars/ai-lead-brian-lambert': '/live',
    '/author/digital_command': '/blog',
    '/rise-of-the-purple-collar-worker-the-best-of-both-worlds-in-a-digital-first-job-second-era':
      '/rise-of-the-purple-collar-worker',
    '/digital-command-pathways': '/digital-academy',
  },
  integrations: [
    sanity({
      projectId,
      dataset,
      token: SANITY_API_READ_TOKEN || undefined,
      apiVersion: PUBLIC_SANITY_API_VERSION || '2026-11-09',
      useCdn: false,
      injectTypes: true,
    }),
  ],
})
