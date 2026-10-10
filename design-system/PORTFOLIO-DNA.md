# SOHEIL — Approved portfolio design DNA

## Baseline is preserved

The five-frame cinematic homepage at `concepts/frame-five-contact/` is the approved source of truth.
A separate **`baseline/five-frame-approved-v1`** branch preserves the last approved homepage before the new Contact page.
This baseline contains the mountain openings, purple typography, reactive **10**, seven-photo
sequential gallery (beginning with photo 01), last-photo dark fade, and enlarged transparent
Copenhagen globe. No existing cinematic scene should be restyled as part of subpage work.

The new companion `contact/` is deliberately **bright**, showing how the same identity translates
between light and dark designs. Keep the WordPress live site and DNS unchanged until migration.

## Reusable identity

- Wordmark: **S.** and **S O H E I L**.
- Typography: large tight-spaced modern sans with deliberate *Georgia italic* moments.
- Supporting copy: small all-caps monospaced labels and precise section indices.
- Color: near-black `#17111e`, deep violet `#773c9d`, lilac accent `#a54bd0`.
- Page atmosphere: thin technical gridlines, layered violet light, minimal translucent surfaces.
- Interaction: gentle ease-out motion, hover-driven arrows, progressive reveals, pointer parallax.
- Navigation: shared five-link header (**PORTFOLIO**, **PROFILE**, **SKILLS**, **GUIDES**, **Let's talk**), home-linking S. brand, keyboard access, clear mobile menu, and reduced-motion support.
- Layout: generous whitespace, large headings, quiet fixed-feeling header/footer.

## Route map

- **Five-frame homepage:** `/concepts/frame-five-contact/` — unchanged scene structure.
- **Bright contact:** `/contact/` — opens from both **Let's talk** links on the five-frame homepage.
- **Skills:** `/software-skills/` — new bright skills page with category filters and live search.
- **Profile:** `/profile/` — bright biography and education page, with section navigation.
- **Portfolio:** `/portfolio/` — six original projects, locally hosted screenshots, searchable filters and detailed case summaries. All five header links stay inside the GitHub preview.
- **Six project pages:** `/portfolio/{project-slug}/` — standalone original-source case studies, shared header/footer, project images, previous/next project navigation, and real copy-link controls.

GitHub Pages base path in preview: `https://arkitekt-s.github.io/arkitekts.dk/`.
All new internal URLs are relative, so moving the site to a custom domain is straightforward.

- **AI-Powered Technical Guides:** `/technical-guides/` — searchable catalog of published WordPress-MCP articles, with full individual article routes `/technical-guides/{post-slug}/`.

## AI Technical Guides publishing workflow

The `Arkitekt-s/wordpress-mcp` project generates **WordPress drafts** using its locked HTML/CSS templates. This project does not modify those templates or publish drafts. After a guide is reviewed and published on WordPress:

1. The hourly `.github/workflows/sync-technical-guides.yml` checks the **public published** posts REST API (fallback to RSS).
2. `scripts/sync_technical_guides.py` updates the GitHub catalog and creates/updates a static page for each guide.
3. The sync commits only changed guide data/pages and triggers the existing Pages deployment workflow.
4. Existing guides survive WordPress outages, and drafts are never mirrored.
5. `workflow_dispatch` allows an immediate sync from GitHub Actions without waiting for the hourly check.

The eleven already-published guides are seeded in `technical-guides/guides.json`.
WordPress remains the source of truth. No WordPress credentials or publication permissions are needed.
Each page links back to its original WordPress article. The preview remains `noindex,nofollow` until migration.

## Portfolio page content

Migrates six published WordPress case studies: Web Development, Apartment Valuation,
Full-Stack Grocery Delivery, Basecamp Response Monitor, ShopFlow Mobile, and CAMP Booking.
Five actual portfolio images are cached within GitHub using `scripts/build_portfolio_images.py`.
The full-stack card shows a clearly illustrative CSS app layout rather than an unrelated image.
Project cards link to their own case study pages by image, heading, and an explicit VIEW FULL PROJECT link. Compact previews remain expandable on the listing. Individual pages show detailed context, execution, results, technologies and original project references. Project gallery images are cached locally. JavaScript handles accessible navigation, chapter highlighting and copy-link actions.
Original detailed WordPress case studies remain linked for reference until separately migrated.

## Profile page content

Preserves the supplied profile, original published portrait, KEA Computer Science,
and University of Kent education details, with genuine course links.
The same fixed header/footer layout is used across the five-frame homepage,
Contact, Skills, and Profile. JavaScript controls only the mobile menu,
active section navigation, keyboard focus, and image fallback.

## Skills page content

Uses the supplied 37 technologies and capabilities, organised into Platforms and Execution.
The fixed three-column header/footer are the same as Contact and the homepage; only light/dark color treatment differs.
JavaScript implements accessible mobile navigation, category filters, real search, result counts and reset.
The Skills preview is also `noindex,nofollow` until the final domain migration.

## Contact page content

Uses the supplied GitHub, LinkedIn, address, telephone, public email, and footer information.
The main action targets remain actual `tel:` and `mailto:` links, not dummy buttons.
Contact page is `noindex,nofollow` while it is a design preview.

## Change policy

Change only the requested page and its direct links; avoid editing approved frame animation logic.
Use branch / PR / browser checks before merging and deploying.


## Original WordPress Portfolio media archive

The six published project pages on `arkitekts.dk` are the source of truth.
`scripts/archive_portfolio_media.py` downloads original photos and public PDFs,
stores optimized image copies and unchanged PDFs below `portfolio/assets/original/`,
and generates `portfolio/media-manifest.json` with per-project source links.

Generated `Original project files` galleries sit beside the existing hand-curated
images; they do not replace previous content. CAMP now includes ten original
screenshots and the complete ten-page research-group PDF. The original document
can be read or downloaded directly without relying on WordPress. A Full-Stack
application screenshot was also restored. Company, school and software logos
are intentionally excluded from the photo galleries.

## Basecamp Response Monitor original case-study migration

The original `https://arkitekts.dk/portfolio/basecamp-customer-response-monitor/`
case is restored under `portfolio/basecamp-response/` with its original
Basecamp application screenshot and TwentyFour company artwork.
The original company identity is intentionally shown as a logo,
not disguised as a project screenshot. Its optimized local copy
is stored at `portfolio/assets/original/basecamp-response/twentyfour-brand.webp`.
The project text includes the original UrgencyBot name, integration tools,
two Scrum sprints (July–September 2023 and September 2023–January 2024),
and a link back to the source page.
