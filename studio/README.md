# Sanity Studio

Standalone Studio for Digital Command marketing landing pages, posts, authors, categories, media metadata, and SEO. Core website pages are intentionally absent because Astro owns them in `../web/src/pages`. Original WordPress IDs and paths are stored for a repeatable import. This is not a complete page builder; extend the schema after comparing WordPress templates.

## Setup

Use Node 22.12 or later.

```sh
npm install
cp .env.example .env
```

Set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` to the Digital Command Website project (not WinBench). Run `npm run dev` and sign in with your Sanity account. Add `http://localhost:3333` as a CORS origin with credentials.

`npm run typegen` writes types for the Astro app in `../web/src/sanity.types.ts`. Studio validates routable paths across marketing pages, posts, and category archives and blocks marketing pages from Astro-owned core paths. API imports bypass Studio validation, so the Astro build also rejects route collisions.
