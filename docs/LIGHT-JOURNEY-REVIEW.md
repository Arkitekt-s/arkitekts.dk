# Light Journey — design review and standards

**Design status:** Interactive prototype for approval. Not approved for production.

## Preview URLs

- [Light Journey homepage](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/)
- [Case-study page using the same visual system](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/case-study/)
- [Technical article using the same visual system](https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/guide/)
- [All four design options](https://arkitekt-s.github.io/arkitekts.dk/concepts/)

## References and interpretation

- `https://3dv2.triptych.co/`: bold storytelling, immersive feeling, minimal copy; do not assume its exact implementation, load time or assets.
- `https://asklex.law/journey/`: chapter-by-chapter narrative, scroll motion and user-settable graphics/reduced-motion preferences.

Do not copy third-party visual assets, code or brand identity. The goal is an original design illustrating real engineering work.

## Layout rules — *candidate for design freeze*

Once the owner approves the template, these rules are shared for **every** page:

1. One design token palette and CSS source: `concepts/light-journey/assets/experience.css`.
2. One responsive navigation/header, page progress bar, typography and footer layout.
3. Consistent readable light background and contrast.
4. Home: hero, engineering journey, approved case studies, knowledge library, contact.
5. Case study: breadcrumb, real challenge, specific contribution, evidence, outcome.
6. Technical article: breadcrumb, table of contents, headings, diagrams, command examples, takeaways.
7. No random colors, font sizes or animation patterns added per article.
8. Animation must reinforce narrative and **never** hide information.
9. Preserve original WordPress slugs, canonical links and SEO before production DNS change.
10. No private system details, unsourced customer claims or fabricated metrics.

## Implemented interaction

- Pointer-responsive CSS 3D sculpture in the hero.
- Native-scroll four-stage delivery story.
- Lazy-loaded Three.js/WebGL geometry when nearing the sticky journey scene.
- Stage-linked camera/rotation changes and mouse motion.
- CSS fallback when WebGL is blocked or missing.
- Device-responsive breakpoints and a menu usable on narrow screens.
- Graphics-quality chooser and a reduce-motion toggle.
- Pause rendering when the scene leaves view or page becomes hidden.
- Existing technical article and case-study pages share one stylesheet and script.
- No scroll hijacking or forced blocking splash animation.

## Performance budgets to verify (targets, NOT measurements)

| Metric | Target |
| --- | --- |
| Mobile LCP | <= 2.5s at p75 on real user data |
| INP | <= 200ms at p75 |
| CLS | <= 0.1 |
| Lighthouse mobile Performance | >= 90 in repeat runs, if achievable on target hardware |
| Layout | No horizontal overflow at 320, 390, 768, 1440 px |
| Primary content | Visible without WebGL, no required 3D initialization |
| WebGL | Lazy loaded, pixel ratio capped, disabled automatically when reduced motion is preferred |

**Important:** A fast impression on a demonstration website is not a measured benchmark. These targets need independent validation using Lighthouse and real-world Core Web Vitals, and testing on weaker phones.

## Remaining before approving or changing DNS

- Approve primary headline, light palette, typography and interactive intensity.
- Confirm WebGL scene works in Safari iOS, Chrome Android and desktop browsers.
- Confirm keyboard navigation and screen reader behavior; run WCAG 2.2 audit.
- Capture current WordPress inventory and migrate every article/image and original metadata.
- Validate performance, page weight and missing assets under deployment conditions.
- Replace temporary `noindex,nofollow` with canonical URLs and a validated sitemap at the correct time.
- Protect the main branch using required PR and status checks (repository owner setting).
- Separate read-only public content from authenticated AI publishing integrations.
- Keep WordPress and existing domain DNS unchanged until approved cutover.

**Do not use this prototype to claim a performance score or a completed migration.**
