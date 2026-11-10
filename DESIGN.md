# DESIGN.md: Digital Command

## Source

- URL: https://digitalcommand.co/
- Local reference: http://127.0.0.1:4322/
- Capture date: 2026-11-09
- Evidence: saved WordPress HTML snapshots in `.firecrawl/`, imported core-page JSON, and a local full-page Chrome capture

## Reference Screenshot

![Local Digital Command home page](./.firecrawl/digitalcommand-local-screenshot.png)

Use this screenshot as the visual source of truth for hierarchy, density, and the relationship between the transparent navigation and hero.

## Design Summary

Digital Command uses a dark, cinematic consulting aesthetic. Deep navy and purple overlays sit over people-centered technology photography, with white uppercase headings, compact navigation, yellow highlights, and hard-edged outlined calls to action. Sections alternate between immersive full-bleed imagery and contained editorial panels.

## Design Tokens

### Colors

- Deep navy: `#160040`
- Brand purple: `#79018c`
- Highlight yellow: `#fed647`
- White: `#ffffff`
- Primary ink: approximately `#17131d`
- Muted text: approximately `#6e6e6e`
- Hero overlay: navy-to-purple gradient, normally 70–95% opacity

### Typography

- Headings: Rubik, bold, generally uppercase, tight line height around `1.1–1.2`
- Body: Karla, regular, line height around `1.6–1.65`
- Navigation and labels: uppercase, bold, wide tracking
- Large hero heading: approximately `44–64px` on desktop, scaling down responsively

### Spacing And Layout

- Content width: up to approximately `1200–1440px`
- Desktop navigation height: approximately `100px`
- Desktop outer gutters: approximately `5–8vw`
- Full-bleed hero with layered gradient and cover image
- Section rhythm: approximately `80–120px` vertical spacing on desktop
- Buttons use square or lightly rounded corners, uppercase labels, and generous horizontal padding

## Components

- Transparent/dark header with white logo and dropdown navigation
- Full-bleed photographic hero with eyebrow, large headline, supporting copy, CTA, and circular video trigger
- White or purple editorial panels that overlap adjacent sections
- Uppercase outlined CTA buttons
- Icon-led feature rows and social links
- Dark gradient footer with compact link columns and email capture
- Modal video lightbox with a dismiss button, backdrop click, and Escape-key support

## Page Patterns

- Core navigation pages preserve the shared header, footer, brand tokens, and hero structure.
- Primary core pages are owned by Astro and use real local routes.
- Marketing landing pages and blog content are generated from Sanity but share the same shell.
- Desktop dropdowns open on hover/focus; mobile navigation and submenus use explicit buttons and expanded-state attributes.

## Content Style

- Short imperative CTAs such as “Get Started.”
- Transformation-focused headlines with strong verbs.
- Concise supporting copy, usually one or two sentences.
- Avoid invented statistics, customers, testimonials, or capabilities.

## Agent Build Instructions

- Preserve the navy/purple photographic treatment and white uppercase hierarchy.
- Implement interactions in Astro-owned JavaScript; do not depend on Elementor or WordPress runtime scripts.
- Convert internal `digitalcommand.co` URLs to root-relative Astro routes while leaving external destinations intact.
- Treat `#elementor-action` video links as modal triggers and decode their base64 JSON settings.
- Keep all interactive controls keyboard accessible and expose expanded/modal state with ARIA.
- Maintain responsive behavior at desktop, tablet, and mobile widths.

## Rerun Inputs

```text
workflow: firecrawl-website-design-clone
source_url: https://digitalcommand.co/
target_stack: Astro + Sanity
output: DESIGN.md
```
