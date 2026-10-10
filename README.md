# arkitekts.dk — Premium GitHub migration

**Status:** Homepage code is committed. GitHub Pages requires initial enablement in Settings → Pages. WordPress and DNS remain unchanged.

## Preview
[Free GitHub Pages preview](https://arkitekt-s.github.io/arkitekts.dk/) — available after the Pages workflow succeeds and Pages is enabled.


## Choose your design

Six deployed concept previews are available before the WordPress migration. They do **not** replace the current homepage:

- [Compare all three](https://arkitekt-s.github.io/arkitekts.dk/concepts/)
- [01 · Atlas — Precision](https://arkitekt-s.github.io/arkitekts.dk/concepts/atlas/)
- [02 · Nordic — Executive](https://arkitekt-s.github.io/arkitekts.dk/concepts/nordic/)
- [03 · Signal — Mission Control](https://arkitekt-s.github.io/arkitekts.dk/concepts/signal/)
- [04 · Light Journey — White + 3D](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/)
- [05 · Immersive Studio — full-screen cinematic 3D](https://arkitekt-s.github.io/arkitekts.dk/concepts/immersive-studio/)
- [06 · Personal Journey — photo + 3D + real biography](https://arkitekt-s.github.io/arkitekts.dk/concepts/personal-journey/)
- [Personal Journey review notes](docs/PERSONAL-JOURNEY-REVIEW.md)
- [Light Journey — case-study template](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/case-study/)
- [Light Journey — technical article template](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/guide/)
- [Design review notes](docs/DESIGN-CONCEPTS.md)
- [Interactive 3D concept and performance targets](docs/LIGHT-JOURNEY-REVIEW.md)
- [Immersive Studio concept decisions](docs/IMMERSIVE-STUDIO-REVIEW.md)

**Verified:** GitHub Pages deployment and website validation completed successfully on 2026-10-10.
**Not yet verified:** real mobile browser usability, Core Web Vitals and full WordPress content parity.
**Safety:** All previews intentionally use `noindex,nofollow`. Do not change the domain DNS yet.

## Progress
| Step | Status |
| --- | --- |
| Premium homepage design | ✅ Built and locally checked |
| Responsive phone/tablet/desktop layout | ✅ Implemented; real-device review pending |
| Source code & tracking on GitHub | ✅ Uploaded |
| GitHub Pages deployment | ⚠️ Blocked until Pages is enabled |
| Full WordPress posts / images migration | ⏳ Not started |
| SEO, old URL retention, redirects | ⏳ Not started |
| DNS cutover | 🔒 Do not change |

See [Progress tracker](docs/PROGRESS.md) · [Commits](https://github.com/Arkitekt-s/arkitekts.dk/commits/main/) · [Actions](https://github.com/Arkitekt-s/arkitekts.dk/actions).

**Preview only:** The new page intentionally blocks search engine indexing until old content and SEO are preserved. WordPress stays online.

## Deployment
Go to **Settings → Pages → Build and deployment → GitHub Actions**. Changes to `main` are published by the Actions workflow. Never change the domain DNS before reviewing the preview.

## Technologies
Static HTML, CSS, JavaScript, GitHub Actions and GitHub Pages. The site prioritizes modern design, speed, keyboard access, reduced-motion support, and smaller screens.

## Production checklist
Export WordPress articles, portfolio, media and old URLs; preserve the original slugs or redirects. Migrate media locally and verify contact forms and mail. Check mobile, desktop, performance, accessibility, links, canonical URLs, sitemap and robots policies. Keep a rollback path. Only then switch the web DNS records, preserving MX/SPF/DKIM/DMARC email records.
