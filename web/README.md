# Astro site

Static Astro frontend for Digital Command. Astro owns the core website pages; it also renders published Sanity marketing pages and posts at their canonical `path`.

```sh
cp .env.example .env
npm install
npm run dev
```

Set `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` to the same values as Studio.

## Route ownership

- Core website pages are explicit files in `src/pages` (currently `/`, `/blog`, and `/404`). Static Astro routes take priority over the catch-all route.
- Marketing landing pages are `marketingPage` documents in Sanity and render through `src/pages/[...path].astro`.
- Blog posts remain editorial Sanity documents and use the same catch-all so legacy root-level WordPress post URLs can be preserved.
- Core route paths are rejected by the Sanity schema and filtered again during Astro builds. Add any new core route to `CORE_PAGE_PATHS` in `src/lib/sanity.ts` and to the Studio schema safeguard.

WordPress remains live until cutover. Visual parity work comes after the content inventory and first imported page/post.
