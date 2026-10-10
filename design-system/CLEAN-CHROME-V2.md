# Clean cinematic chrome — Frames 01 and 02

## Visual adjustments requested

The user approved the live-video opening and Frame 02 transition, then requested a cleaner frame and an uninterrupted grid.

**Preserve what already works:** moving mountain video, three arched masks, mouse-reactive pattern, scroll zoom, animated Frame 02 title, fixed header and footer.

### Frame 01
- Keep the main opening statement **“I make complex systems work.”**
- Remove the visible debug/tutorial labels for live footage, press/hold, pause, mouse/hold instructions and pending review state.
- Do not remove the underlying press-and-hold interaction.
- A motion pause button remains keyboard accessible and becomes visible only on focus.

### Unified header/footer
- A single fixed grid layer spans the **entire viewport**, including header, scene and footer.
- The same vertical column positions continue without interruption.
- No backdrop blur that distorts the grid inside the header or footer.
- The permanent chrome gets only a subtle translucent tint for legibility.
- The same grid stays visible when the moving video grows behind the header/footer in Frame 02.
- Grid overlay uses `pointer-events: none` so it cannot intercept navigation, scrolling or controls.

### Scope and rollback
The immutable approved snapshot in `baseline/frame-one-live-approved-v1` stays untouched. These refinements are applied to the **combined Frame 01 → 02 working concept** at `concepts/frame-two-portal/`. No changes to the production homepage, DNS or WordPress.

The two-frame concept remains an editorial preview until the user approves its final composition.

### Validation
`scripts/frame_two_portal_review.py` checks removal of the extra labels, grid continuity, absence of chrome blur, fixed header/footer, video zoom and reverse scroll. Tests run on 320, 390, 768 and 1440px screens.
