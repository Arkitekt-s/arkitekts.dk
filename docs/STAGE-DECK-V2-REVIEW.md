# Stage Deck V2 — cinematic interaction test

## Overview

An upgrade to the **approved-in-principle fixed header/footer/frame foundation**. This is a separate design proposal; it does not replace the root homepage or alter WordPress.

[Source path](../concepts/stage-deck-v2/) · [Design baseline](STAGE-DECK-REVIEW.md)

## New features

- **Cinematic zoom-through transition:** outgoing frame retreats and blurs, incoming frame scales up into view. The stage changes on deliberate wheel/trackpad gestures, swipes, keyboard shortcuts and numbered frame buttons; the header/footer stay fixed.
- **Mouse-controlled depth:** gentle non-blocking parallax for photographic arches, large text, server photograph, and perspective project imagery.
- **Press-and-hold exploration:** holding on the backdrop and moving the mouse adds more depth. It does not replace conventional navigation.
- **Drag photo reel:** visitors can drag professional imagery side-to-side in the second frame.
- **Professional media:** real published portrait from WordPress, a publicly available Unsplash server-rack photograph, and an intentionally illustrative Linux/Ansible deployment terminal.
- **Work scene:** photographed networked servers and illustrated platform deployment overlay, relating to Linux, Ansible, Kafka, Logstash and Elasticsearch. It does not depict a customer's internal infrastructure.
- **Interactive 3D globe:** native Canvas point-cloud globe with geographic lon/lat coordinates. Copenhagen at **55.6761° N, 12.5683° E** is marked. Drag with mouse/touch to rotate. Use wheel/controls to zoom; button restores Copenhagen. Arrow keys and +/- work when the globe is focused.
- **Progressive performance:** only the globe runs a rendering loop, on its own frame; it is not active outside frame four. Globe point count is lower on phones, resolution is capped.
- **Motion preferences:** reduced-motion preference removes decorative travel effects; full content and navigation remain available.

## References and media provenance

- Visual inspiration: `https://3dv2.triptych.co/` — interaction language, fixed shell, journeys; no studio artwork, shaders or proprietary scripts copied.
- Person: existing WordPress `https://arkitekts.dk/` biography and personal portrait `/wp-content/uploads/2026/06/soheil1-e1782845724382.png` (temporarily externally served).
- Server photograph: Unsplash `https://images.unsplash.com/photo-1558494949-ef010cbdcc31` (standard Unsplash image URL).
- Arched mountain and other scenic pictures: same independently sourced preview media from baseline `stage-deck`.
- Linux terminal illustration: original HTML/CSS and *not* a live production screen.

## Non-goals and remaining work

- No DNS changes. No WordPress changes. No original homepage replacement.
- No full production grade 3D environment simulation is asserted; it is a responsive cinematic website with original depth effects and an interactive 3D globe.
- Need to move approved images to local GitHub assets after WordPress/media export, confirm licensing, and remove external dependencies.
- Need actual phone/device interaction, Safari testing, Lighthouse performance, accessibility testing.
- Need **owner approval of this landing design first**, then create the locked shared template system for all inner pages.

## Browser acceptance checks

CI: `scripts/cinematic_interaction_review.py`, tested at 320, 390, 768 and 1440px.
Verifies: fixed header/footer, no horizontal overflow, wheel changes, portrait loads, photo reel drags, Copenhagen marker, globe drag, globe zoom, globe home, keyboard controls and JavaScript console.
