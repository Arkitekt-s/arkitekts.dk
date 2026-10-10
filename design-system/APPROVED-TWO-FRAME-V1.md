# APPROVED — Frames 01 and 02, clean cinematic baseline V1

**This is the new design baseline. Freeze it.**

The owner approved the cleaned-up two-frame experience. Make future work in separate concepts and versioned components. Do not change its design or behavior unless the owner returns with specific edits.

### Live preview

https://arkitekt-s.github.io/arkitekts.dk/concepts/frame-two-portal/

### Permanent reference

- [Frozen snapshot branch](https://github.com/Arkitekt-s/arkitekts.dk/tree/baseline/two-frames-clean-approved-v1)
- [Exact approved commit](https://github.com/Arkitekt-s/arkitekts.dk/commit/4017827d2087c23c8daac0d7798f7f25386f0659)
- [Locked source and media hashes](two-frame-clean-approved-v1.json)
- [Automated baseline check](https://github.com/Arkitekt-s/arkitekts.dk/actions/workflows/two-frame-baseline-lock.yml)
- [Original Frame 01 snapshot](https://github.com/Arkitekt-s/arkitekts.dk/tree/baseline/frame-one-live-approved-v1) (older reference, retained for rollback)

### Frozen look and behavior

1. **Frame 01:** Three photographic arched windows showing actual, locally hosted moving mountain footage; mouse-responsive depth and pointer-created visual patterns.
2. **Minimal interface:** Keep the main hero statement. Do not show extra on-screen debug or instructional labels: no live-footage status, press-and-hold label, pause-motion label, frame-number/pending status, or mouse-help instruction.
3. **One continuous frame:** Purple atmospheric background and a fine vertical grid run through **the header, the main stage and the footer**. No visual breaks or backdrop blurring of vertical lines.
4. **Permanent header:** Same logo, centered identity, navigation and contact button. Do not move or redesign it when navigating.
5. **Permanent footer:** Same technical specialties and Copenhagen location. Grid lines remain aligned with the rest of the page.
6. **Frame 02:** Scrolling down smoothly enlarges the arches into one seamless fullscreen mountain movie; old statement fades out, animated personal message appears. Scrolling back up reverses to the unchanged first frame.
7. **Controls:** Responsive mouse, trackpad, touch and keyboard interaction. An unobtrusive focus-visible pause control remains for accessibility. Keep reduced-motion support.
8. **Responsive identity:** Same professional visual system on desktop, tablet and phone.

### Change policy

**Locked files:** The approved HTML, styles, JavaScript, videos and their shared source assets appear in the JSON manifest. The checker compares the exact Git blob of each. It also rejects new files added inside either frozen concept folder.

Build Frame 03 or any other pages in a **new folder and pull request**. Borrow the visual rules from this baseline, without editing its source. Future requested changes to Frames 01–02 should start a new `v2` version with separate design approval; keep V1 for rollback.

### Repository safety

The existing GitHub branch protection setting was not enabled at the time of approval. This reference branch and automated checks protect against **unnoticed accidental changes**, but do not prevent a user with write access from overriding them.

To enforce this on GitHub, the repository owner should enable a ruleset for `main` and the baseline branch:

- Require a pull request for `main`.
- Require passing checks including **Preserve approved two-frame cinematic design** and the existing Frame 01 check.
- Disallow force pushes and branch deletion on both baselines.
- Restrict direct updates to the baseline branch.

**No production homepage replacement, WordPress change or DNS cutover is authorized by this baseline.**
