# Digital Command website

This repository is the WordPress-to-Astro migration for [digitalcommand.co](https://digitalcommand.co/). WordPress stays the live site until the [migration plan](docs/MIGRATION_PLAN.md) gates pass and cutover is approved.

| Path | Role |
| --- | --- |
| `wordpress/` | WordPress backup and rollback files |
| `studio/` | Sanity Studio (marketing landing pages, posts, authors, categories, SEO) |
| `web/` | Astro site; owns core pages and renders routable Sanity content |
| `migration/inventory/` | URL, media, and integration inventories |

## Local setup

1. Create a Sanity project in the **Digital Command Studios** organization and a `production` dataset. Do not reuse the WinBench project.
2. Copy `studio/.env.example` to `studio/.env` and `web/.env.example` to `web/.env`. Set the same project ID and dataset in both.
3. In [Sanity manage](https://www.sanity.io/manage), allow CORS origins `http://localhost:3333` (Studio) and `http://localhost:4321` (Astro), with credentials.
4. Install and run:

```sh
npm install --prefix studio
npm install --prefix web
npm run dev:studio
npm run dev
```

Studio is at `http://localhost:3333`. The Astro site is at `http://localhost:4321`. Put WordPress exports and hosting snapshots in `wordpress/`; keep `wp-config.php` and tokens out of git.

## Page ownership

- **Core website pages:** the homepage and every live header-navigation destination are committed as explicit Astro routes in `web/src/pages`.
- **Marketing landing pages:** authored as `marketingPage` documents in Sanity and rendered by Astro's catch-all route.
- **Editorial posts:** authored in Sanity and rendered through the same catch-all to preserve legacy WordPress URLs.

Astro's static routes take priority over its catch-all. The Sanity Studio also prevents marketing documents from using reserved core paths, and the web build fails on duplicate routable paths.

See [route ownership](docs/ROUTE_OWNERSHIP.md) for the WordPress IDs and complete classification. Core-page snapshots are an interim parity baseline: tracking scripts and live submissions are removed, but some visual styles and media still reference public WordPress assets until the asset migration is complete.
