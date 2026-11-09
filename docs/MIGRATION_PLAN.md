# Digital Command: site migration plan

Status: foundation setup, 2026-11-09. WordPress remains live. This is a migration plan, not a certification that the new site is complete or pixel-perfect.

A public Firecrawl map found 36 candidate URLs, recorded as unverified in `migration/inventory/urls.csv`. It is a discovery sample, not a complete census, and does not establish current status codes, canonical URLs, redirects, or media and form coverage.

## Goal and decisions

Recreate the existing site faithfully at desktop, tablet and mobile sizes, while making landing-page content and blog posts manageable in Sanity. Preserve existing indexed URLs, inbound links, metadata, media, tracking and business-critical form behavior. A new implementation must be tested against captured references rather than judged by memory.

**Framework:** Astro frontend in `web/` plus a separate Sanity Studio in `studio/`. Astro owns core website pages as explicit routes. Sanity owns marketing landing pages and editorial posts, which Astro renders at their preserved paths. WordPress backups stay in `wordpress/`. Hosting, staging domain, deployment access, and the Sanity project/dataset still need the owner’s project ID; the MCP robot token cannot create that project. Sanity's [Astro integration documentation](https://www.sanity.io/docs/astro) covers the client used by `web/`.

## 1. Inventory and evidence baseline

- Establish a read-only WordPress MCP connection and identify its account, site, scope and pagination. Export all public pages, posts, categories, tags, authors, menus, reusable blocks, media metadata and existing redirect rules; count each class and identify inaccessible or draft content. Keep credentials out of the repo and exports.
- Reconcile the WordPress exports against XML sitemaps, public navigation, crawl results, analytics/search-console landing URLs and known inbound links. Capture original paths **including trailing slashes**, query-string behavior, canonicals, status codes, redirect chains, feeds and attachment URLs. Record each in `migration/inventory/urls.csv` with its target and verification status. A crawl alone cannot establish completeness.
- For every relevant page, record visible layout, copy, fonts and licensing, colors, spacing, interactions, responsive breakpoints, SEO title/description, canonical, Open Graph, structured data, headings and embedded third-party content. Save approved desktop/tablet/mobile screenshots and reference URLs. Compare matching viewport sizes, browser and stable content states.
- Inventory images, videos, posters, captions, alt text, dimensions, filenames, original URLs, file size, rights and usage per page. Distinguish files hosted on WordPress from YouTube/Vimeo or other external embeds. Track availability, migration destination and validation in `media.csv`; do not assume thumbnails represent original media. Export originals where authorized, verify checksums and accessible delivery, and retain or redirect old asset URLs for external embeds.
- Inspect rendered pages and authorized tag-manager configuration for GTM container IDs, data layer, triggers, events, consent state, embedded tags and ownership. Record forms, fields, validation, spam controls, destinations, notifications, CRM mappings, success/error states and analytics events in `integrations.csv`. Do not record submissions or secrets in source control.
- Resolve the previously configured WordPress MCP in the active session; successful OAuth setup alone is not proof of a working read. If it is unavailable, obtain an authorized export or access through the existing administration workflow. Save inventories and export manifests without committing personal information or credentials.

## 2. Architecture and Sanity setup

- Create or select the intended Sanity project and dataset with the owner; set least-privilege roles, API version, permitted origins and separate development/production settings. Never commit write tokens. Agree whether editors need draft preview and visual editing; select hosting/rendering accordingly.
- Model reusable page sections, navigation, site settings, page and post SEO, authors, categories, rich text, images with alt/crop/hotspot, and video/embed references. Use structured fields for common patterns and explicitly model exceptions needed for visual parity; preserve source identifiers and original URLs for repeatable imports.
- Define route ownership before coding: retain existing paths and slash policy wherever feasible; allocate a route to each page/post/taxonomy/archive and prevent collisions. Decide how previews, pagination, feeds, 404s and legacy attachment URLs work. Redirect only when a path must change and the destination is equivalent; avoid chains and preserve query strings where meaningful.
- Build a safe import pipeline with dry-run, source-to-target mapping, deterministic identifiers and resumable retries. Download or migrate authorized assets, deduplicate by verified content where appropriate, retain source URL mappings and reconcile missing files. Preserve rich-text links, embeds and content dates; don't publish drafts or overwrite later editorial changes without an explicit policy.

## 3. Rebuild and validate

- Implement shared header/footer/navigation, typography, responsive styles, page sections and blog templates against the captured baseline. Use a representative landing page and blog post as vertical slices, then cover every approved template and exception. Do not describe screenshots as pixel-perfect until compared and approved.
- Connect published Sanity content to page and blog rendering. Provide robust empty/not-found/error behavior and an explicit publish/build or revalidation workflow. Validate accessibility, keyboard navigation, semantic headings, mobile performance and image/video loading.
- Reproduce verified GTM setup and consent behavior in staging without double-loading containers or sending test conversions into production analytics. Confirm data-layer event names and payloads with the owner; use a safe test container or preview mode where available.
- Rebuild or embed each form against its real destination only after documenting the integration. Exercise validation and success/error paths with approved test destinations; verify notifications, CRM mapping, spam controls, accessibility and events. Do not submit real leads or send messages as test traffic without approval.
- Use automated route checks for every inventoried source URL and media reference, sitemap/canonical/metadata checks, link checking, accessibility checks and cross-device visual comparisons. Reconcile all exceptions; test high-value landing and blog journeys manually, including video playback and forms.

## 4. Release and rollback

- Before cutover, freeze or reconcile editorial changes and run a final delta import. Compare counts and source IDs; check asset checksums and a complete URL/redirect matrix. Back up WordPress content, media, configuration and redirect rules; retain a working rollback target.
- Get owner approval for the staging review, tracking/forms signoff, DNS/hosting plan and cutover window. Confirm TLS, canonical domain, robots/noindex settings, caching, sitemap and search-console submission. Apply changes only after approval.
- After cutover, monitor crawl errors, broken links, forms, events, Core Web Vitals and logs; run the same checks against the live domain. Keep rollback instructions and the previous site available for an agreed period. Production is not done until the owner has reviewed the results.

## Acceptance gates

1. Inventory reconciled: no unexplained source URLs, published content or referenced media missing.
2. Approved visual baselines match at agreed viewports with documented exceptions; all page templates and key interactions reviewed.
3. Every old URL has the intended live response, equivalent redirect or an explicitly approved retirement; internal links and critical asset URLs work.
4. Blog and landing content can be edited and published through the agreed Sanity workflow; media, SEO fields and preview behavior work.
5. GTM, consent, forms and downstream delivery/events are verified using approved test methods without contaminating production data.
6. Accessibility, performance, functional and rollback checks pass; owner approves production cutover.

## Immediate next actions

1. Create the Digital Command Website Sanity project in the Digital Command Studios organization, add local CORS origins, and put the project ID in `studio/.env` and `web/.env`.
2. Restore or start a session with the WordPress MCP and confirm a read-only connection. Inventory content and site configuration; do not assume the OAuth grant confirms access.
3. Capture the current public site and populate the inventories. Record inaccessible sources and open decisions; avoid asserting total counts until pagination and cross-source reconciliation are complete.
4. Import one representative page and one post into Sanity, then match them against the captured baseline before scaling the migration.
