# Design review — four portfolio directions

**Status:** Four public GitHub Pages previews published. They are concept samples, not final WordPress migrations. No DNS change.

## Review gallery

- **Compare all three:** https://arkitekt-s.github.io/arkitekts.dk/concepts/
- **01 Atlas — Precision:** https://arkitekt-s.github.io/arkitekts.dk/concepts/atlas/
- **02 Nordic — Executive:** https://arkitekt-s.github.io/arkitekts.dk/concepts/nordic/
- **03 Signal — Mission Control:** https://arkitekt-s.github.io/arkitekts.dk/concepts/signal/
- **04 Light Journey — White 3D:** https://arkitekt-s.github.io/arkitekts.dk/concepts/light-journey/
- **First homepage draft:** https://arkitekt-s.github.io/arkitekts.dk/

## Design options

| Concept | Positioning | Visual identity | Strength | Trade-off |
| --- | --- | --- | --- | --- |
| **Atlas / Precision** | Experienced engineer who delivers | Navy, icy blue, structured workflow | Most balanced for enterprise / DevOps credibility | Less playful |
| **Nordic / Executive** | Clear-headed senior engineer | Warm white, deep green, editorial serif | Most distinctive and readable | Less obviously technical |
| **Signal / Mission Control** | Hands-on systems specialist | Midnight, lime, terminal workflow | Strongest immediate technical feel | Could feel too developer-focused for some audiences |
| **Light Journey / Interactive 3D** | Practical engineer with a guided story | Warm white, deep blue, scroll-controlled WebGL | Combines readability with immersive engineering process | 3D rendering needs performance and compatibility audits |

## Content standards

All three prototypes intentionally feature strengths the portfolio owner has described:

- Implementing and operating production Elasticsearch platforms.
- Automating Linux infrastructure using Ansible and GitHub.
- Working with Kafka, Logstash, ingestion and secure access.
- Testing deployments and delivering environments.
- Hands-on troubleshooting and production operations.

Avoid fabricated uptime percentages, customer logos, certifications, staff sizes, awards or client statistics.
No private environment names, infrastructure details or credentials appear in these prototypes.
Do **not** use 'architect' as the personal job title.

## Decisions before production work

1. Choose a leading concept (or a blend, such as Atlas + Nordic typography).
2. Confirm hero copy and title.
3. Replace high-level illustrative work cards with approved, specific achievements (without sensitive client details).
4. Migrate WordPress portfolio, articles, media and metadata; preserve original URLs.
5. Check keyboard, WCAG, real iOS/Android/desktop, Lighthouse and Core Web Vitals.
6. Add real project detail pages, article templates, internal links, schema and contact processing.
7. Only after successful checks and approval change DNS.

## Current limits

- Static previews, not finished sites.
- The guide library is not migrated.
- Technical illustrations are **concepts**, not live infrastructure dashboards.
- The only contact action is `mailto:`, not a working backend form.
- Each concept intentionally has `noindex,nofollow` until production-ready.
- GitHub Actions deployment and structural checks have passed; real-device and automated accessibility performance tests are still pending.
- Branch protection must be enabled by the repo owner in GitHub Settings. Do not assume `main` is protected.

## Review test

Open each at 1440px desktop, 768px tablet, and 375px / 320px mobile. Check hero text, card layout, menu, legibility, keyboard focus, and no horizontal overflow.
