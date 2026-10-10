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
