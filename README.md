# arkitekts.dk — Premium GitHub migration

**Status:** Homepage code is committed. GitHub Pages requires initial enablement in Settings → Pages. WordPress and DNS remain unchanged.

## Preview
[Free GitHub Pages preview](https://arkitekt-s.github.io/arkitekts.dk/) — available after the Pages workflow succeeds and Pages is enabled.

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
