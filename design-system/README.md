# Current fixed design: approved Frames 01–04

[**Approved four-frame snapshot**](https://github.com/Arkitekt-s/arkitekts.dk/tree/baseline/four-frame-gallery-approved-v1) · [Exact source hashes](four-frame-gallery-approved-v1.json) · [Automated preservation check](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/four-frame-baseline-lock.yml)

The approved moving arches, full-screen video, stationary interactive **20**, and photo gallery with its gradual dark ending form the current website foundation. All four have been saved unchanged.

**Frame 05 is a separate design proposal:** [contact and Copenhagen globe](https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-five-contact/), with [review details](../docs/FRAME-FIVE-CONTACT-REVIEW.md). Do not change the four approved original folders while designing or revising Frame 05.

---

# Current approved website foundation: Frames 01–02

**[Clean two-frame approved baseline V1](APPROVED-TWO-FRAME-V1.md)** is now the master reference for all future designs.

- [Open approved two-frame preview](https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-two-portal/)
- [Frozen GitHub snapshot](https://github.com/Arkitekt-s/arkitekts.dk/tree/baseline/two-frames-clean-approved-v1)
- [Exact locked source/media files](two-frame-clean-approved-v1.json)

The original Frame 01 reference documented below remains preserved, but the newer approved two-frame version takes precedence for future work. **Do not modify either approved snapshot unless the owner requests changes.**

---

# Approved design foundation — SOHEIL Frame 01

**Status: APPROVED AS THE BASE. Do not redesign Frame 01.**

The user approved the interactive version containing live mountain video and mouse-generated patterns. It is now the visual and interaction standard for the rest of the website.

## Working reference

- **Preview:** https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-one-live/
- **Frozen reference branch:** [baseline/frame-one-live-approved-v1](https://github.com/Arkitekt-s/arkitekts.dk/tree/baseline/frame-one-live-approved-v1)
- **Exact approved snapshot:** [2a0ff2aa875c2f8b0ac8f3dbd177227d4fccbbcf](https://github.com/Arkitekt-s/arkitekts.dk/commit/2a0ff2aa875c2f8b0ac8f3dbd177227d4fccbbcf)
- **Exact source/media fingerprints:** [frame-one-approved-v1.json](frame-one-approved-v1.json)
- **Reusable design values:** [tokens.json](tokens.json)
- **Automated freeze check:** [Frame 01 baseline lock](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/frame-one-baseline-lock.yml)

The source reference is a **separate branch**. Changes to `main` will not move that baseline branch.

## Fixed template for every episode

1. **ONE continuous fullscreen frame:** the grid and purple atmospheric background include header, middle and footer. They must never look like three unrelated blocks.
2. **Same permanent header:** left “S.” logo, centered SOHEIL name, right-aligned navigation with the magenta contact button.
3. **Same permanent footer:** left “S.”, technical domains in the center, Copenhagen at right.
4. **Same visual identity:** restrained purple/magenta, fine vertical grid, crisp white modern typography, serif-italic accent and subtle luminous depth.
5. **Same interaction language:** real purposeful animation and mouse/touch-responsive depth, not arbitrary motion.
6. **Mobile/tablet/desktop:** the same recognizable frame, adapted to screen sizes; no clipped headings, no horizontal overflow.
7. **Accessibility:** reduced-motion support, keyboard-operable actions, legible text, and a pause option for continuous effects.

## What is fixed in Frame 01

- Three large arches revealing **a genuine 12-second looping video** — not a static image merely moved with CSS.
- Self-hosted WebM + MP4 media in GitHub, with graceful mountain-photo fallback.
- Interactive mouse pattern field, luminous trails, parallax and press-and-hold motion.
- The approved copy, typography, header/footer, grid, footer labels and scene layout.
- The exact HTML, CSS, JavaScript and video assets recorded in the lock manifest.

**Do not alter `concepts/frame-one-live/`, its shared `frame-one-v3/assets/frame-one.css` file, or its favicon without specific new approval.** Build other frames in their own folders or as new versioned components, reusing the style contract. If a change to Frame 01 becomes necessary, create `v2` after the user agrees, while preserving `v1`.

## Work order

- [x] Agree on the landing visual identity.
- [x] Approve Frame 01.
- [x] Save a fixed Git branch reference.
- [x] Publish a design-contract and exact fingerprint manifest.
- [x] Add automatic change detection to CI.
- [ ] Owner reviews Frame 02 separately.
- [ ] Owner reviews Frame 03 separately.
- [ ] Owner reviews Frame 04 (interactive Copenhagen globe) separately.
- [ ] Only after *all* frames are approved, implement common navigation, inner-page templates, complete WordPress migration and SEO checks.
- [ ] Test on real iPhone, Android, tablet and desktop; check performance and accessibility.
- [ ] Change DNS only after full approval, production verification and migration readiness.

## GitHub branch protection

The GitHub repository's `main` branch was **not protected** when this foundation was approved.

The branch snapshot and the automated Git fingerprint test help detect accidental edits. They **are not a substitute for server-enforced branch protection**.

The repository owner should open **Settings → Rules → Rulesets** (or **Settings → Branches**) and set rules covering `main` and `baseline/frame-one-live-approved-v1`:
- require pull requests for changes to `main`;
- require successful checks including **Preserve approved cinematic design**;
- block force pushes and branch deletion;
- restrict changes to the baseline branch except an explicit, owner-approved version process.

No GitHub ruleset or branch protection has been changed automatically. This policy is documented for the owner to enable.

No changes have been made to `arkitekts.dk` WordPress or domain DNS.
