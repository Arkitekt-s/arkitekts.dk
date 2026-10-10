# Immersive Studio — Concept 05 (Triptych-inspired)

## Live preview

https://arkitekt-s.github.io/arkitekts.dk/concepts/immersive-studio/

**Status:** design proposal only — not final, not connected to domain, not indexed.

## What changed from Light Journey

Light Journey uses a contained 3D object and a scroll-driven panel.
Immersive Studio changes the fundamental composition:

- **A complete 100svh visual world** fills the screen instead of a small 3D card.
- A native scroll track moves an actual **Three.js camera** between four 3D compositions.
- An **original procedural engineering model** includes stylized server racks, data nucleus, secure flow lines and a production portal.
- Mouse/pointer motion introduces controlled camera depth on desktop.
- Semantic story captions change with the camera.
- After the experience, articles, work and contact become **readable white editorial sections**.
- No third-party model assets or artwork have been copied from Triptych.
- 3D is decorative; fallback renders when external module/WebGL is unavailable.
- Quality controls cap display resolution; render is skipped when out of view and paused when hidden.
- Reduced-motion mode and skip link are supported; reading requires no WebGL.

## Original reference

The inspiration is https://3dv2.triptych.co/ — specifically the **sense of immersive scale, cinematic visual composition, bold typography and visual storytelling**.

We have *not* reverse-engineered or copied its proprietary shaders, models, scripts, styling or commercial artwork.

## Product decisions to approve

1. Dark cinematic **intro only**, with a predominantly white body.
2. Hero copy: “I make complex systems work.”
3. Scroll through chapters: foundational infrastructure, connected systems, tested production delivery.
4. Work section includes real technical implementation, no invented metrics.
5. Final page templates share one strict design language: light reading backgrounds, restrained blue accent, identical navigation, typography and responsive rules.
6. The 3D experience is a carefully controlled enhancement, not a dependency of every page.

## Verification targets

Automated Playwright browser checks: 320, 390, 768 and 1440px viewports, no horizontal scroll, mobile menu, four story chapters, reduced-motion control, semantic white content sections, JavaScript error checks. Report and screenshots are saved as a GitHub Actions artifact.

**Not yet established:** WebGL stability on iPhone Safari, Android Chrome, low-power GPUs, full WCAG 2.2 AA compliance, Lighthouse/Web Vitals scores, WordPress content parity.

## SEO and migration boundaries

The concept uses `noindex,nofollow` so that Google should not index an unfinished site.
The WordPress domain and DNS are unchanged. The existing `main` branch still requires the protection rule to be configured by the repository owner.

After design approval:
- Freeze the tokens, navigation, layout and motion rules.
- Implement one reusable case-study layout and one reusable technical-article layout.
- Migrate every existing WordPress post/page/media with original permalinks or tested 301 redirects.
- Test on devices and measure Core Web Vitals.
- Obtain explicit approval before DNS cutover.
