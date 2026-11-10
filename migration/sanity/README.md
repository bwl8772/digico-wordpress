# Sanity import

`import.ndjson` is generated from the read-only WordPress MCP export in `../wordpress-export/`.

```sh
npm run sanity:prepare
npm run sanity:preflight
npm run sanity:import
```

The scripts load `studio/.env` and `web/.env`. They accept the repository's existing `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, and `SANITY_API_TOKEN` names as well as the generic `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `SANITY_API_WRITE_TOKEN` names.

`sanity:preflight` is read-only. It reports deterministic-ID matches and route conflicts. `sanity:import` refuses to replace existing deterministic IDs; after reviewing those documents, an intentional replacement can be run directly with `--commit --replace-existing`.

The import uses deterministic document IDs and `createOrReplace`, so it can be rerun before editors start changing migrated documents. After editorial work begins, use a delta/reconciliation workflow rather than replacing documents blindly.

Imported HTML is sanitized and stored in read-only `legacyHtml` fields so the original content can render immediately. Replace it with structured Portable Text/sections during page-by-page review. Featured images remain on their public WordPress URLs until the media importer uploads them to Sanity and rewrites references.

Never commit the write token. Run Studio validation and the Astro build before publishing the dataset or cutting over traffic.
