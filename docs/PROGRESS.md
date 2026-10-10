# arkitekts.dk — live migration progress

Updated: 2026-10-10

## Milestone 1 — Premium homepage preview

- [x] Connected GitHub account and established write permissions for `Arkitekt-s/arkitekts.dk`
- [x] Published a tracking README
- [x] Added polished responsive desktop, tablet and mobile homepage
- [x] Added accessible mobile navigation and reduced-motion support
- [x] Added SVG favicon, local CSS and JavaScript
- [x] Added GitHub Pages deployment workflow
- [x] Added automated website validation workflow — first run passed
- [ ] Enable branch protection requiring pull requests and the `Site integrity` check (must be set by repository owner in Settings)
- [ ] GitHub Pages requires initial activation: Settings > Pages > Build and deployment > GitHub Actions
- [ ] Verify successful Actions deployment and HTTPS preview URL
- [ ] Check actual phone, tablet, desktop and narrow phone devices
- [ ] Run Lighthouse, accessibility and link audits

## Milestone 2 — WordPress migration

- [ ] Grant `wordpress-mcp` GitHub access and audit its source
- [ ] Verify WordPress agent connectivity without publishing or overwriting posts
- [ ] Create a complete inventory of pages, posts, permalinks and metadata
- [ ] Export and migrate images, original assets and interactive 3D model
- [ ] Migrate portfolio and technical guides at original URLs
- [ ] Replace WordPress contact form with a secure working alternative
- [ ] Test 404s, redirects, page titles, canonical tags, sitemap and social previews

## Milestone 3 — Production launch

- [ ] Confirm full mobile, tablet and desktop parity and performance
- [ ] Remove temporary `noindex,nofollow` protection and set SEO canonical/sitemap
- [ ] Back up complete WordPress files and database
- [ ] Confirm a rollback plan
- [ ] Preserve all MX, SPF, DKIM and DMARC DNS records
- [ ] Point only relevant web DNS records to GitHub Pages after approval
- [ ] Verify HTTPS, search visibility and analytics after switch

## Key links

- [Source files](https://github.com/Arkitekt-s/arkitekts.dk)
- [Commit history](https://github.com/Arkitekt-s/arkitekts.dk/commits/main/)
- [Builds and deployments](https://github.com/Arkitekt-s/arkitekts.dk/actions)
- [GitHub preview (once deployed)](https://arkitekt-s.github.io/arkitekts.dk/)
- [WordPress live site](https://arkitekts.dk/)

> WordPress site remains live and DNS is unchanged. Category guide rows are visual placeholders, not migrated posts. No user testimonials or fictional client work has been inserted.


## Milestone 1b — Design selection (2026-10-10)

- [x] Published [comparison gallery](https://arkitekt-s.github.io/arkitekts.dk/concepts/)
- [x] Published [Atlas / Precision](https://arkitekt-s.github.io/arkitekts.dk/concepts/atlas/)
- [x] Published [Nordic / Executive](https://arkitekt-s.github.io/arkitekts.dk/concepts/nordic/)
- [x] Published [Signal / Mission Control](https://arkitekt-s.github.io/arkitekts.dk/concepts/signal/)
- [x] Automated 16 real-browser checks across 320px, 390px, 768px and 1440px viewports
- [x] Confirmed responsive layout, navigation toggles, Escape behavior and JavaScript console errors
- [x] Captured 16 screenshots in the [GitHub Actions visual-review run](https://github.com/Arkitekt-s/arkitekts.dk/actions/runs/38036599455)
- [ ] Owner selects design and approves copy
- [ ] Replace generic case summaries with approved, non-confidential work examples
- [ ] Migrate original WordPress pages, posts and media

**All browser review checks passed.** Screenshot artifacts remain downloadable from Actions for 14 days. This does not establish WCAG compliance or production-readiness.


## Milestone 1c — Light interactive 3D prototype (2026-10-10)

- [x] Reviewed Triptych and AskLex as **inspiration**, without reusing their code or brand assets
- [x] Built [white Light Journey concept](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/)
- [x] Added CSS pointer-responsive 3D hero and genuine WebGL journey scene
- [x] Connected four engineering-story stages to native browser scrolling
- [x] Optimized rendering: lazy 3D loading, quality chooser, pause offscreen, reduced-motion fallback
- [x] Built [case-study template](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/case-study/) and [technical article template](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/guide/) sharing the same tokens, CSS and JS
- [x] Fixed content overflow at 320px and 390px
- [x] Added compact sticky scene for narrow phones
- [x] Responsive browser checks on homepage + templates (320, 390, 768, 1440px), mobile menu, scene behavior and JS syntax
- [ ] Confirm visual preference, typography and storytelling with site owner
- [ ] Independently benchmark mobile Core Web Vitals / Lighthouse
- [ ] Test hardware-accelerated WebGL on actual iOS/Android devices
- [ ] Migrate all original WordPress content; **do not change DNS yet**

[Design rules and acceptance targets](LIGHT-JOURNEY-REVIEW.md)


## Milestone 1d — Immersive Engineering Studio, concept 05 (2026-10-10)

- [x] Built a separate [cinematic full-screen 3D preview](https://arkitekt-s.github.io/arkitekts.dk/concepts/immersive-studio/)
- [x] Procedurally modeled server racks, a data-flow nucleus, connections and a production portal with Three.js
- [x] Four native-scroll 3D camera chapters; responsive desktop pointer movement
- [x] Kept main content sections on readable white backgrounds
- [x] Kept global navigation visible and changed its colors on white sections
- [x] Added quality settings, a motion control and a CSS fallback
- [x] Fixed the initial 3D renderer error and headline clipping found by tests
- [x] Passed [responsive browser validation](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/visual-review.yml) at 320px, 390px, 768px and 1440px
- [ ] Design approval: visual direction, 3D intensity and mobile typography
- [ ] Detailed performance benchmarks and real hardware/WebGL testing
- [ ] Apply one final design system to the case-study and article templates
- [ ] Migrate original WordPress pages, articles, media and SEO before a DNS switch

[Design proposal and technical boundaries](IMMERSIVE-STUDIO-REVIEW.md)

**No domain change.** Existing drafts remain available. Prototype content is intentionally marked `noindex`.

## Milestone 1e — Personal cinematic journey (2026-10-10)

- [x] Retrieved public WordPress profile details, biography and published project links
- [x] Used the actual portrait from the existing WordPress site (temporary external media dependency)
- [x] Built a separate [Personal Journey preview](https://arkitekt-s.github.io/arkitekts.dk/concepts/personal-journey/)
- [x] Added four full-screen 3D episodes with mouse-pointer depth, native scrolling and clickable episode controls
- [x] Added personal stories, degree background, real project links and technical guides
- [x] Kept white backgrounds for long-form reading
- [x] [GitHub PR #1](https://github.com/Arkitekt-s/arkitekts.dk/pull/1) passed browser checks and was merged as a **standalone concept only** — the site homepage was not replaced
- [x] Passed responsive browser tests at 320, 390, 768 and 1440 px; no detected horizontal overflow or JS errors
- [ ] Owner chooses and approves the personal design and the balance of 3D/white content
- [ ] Export portrait and all media from WordPress to local GitHub assets before changing DNS
- [ ] Migrate complete WordPress site including page slugs, metadata and SEO
- [ ] Real-device testing, Lighthouse and full accessibility audit

This is still a **draft prototype**, not the selected final site theme. See [design review and source notes](PERSONAL-JOURNEY-REVIEW.md).

## Milestone 1f — Fixed-frame cinematic landing (2026-10-10)

- [x] Implemented permanent fixed header, footer, and background grid matching the reference structure
- [x] Built frame 01: panoramic photo arches + concise headline
- [x] Built frame 02: personal photo reel using the real publicly hosted portrait
- [x] Built frame 03: Work / About / Guides hub
- [x] Built frame 04: animated mathematical 3D dot globe with contact
- [x] Implemented mouse-wheel, trackpad, swipe, keyboard, numbered frame controls
- [x] Verified page does **not** scroll between frames; header/footer remain stationary
- [x] Corrected headline clipping detected in screenshot review
- [x] Preloaded the real portrait to avoid a blank photograph in mobile scene transitions
- [x] Browser checks passed at 320/390/768/1440px, including real portrait loading and JavaScript syntax
- [x] Reviewed and merged [Pull Request #2](https://github.com/Arkitekt-s/arkitekts.dk/pull/2) as an **isolated concept**; the site's existing homepage is unchanged
- [ ] User approves the fixed-frame design, copy and visual level
- [ ] Only then freeze shared tokens/header/footer and create page templates
- [ ] Save WordPress images locally and migrate original articles/projects
- [ ] Real-device speed and accessibility audits; no DNS cutover before approval

[Try the new fixed-frame stage deck](https://arkitekt-s.github.io/arkitekts.dk/concepts/stage-deck/) · [Read the design contract](STAGE-DECK-REVIEW.md)


## Milestone 1g — Cinematic interaction V2 (2026-10-10)

- [x] Kept the fixed header, fixed footer, and four-frame template approved as a foundation
- [x] Added original **zoom-through frame transitions** and intensified pointer-controlled depth
- [x] Added press-and-hold scene exploration and a draggable photographic reel
- [x] Added server photography, a Linux/Ansible terminal illustration and engineering-focused deployment visuals
- [x] Added a draggable **geographic globe** with the real Copenhagen coordinate: 55.6761° N, 12.5683° E
- [x] Added dedicated pointer/touch globe rotation, zoom by buttons and mouse wheel, keyboard rotation and Copenhagen reset
- [x] Fixed narrow-phone globe pointer overlap and interactive arch JavaScript errors from initial browser tests
- [x] Tested 320/390/768/1440px: fixed layout, four frames, mouse parallax, drag gallery, globe rotation and zoom, Copenhagen marker and no JS exceptions
- [x] Merged [PR #3](https://github.com/Arkitekt-s/arkitekts.dk/pull/3) as an isolated preview; root homepage and WordPress domain remain untouched
- [ ] Owner approval of [cinematic design V2](https://arkitekt-s.github.io/arkitekts.dk/concepts/stage-deck-v2/)
- [ ] Real-device Safari/Android accessibility and performance testing
- [ ] Self-host media, then migrate source pages and article templates after the design is approved

[Detailed feature review](STAGE-DECK-V2-REVIEW.md) · [Focused interaction test workflow](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/cinema-review.yml)

## Milestone 1h — Frame 01 first-only redesign (2026-10-10)

- [x] Kept the fixed header, fixed footer, dark background and fine grid foundation
- [x] Rebuilt **only** the first landing frame, preserving the other frames untouched
- [x] Created three tall original panoramic arches with an independently sourced landscape photo
- [x] Added subtle idle animation: moving scenery, drifting cloud layers and light haze
- [x] Added mouse-driven parallax and **press-and-hold zoom into landscape**
- [x] Added pause-motion, reduced-motion and keyboard support
- [x] [Pull request #4](https://github.com/Arkitekt-s/arkitekts.dk/pull/4) checked and merged as a standalone preview
- [x] Chromium browser tests passed at 320px, 390px, 768px, 1440px, including no horizontal overflow and stationary header/footer
- [ ] **Owner design review:** Approve or request changes to Frame 01 before any further frames
- [ ] Performance, iOS Safari/Android, and accessibility testing on real devices
- [ ] Self-host the approved photo asset before eventual DNS cutover

**New isolated first-frame preview:** https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-one-v3/

The existing root homepage is unchanged. This preview uses `noindex,nofollow`, DNS is unchanged, and Frames 2–4 will not be redesigned until Frame 01 is approved.

## Milestone 1i — Live mountain Frame 01 (2026-10-10)

- [x] Kept the header/footer/background grid unified across the same frame
- [x] Replaced fake-photo motion with **real moving mountain/cloud video** in all three panoramic arches
- [x] Downloaded and optimized licensed Pexels footage, served by this repository as a 12-second H.264 MP4 + VP9 WebM
- [x] Eliminated third-party video streaming dependencies
- [x] Added cursor-generated luminous paths, deforming lattice/grid pattern, magnetic rings and intensified press-and-hold perspective
- [x] Preserved reduced-motion fallback and explicit pause control
- [x] Browser checks confirmed the movie *actually plays and advances*, pointer canvas renders, motion pauses, desktop/mobile layouts stay fixed with no JS exceptions
- [x] [Pull Request #5](https://github.com/Arkitekt-s/arkitekts.dk/pull/5) merged as isolated preview only — existing root site unchanged
- [ ] Owner review of first-frame composition, video content and mouse patterns
- [ ] Measure real-device performance and check Safari/iOS and Android
- [ ] Lock the approved first frame before creating Frame 02

[Try Frame 01 Live](https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-one-live/) · [Test workflow](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/frame-one-live.yml) · [Source and licensing](FRAME-ONE-LIVE-REVIEW.md)

No WordPress or DNS changes were made. Frame 02, 03 and 04 have not been altered.
