# WordPress backup

This folder is the WordPress snapshot and rollback target. The live WordPress site remains the source of truth until cutover.

Put hosting files, XML exports, and media dumps here. Do not put `wp-config.php`, `.env` files, or other secrets in git.

| Path | Use |
| --- | --- |
| `public_html/` | WordPress document root (core, themes, plugins) |
| `private_html/` | Hosting private files, if present |
| `exports/` | Database, WXR, or JSON exports |
| `conf/`, `logs/`, `ssl/`, `tmp/`, `git_repo/` | Hosting snapshot folders from the original app |

After restoring a backup into `public_html/`, keep credentials local. The Astro site lives in `../web` and Sanity Studio in `../studio`.
