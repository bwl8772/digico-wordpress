# Migration inventories

The URL inventory starts with 36 unverified candidates from a public Firecrawl map dated 2026-11-09. They are discovery leads, not verified live responses or a complete census. The media and integration templates are empty; this does not mean the site has no assets or integrations. Record evidence, targets and status as each entry is verified. Avoid credentials, submitted form data and other personal information.

- `urls.csv`: one row per original URL or route pattern, including redirects, feeds and asset paths that have inbound links.
- `media.csv`: one row per original asset and its destination; use a stable ID and record page references separately where needed.
- `integrations.csv`: one row per form, tracking container, event, embed or external service, including safe verification method and owner.

Use CSV quoting for commas or newlines. Reconcile exports against the live site, sitemap and analytics/search-console evidence; retain counts and unresolved items in the migration plan or a dated evidence note.
