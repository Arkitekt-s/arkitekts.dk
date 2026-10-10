# Personal Journey — design draft for review

## Goal
Present **Soheil Fattahieh as a real person and capable hands-on engineer**. Build a large cinematic 3D landing journey with very short story chapters, controlled by native mouse-wheel/trackpad/touch scrolling and visible episode buttons.

## Draft source
- Website: `concepts/personal-journey/`
- Branch: `design/personal-cinematic-journey`
- Review PR: https://github.com/Arkitekt-s/arkitekts.dk/pull/1

This draft is separate from the original live homepage. Domain and DNS remain unchanged.

## Verified public WordPress sources used

- Portrait: `https://arkitekts.dk/wp-content/uploads/2026/06/soheil1-e1782845724382.png`
- Public biography, background and education: `https://arkitekts.dk/profile/`
- Skills and engineering focus: `https://arkitekts.dk/software-skills/`
- Public project list: `https://arkitekts.dk/portfolio/`
- Copenhagen housing-price prediction project: `https://arkitekts.dk/portfolio/copenhagen-amager-accommodation-price-prediction/`
- Existing technical guides, linked back to WordPress pending migration.

## Interaction model
1. Meet Soheil — real portrait and a short human introduction.
2. Systems that last — Linux, Elasticsearch, automation.
3. Code to delivery — Kafka and Logstash pipelines; tested production work.
4. Beyond the code — family, learning, travel, training and cooking.

The scene has procedural 3D server racks, data nucleus and a delivery portal. A pointer moves the camera; the **mouse wheel, trackpad and touch scroll** move between episodes. Clickable numbered controls and a next button are provided too. Reduced-motion and fallback visuals are maintained.

## Editorial template rules pending approval
- Immersive full-screen introduction only on the homepage.
- Clean, mostly white secondary pages: work, case studies, technical articles and contact.
- One consistent header, footer, fonts, colors, spacing and page component library.
- Preserve old WordPress page URLs, metadata and SEO at cutover.
- Avoid fictional numbers, invented work or sharing client confidential information.

## Unfinished
- The portrait is loaded from the existing WordPress domain. **Before DNS switch, export this and all other media to local GitHub assets**. The external portrait could stop loading after the WordPress site is retired.
- Real iOS Safari and Android WebGL quality/performance not tested.
- Full WordPress article and portfolio migration not done.
- Accessibility/performance audit pending.
- Design is not final or approved.
- `noindex,nofollow` is intentional until production launch.
