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
