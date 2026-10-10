## Frame 02 — scroll into the full-screen movie

[**Open the zoom-transition demo**](https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-two-portal/)

**Frame 01 remains frozen and unchanged.** Scroll down to enlarge the original moving mountain arches into a continuous full-screen movie; new text enters after the zoom. Scroll up to reverse the same journey. The fixed header and footer remain visible. Tested at 320, 390, 768 and 1440px.

[GitHub design PR #7](https://github.com/Arkitekt-s/arkitekts.dk/pull/7) · [Detailed interaction plan](docs/FRAME-TWO-PORTAL-REVIEW.md) · [Automated tests](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/frame-two-portal.yml)

This is a review preview, not yet approved as final Frame 02. Production homepage, WordPress and DNS stay unchanged.

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



## Frame 01 — moving footage and reactive mouse patterns

**[Open the live first-frame design](https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-one-live/)**

Three arches now play real, optimized mountain footage (self-hosted WebM/MP4). Move the mouse to create luminous pathways and a responsive grid. Press and hold to zoom. The header and footer remain fixed within one continuous cinematic composition. The first frame is the **only** page being redesigned and awaits owner approval.

[Review PR #5](https://github.com/Arkitekt-s/arkitekts.dk/pull/5) · [Video and mouse test results](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/frame-one-live.yml) · [Design and media notes](docs/FRAME-ONE-LIVE-REVIEW.md)

## Cinematic Interaction V2 — new landing prototype

[**Open the interactive landing draft**](https://arkitekt-s.github.io/arkitekts.dk/concepts/stage-deck-v2/) · [Review PR #3](https://github.com/Arkitekt-s/arkitekts.dk/pull/3) · [Design notes](docs/STAGE-DECK-V2-REVIEW.md)

This is a separate concept. The current homepage and WordPress domain are unchanged. Header and footer stay pinned; wheel/trackpad/swipe move between four frames using zoom-through motion. Additional interactions include press-and-hold perspective, a draggable portrait/server gallery, an illustrative Linux/Ansible terminal, and a draggable/zoomable dotted globe accurately marking Copenhagen at 55.6761° N, 12.5683° E.

The focused browser workflow passed at **320, 390, 768 and 1440px**. Actual hardware, accessibility and performance benchmarks remain to be completed. Images are temporarily served from external sources; these must be transferred before DNS cutover. **Do not apply the visual template across other pages before user approval.**

## New fixed-frame cinematic landing (design review)

**Prototype 07 — Stage Deck** is now available at:

https://arkitekt-s.github.io/arkitekts.dk/concepts/stage-deck/

The header, footer and grid remain completely fixed. Mouse wheel, touch gestures, arrow keys, and frame markers change only the **center screen** through four scenes: panoramic arches → portrait/photo reel → work/profile navigation → interactive dotted globe/contact. The root homepage has NOT been replaced and DNS is unchanged.

- [Preview the fixed-frame landing](https://arkitekt-s.github.io/arkitekts.dk/concepts/stage-deck/)
- [Design requirements and media provenance](docs/STAGE-DECK-REVIEW.md)
- [Design PR and code review](https://github.com/Arkitekt-s/arkitekts.dk/pull/2)

**Design approval pending:** This prototype is intentionally `noindex,nofollow`. Copy the real portrait and other approved media locally before moving DNS. No other site templates should be redesigned until the owner chooses the fixed-frame design.

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
