# SOHEIL — Approved portfolio design DNA

## Baseline is preserved

The five-frame cinematic homepage at \`concepts/frame-five-contact/\` is the approved source of truth.
This baseline contains the mountain openings, purple typography, reactive **10**, seven-photo
sequential gallery (beginning with photo 01), last-photo dark fade, and enlarged transparent
Copenhagen globe. No existing cinematic scene should be restyled as part of subpage work.

The new companion \`contact/\` is deliberately **bright**, showing how the same identity translates
between light and dark designs. Keep the WordPress live site and DNS unchanged until migration.

## Reusable identity

- Wordmark: **S.** and **S O H E I L**.
- Typography: large tight-spaced modern sans with deliberate *Georgia italic* moments.
- Supporting copy: small all-caps monospaced labels and precise section indices.
- Color: near-black \`#17111e\`, deep violet \`#773c9d\`, lilac accent \`#a54bd0\`.
- Page atmosphere: thin technical gridlines, layered violet light, minimal translucent surfaces.
- Interaction: gentle ease-out motion, hover-driven arrows, progressive reveals, pointer parallax.
- Navigation: same language, keyboard access, clear mobile menu, and reduced-motion support.
- Layout: generous whitespace, large headings, quiet fixed-feeling header/footer.

## Route map

- **Five-frame homepage:** \`/concepts/frame-five-contact/\` — unchanged scene structure.
- **Bright contact:** \`/contact/\` — opens from both **Let's talk** links on the five-frame homepage.
- **Profile / Skills:** existing WordPress links used until those new pages are migrated.

GitHub Pages base path in preview: \`https://arkitekt-s.github.io/arkitekts.dk/\`.
All new internal URLs are relative, so moving the site to a custom domain is straightforward.

## Contact page content

Uses the supplied GitHub, LinkedIn, address, telephone, public email, and footer information.
The main action targets remain actual \`tel:\` and \`mailto:\` links, not dummy buttons.
Contact page is \`noindex,nofollow\` while it is a design preview.

## Change policy

Change only the requested page and its direct links; avoid editing approved frame animation logic.
Use branch / PR / browser checks before merging and deploying.
