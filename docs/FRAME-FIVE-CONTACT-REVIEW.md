# Frame 05 — contact and interactive Copenhagen globe

**Status:** independent fifth-frame preview, awaiting user approval.

## What stays fixed

The first four frames, their own HTML/CSS/JS, the moving mountain video, mouse-reactive **20**, the personal photo gallery, the background fade, permanent header/footer and continuous grid are unchanged.

The accepted four-frame snapshot is preserved at:

- [Approved GitHub branch](https://github.com/Arkitekt-s/arkitekts.dk/tree/baseline/four-frame-gallery-approved-v1)
- [Immutable reference commit](https://github.com/Arkitekt-s/arkitekts.dk/commit/d5297daa9e783b3428b4a06a726fd75ed350325c)
- [Exact SHA manifest](../design-system/four-frame-gallery-approved-v1.json)
- [Automated source integrity check](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/four-frame-baseline-lock.yml)

## Fifth frame

After the final photo of Frame 04, another downward mouse-wheel gesture opens Frame 05.

- Frame 04 ends in near-black, and Frame 05 uses the **exact same dark gradient** to make the transition seamless.
- The same **SOHEIL** header, technical footer and subtle grid lines remain fixed.
- Left: concise personal invitation, clear real contact email, and GitHub portfolio link.
- Right: a **genuinely transparent 3D point globe**. No solid sphere, outside glow, surrounding shadow or purple lighting.
- Faint, see-through far-side geographic dots add 3D depth. The dark background stays visible through the globe.
- Globe rotates slowly on its own (one turn approximately every 7.5 minutes).
- Drag the globe with mouse or touch to rotate in 3D. Keyboard arrow controls also work when the globe has focus.
- Dots follow world geography. A highlighted dot and label locate **Copenhagen, Denmark** (55.6761° N, 12.5683° E).
- The **Find Copenhagen** control restores the view. A **Back to Gallery** control returns to the last photo.
- Reduced-motion visitors get a still globe until they interact.

## Verified public sources

- The email `sohe@arkitekts.dk` and professional description are already publicly published on `https://arkitekts.dk/`; they are not invented.
- The geographical point cloud is precomputed from Natural Earth-derived `world.geojson` via the public D3 Graph Gallery source: `https://github.com/holtzy/D3-graph-gallery/blob/master/DATA/world.geojson`.
- All **3,517 geographic land points** are self-hosted in `assets/land-points.json`. No third-party map service or API key is required.
- The rotating globe uses the browser canvas, real 3D spherical projection, directional shading and perspective clipping. It is intentionally a lightweight static-site implementation.

## Behavior

The four-scene controller is copied into the new concept and extended. It does not alter earlier controller files.

- Scroll through Frames 1, 2, 3, and Frame 4 as before.
- Inside Frame 4, wheel down/up still moves the photo reel horizontally.
- When photo 7 is centered, scrolling down again advances into Frame 5.
- Scroll up from the final frame returns to the *end of the gallery* without resetting to the first portrait.
- Globe dragging does not drag the gallery or trigger earlier stage effects.
- Website stays on a free GitHub Pages preview URL. WordPress and DNS remain unchanged.

## Quality checks

`scripts/frame_five_contact_review.py` runs actual Chromium browsers at **320, 390, 768 and 1440px**, checking:

- All previous cinematic frames and the near-black photo-gallery finish
- Successful wheel transition into Frame 5
- Contact email and globe visibility
- Real self-hosted geodata, 3D globe drawing, location marker and slow rotation
- Mouse drag, reset and back-navigation
- Fixed header/footer, no horizontal overflow and no JavaScript runtime errors

Test snapshots are attached to the GitHub Actions workflow.

**Review required:** approve Frame 05 design and interaction before freezing it as an additional baseline. Do not change domain DNS or production WordPress at this stage.
