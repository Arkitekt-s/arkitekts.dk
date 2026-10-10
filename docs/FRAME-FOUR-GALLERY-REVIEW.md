# Frame 04 — cinematic personal photo gallery

**Status:** working prototype, awaiting visual approval.

## Exact behavior requested

The user supplied three screenshots of the Triptych photo gallery. This is an original adaptation using the approved SOHEIL design system — **not** a reproduction of their source code, media or proprietary effects.

1. **Scroll down from Frame 03:** a dark shadow moves from **bottom to top**, covering the video.
2. **Frame 04 revealed:** the continuous dark background/grid and fixed header/footer remain. A 3D-perspective row of photographs appears in the middle.
3. **Scroll up/down in Frame 04:** mouse wheel moves the photos **horizontally**. Gallery stays fixed vertically.
4. Move the cursor left/right for small parallax. Click/touch and drag for direct navigation.
5. At the left edge, another upward gesture returns to Frame 03. The persistent chapter navigation also returns to Frame 03 directly.
6. Arrow buttons and keyboard arrows offer accessible alternatives.

## Images

There are seven replaceable cards: workplace, servers, Soheil's publicly published profile portrait, teamwork, electronics, project collaboration and Copenhagen. **Only the portrait is claimed to depict Soheil; all other photos are placeholders.**

The portrait is initially centered, using the public WordPress photo:
`https://arkitekts.dk/wp-content/uploads/2026/06/soheil1-e1782845724382.png`.

Placeholder photos use the Unsplash CDN for this draft. Later, the user can supply real pictures, and we will replace them with local approved assets. No personal images are invented or attributed to the user.

If external images fail, the gallery displays a dark gradient card, preserving layout. Before migration, self-host the approved images with proper licensing and fix the SEO/source links.

## Foundation

The versioned first three frames remain unchanged under their own source folders:

- `concepts/frame-one-live/`
- `concepts/frame-two-portal/`
- `concepts/frame-three-journey/`

The new four-frame concept lives only in `concepts/frame-four-gallery/`. All the approved shared CSS, JavaScript and video sources remain untouched. Its new controller extends the three-frame scroll state; it is intentionally not an edit to the original controller.

The site is still served under the free GitHub Pages preview; WordPress and domain DNS are unchanged.

## Responsive acceptance checks

The test script `scripts/frame_four_gallery_review.py` runs Chromium at 320px, 390px, 768px and 1440px. It checks the original intro, Frame 02, Frame 03, rising shadow wipe, centered portrait card, horizontal response to wheel up/down, drag, gallery buttons, fixed chrome, video decoding, no horizontal browser overflow and JavaScript errors.

**Approval required before freezing Frame 04 or migrating to the production domain.**
