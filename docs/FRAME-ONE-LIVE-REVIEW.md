# Frame 01 — live footage and pointer patterns

**Prototype scope:** Only the first landing frame. No changes to other episodes, projects, globe, homepage or DNS.

## Visual intent

The whole viewport — photograph, grid, header and footer — behaves like one scene.

- Three arched windows share a **real motion-video background**.
- Landscape is continuously changing because video frames play, **not** because a still image is being gently zoomed.
- Static mountain poster remains available if the media server or autoplay fails.
- Mouse motion moves the mountain arches and draws a responsive purple/cyan lattice and fading light trail across the page.
- Holding the mouse creates a more intense magnetic ring and moves deeper into the landscape.
- Headline and navigation remain readable and independent of decorative animations.
- Header and footer have the same atmosphere and grid as the center rather than feeling like unrelated components.
- All interactions should respect `prefers-reduced-motion`. A pause button stops the video and effect.

## Footage

The actual footage is a Pexels mountain/cloud landscape, ID `2888383`, licensed for use on websites under the [Pexels License](https://www.pexels.com/license/). Source reference:
`https://videos.pexels.com/video-files/2888383/2888383-hd_1280_720_24fps.mp4`.

The clip has been downloaded once by GitHub Actions, reduced to a 12-second 720p loop, and saved as two local media assets:
- `concepts/frame-one-live/assets/mountain-loop.webm` — VP9 for Chromium/Firefox.
- `concepts/frame-one-live/assets/mountain-loop.mp4` — H.264 for Safari and other supported browsers.

Both are served directly by GitHub Pages. No third-party video playback service is needed.
Poster image remains an Unsplash mountain photograph for no-video/reduced-motion modes.
The layout includes Pexels footage as part of a transformed multimedia website, rather than distributing the standalone video.

## Verification

`scripts/frame_one_live_review.py` checks at 320, 390, 768, and 1440 pixels. It asserts:

- The actual video time advances on desktop and mobile.
- All three video windows can decode frames.
- Pointer patterns render and the mouse moves the scene.
- Press-and-hold increases depth, then releases.
- The fixed header/footer do not jump during interaction.
- The layout has no horizontal overflow or JS runtime exceptions.

The new version is a separate **design branch and review PR** until confirmed. The existing site is unchanged.
