# Frame 02 — cinematic transition from the approved Frame 01

**Status:** separate draft; requires visual approval before accepting Frame 02.

## The interaction requested

The user's reference shows a photographic frame that grows progressively larger when the mouse wheel moves down. The window becomes a fullscreen moving movie, and then new text appears on it. Mouse wheel up reverses the experience.

This design implements that behavior directly, without changing the existing Frame 01.

## Exact progression

| Approximate scroll progress | Visual behavior |
|---|---|
| 0% | Approved Frame 01 exactly: three arches, mountain movie, title, mouse effects, fixed header/footer |
| 15–50% | The three panoramic arches enlarge; gaps narrow; original hero title fades away |
| 50–80% | Arches join seamlessly; video extends to fill the browser viewport behind the fixed chrome |
| 80–100% | A subtle dark gradient makes text readable; Frame 02 headline appears one line at a time |
| Scroll upward | Reverse every step and restore the original three-arch composition |

The video never switches to another asset; it continues playing as the mask grows. This avoids a jarring cut between static photos and moving footage. Mouse parallax still works in the original first frame.

### Frame 02 editorial direction

"**Curiosity. Code. Delivery.**"

"I'm Soheil. I build and automate platforms that work in the real world. From Linux and Ansible to Kafka and Elasticsearch."

This is draft copy to be approved or refined after we see the visual transition. The portfolio link still opens the public WordPress work section until migration.

### Fixed design framework

- The SAME S. brand, SOHEIL, right-hand header navigation, purple grid and footer.
- Header/footer never move; the movie can expand underneath their translucent backgrounds.
- Reuse the approved CSS, JS and videos from `concepts/frame-one-live/` and `concepts/frame-one-v3/assets/frame-one.css` **unchanged**.
- Additional behavior exists only under `concepts/frame-two-portal/`.
- No proprietary reference-site code, video, shader, asset or screenshot is reused.

### Interaction and accessibility

Wheel/trackpad adjusts an actual numeric scroll-progress state, not a binary slide jump. The motion is smoothly interpolated. Touch drags change the same progress. Keyboard PageUp/Down, arrows, Space, Home/End and visible stage controls provide alternatives. Reduced-motion users move directly between states without cinematic easing. Offstage story content is initially `inert` / aria-hidden.

### Acceptance tests

GitHub workflow `frame-two-portal.yml` runs Playwright at 320, 390, 768 and 1440px. It verifies:

- Approved first-frame appearance and pinned chrome
- Continuous progress at intermediate wheel positions
- Full-screen video dimensions at 100%
- Animated and accessible second-frame text
- Video playback continuity
- Scrolling upward restores first-frame geometry
- No JavaScript exceptions or horizontal overflow

**No DNS switch, no live WordPress modification, no changes to the approved Frame 01 baseline, no work on Frame 03 or the globe.**

Preview once merged: https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-two-portal/
