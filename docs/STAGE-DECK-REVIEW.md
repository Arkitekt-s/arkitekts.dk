# Stage Deck — fixed-header, fixed-footer landing design review

**Status: A landing-page prototype. It is NOT the chosen final template.**

## The user-provided design reference

Three screenshots showed the specific frame system used by an immersive studio:
1. Large full-screen introduction with three photographic arches and oversized text
2. Full-bleed photographic reel in perspective
3. A final global contact experience, with big navigation links and a dotted globe

The new implementation is an **original adaptation** using the portfolio owner's own identity. No screenshot pixels, branding, 3D assets, or copyrighted client files are copied from that studio.

## Precise behavior

- Header and footer remain at exactly the same screen coordinates.
- Only the central scene changes.
- One deliberate **mouse-wheel gesture = one scene transition**. Trackpad, touch swipes, arrows, Home/End and chapter buttons all work.
- Header navigation can jump directly to Work, About, or Contact.
- Every frame occupies the available viewport; no vertical document scrolling.
- Four scenes: 01 mountain/arch landing, 02 portrait photo reel, 03 work/profile hub, 04 animated dotted globe and contact.
- 3D depth: desktop pointer-driven arches, photograph reel, rotating work geometry, and a mathematically projected dot globe.
- No 3D framework is needed; contact globe uses native Canvas.
- Reduced-motion preferences are supported.
- A safe reduced-motion/JavaScript fallback remains visible, though full progressive enhancement still needs accessibility review.

## Shared foundation (must be approved before migrating old pages)

- Tokens, typography, colors and permanent navigation
- Identical header/footer spacing across scenes and devices
- Native user controls (wheel/touch/keyboard/buttons) with reduced-motion fallback
- Intro only acts as a **landing**; later Work, Profile, Guides pages would use the same visual system and shared components.
- Do not migrate WordPress until the exact landing behavior is approved.

## Media provenance and temporary dependencies

- Three-arch mountains: Unsplash public image CDN (photo ID `photo-1464822759023-fed622ff2c3b`), not Triptych artwork.
- Reel portrait: existing public WordPress media `https://arkitekts.dk/wp-content/uploads/2026/06/soheil1-e1782845724382.png`.
- Other reel landscapes: Unsplash public image CDN (photo IDs `photo-1470770841072-f978cf4d019e`, `photo-1500534623283-312aade485b7`).
- The user supplied Triptych screenshots purely as design references.
- Before DNS change, self-host any image that is needed, verify media licenses, and migrate the real WordPress library.

## Quality checklist

- Screenshots at 320 / 390 / 768 / 1440px
- Opening headline fully visible
- Fixed header and footer identical across all frames
- Mouse wheel increments only one episode each gesture
- Mobile swipe/tap works without browser-level scroll
- Dotted globe animates and is usable in final stage
- Portrait loads and stays accurate
- Reasonable CPU/GPU load, no accessibility regression
- Existing links and WordPress content remain untouched

## Status
This is an isolated `concepts/stage-deck/` design proposal, built on a feature branch for review. It does NOT replace the root landing page, switch DNS, remove WordPress, or decide the final shared template.
