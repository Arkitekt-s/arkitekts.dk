# Frame 03 — interactive number over the approved cinematic video

**Status: draft for visual review. Do not freeze it yet.**

## What the user requested

The supplied Triptych screenshot shows a large white, geometrically fragmented **20** in the centre of an immersive movie, with short text on both sides. On moving the mouse into the number, the pieces should react and then return to precisely the same arrangement.

Frame 03 should be the same full-screen moving-video environment and persistent header/footer used by Frame 02. Scrolling down enters it; scrolling up reverses it.

## Current design

- **Frame 01:** original approved three-arch cinematic landing with local mountain film, mouse patterns and continuous header/footer grid.
- **Frame 02:** original approved zoom into full-screen landscape video with "Curiosity. Code. Delivery." animated text.
- **Frame 03:** the **same video stays full screen**. Frame 02 text fades away. Short statements appear on either side of a large white number:
  - Left: **BUILDING RELIABLE**
  - Centre: **20**
  - Right: **SYSTEMS THAT LAST**
- The number is original SVG lettering separated into nine clipped geometric pieces, with sequential assembly animation.
- When the pointer approaches its centre, fragments move in different directions and rotate. Moving away smoothly restores all fragments to the exact original positions.
- Tap or click also activates a brief split-and-restore animation; keyboard Enter/Space activates the same control.
- The number **20 is a provisional visual motif** based on the reference, not a factual claim of 20 years of experience. Its final meaning/content needs owner approval.

## Fixed template rules

- Frame 03 inherits the purple atmospheric frame, continuous thin grid, SOHEIL header, contact button, and Copenhagen technical footer.
- Do not alter the approved source of `concepts/frame-one-live/` or `concepts/frame-two-portal/`. Everything new belongs to `concepts/frame-three-journey/`.
- Reuse the same locally hosted mountain video; no external 3D libraries, shaders, private images or user metadata.
- Animated text should not interrupt mouse/trackpad/touch/keyboard navigation.
- Keep accessible alternative text, pointer and touch controls, and reduced-motion compatibility.
- On phones, the "20" stays central while side copy moves below it for readability.

## Acceptance tests

A dedicated GitHub Actions workflow runs Playwright on 320/390/768/1440px browsers to verify:
1. Initial approved three arches and Frame 02 editorial copy are still present.
2. Scroll reaches Frame 02 without accidentally jumping to Frame 03.
3. Another scroll enters Frame 03 while the same movie keeps playing.
4. Nine number fragments appear and react to mouse proximity.
5. Moving the mouse away returns all nine pieces to their exact positions.
6. Tap/click briefly animates then restores the number.
7. Scrolling up returns to Frame 01; header and footer never move.
8. No JavaScript exceptions or unexpected horizontal scroll.

## Approval process

Review the interaction and visual composition in the temporary GitHub Pages concept first. If the user requests changes, edit only this third-frame concept. Once the user accepts Frame 03, create a separate immutable baseline like the existing two-frame snapshot.

**Do not touch WordPress or DNS yet.**
