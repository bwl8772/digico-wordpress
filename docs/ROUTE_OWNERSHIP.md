# Route ownership

This matrix was reconciled from the connected Digital Command WordPress MCP on 2026-11-09. The live **Header Menu** (WordPress menu ID `28`) is the source of truth for core website ownership.

## Astro core pages

The homepage and every internal page linked by the header navigation are explicit Astro routes. They cannot be claimed by a Sanity document.

| WordPress ID | Route | Navigation label |
| ---: | --- | --- |
| 1912 | `/` | Home/logo |
| 1402 | `/solutions` | Solutions |
| 9166 | `/launchpad` | AI Launchpad |
| 7692 | `/consulting` | Consulting |
| 9996 | `/get-navi` | Navi AI Orchestrator |
| 1958 | `/change-management` | Resiliency Services |
| 2845 | `/expert-network` | Expert Network |
| 1517 | `/digital-training` | Digital Skills Training |
| 8011 | `/resources` | Resources |
| 7997 | `/events` | Events |
| 7498 | `/webinars` | Webinars |
| 1376 | `/blog` | Blogs (Astro archive populated by Sanity posts) |
| 1475 | `/digital-academy` | Academy/Courses |
| 3579 | `/fellowship` | Digital Fellowship |
| 1950 | `/about-us` | About |
| 1485 | `/our-story` | Our Story |
| 2 | `/faq` | FAQs |
| 1983 | `/contact` | Contact |
| 1617 | `/230k-by-2030` | 230k by 2030 |

The external `Dr. Brian Lambert` navigation destination remains an external link and is not an Astro route.

## Sanity marketing landing pages

Published WordPress pages that are not in the header navigation become `marketingPage` documents in Sanity.

| WordPress ID | Route | WordPress title |
| ---: | --- | --- |
| 3 | `/privacy-policy` | Digital Command: Privacy Policy |
| 3929 | `/terms` | Digital Command: Terms and Conditions |
| 6752 | `/live` | The AI Lead Show with Dr Brian Lambert |
| 6880 | `/landing-page` | Landing Page |
| 8110 | `/expense` | Expense |
| 8362 | `/calendar` | Calendar |
| 8437 | `/capabilities` | Capabilities |
| 8578 | `/sitemap` | Sitemap |
| 8584 | `/fieldguide` | Field Guide |
| 8781 | `/lead` | Lead |
| 8964 | `/climb` | Climb |
| 9028 | `/switch` | Switch |
| 9386 | `/speed-layer` | Speed Layer – Accelerate Your Digital Command |
| 9418 | `/datadrag` | Data Drag |
| 9646 | `/ai-readiness` | AI Readiness |
| 9747 | `/getting-started-with-ai` | Getting Started with AI |

## Sanity blog content

All 70 published WordPress posts become `post` documents in Sanity. Their existing root-level paths are preserved. `/blog` remains an Astro-owned archive page that queries these documents. Authors and categories are separate referenced Sanity documents.

## Collision policy

- Astro static routes win at runtime.
- Studio validation blocks all routable documents from the core paths above.
- Studio validation checks marketing pages, posts, and category archives for duplicate paths.
- The Astro static build filters reserved core paths and fails if two Sanity documents resolve to the same route.
- API imports bypass Studio validation, so imports must run schema validation and a full Astro build before publication.
