/* Frame 01 only: a real, responsive cinematic interaction.
 * Native JS + CSS, no 3D CDN and no copied third-party site code.
 * Motion is optional; complete headline remains available without JavaScript.
 */
(() => {
  "use strict";
  const $ = (q, parent = document) => parent.querySelector(q);
  const $$ = (q, parent = document) => [...parent.querySelectorAll(q)];
  const stage = $("#frame");
  const arches = $$(".arch");
  const panorama = $("#panorama");
  const title = $(".hero-text");
  const holdButton = $("#hold-button");
  const pauseButton = $("#motion-button");
  const note = $("#interaction-note");
  const menu = $("#navigation");
  const menuButton = $("#menu-button");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const setOpen = open => {
    menu?.classList.toggle("open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuButton?.addEventListener("click", () => setOpen(menuButton.getAttribute("aria-expanded") !== "true"));
  menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { setOpen(false); releaseHold(); } });
  matchMedia("(min-width: 761px)").addEventListener("change", e => { if (e.matches) setOpen(false); });

  let pointerX = 0, pointerY = 0;
  let actualX = 0, actualY = 0;
  let pointerFrame = 0;
  let pausedByUser = false;
  let holding = false;
  let heldPointerId = null;

  function isReduced() { return reduced.matches; }
  function updatePause() {
    const off = pausedByUser || isReduced();
    document.body.classList.toggle("motion-off", off);
    if (pauseButton) {
      pauseButton.setAttribute("aria-pressed", String(off));
      pauseButton.textContent = off ? "RESUME MOTION" : "PAUSE MOTION";
    }
    if (off) {
      pointerX = pointerY = actualX = actualY = 0;
      applyMotion();
    }
  }
  pauseButton?.addEventListener("click", () => {
    pausedByUser = !pausedByUser;
    updatePause();
  });
  reduced.addEventListener("change", updatePause);
  updatePause();

  function applyMotion() {
    if (!panorama) return;
    panorama.style.setProperty("--pan-x", (actualX * 13).toFixed(2) + "px");
    panorama.style.setProperty("--pan-y", (actualY * 9).toFixed(2) + "px");
    panorama.style.setProperty("--tilt-y", (actualX * 2.7).toFixed(2) + "deg");
    panorama.style.setProperty("--tilt-x", (-actualY * 1.65).toFixed(2) + "deg");
    if (title) {
      title.style.setProperty("--title-x", (-actualX * 6).toFixed(2) + "px");
      title.style.setProperty("--title-y", (-actualY * 5).toFixed(2) + "px");
    }
    arches.forEach((arch, i) => {
      const factor = i - 1;
      const photo = $(".scenery", arch);
      const mountain = $(".distant-mountains", arch);
      if (photo) {
        photo.style.setProperty("--photo-x", ((actualX * (-15 - i * 4)) + factor * actualX * 7).toFixed(2) + "px");
        photo.style.setProperty("--photo-y", (actualY * (-9 - i * 3)).toFixed(2) + "px");
      }
      if (mountain) {
        mountain.style.setProperty("--mountain-x", (actualX * (-10 + factor * 4)).toFixed(2) + "px");
        mountain.style.setProperty("--mountain-y", (actualY * -5).toFixed(2) + "px");
      }
    });
    document.body.dataset.mouseDepth = Math.abs(actualX).toFixed(2);
  }

  function tick() {
    pointerFrame = 0;
    if (pausedByUser || isReduced()) return;
    actualX += (pointerX - actualX) * .27;
    actualY += (pointerY - actualY) * .27;
    applyMotion();
    if (Math.abs(pointerX - actualX) > .006 || Math.abs(pointerY - actualY) > .006) {
      pointerFrame = requestAnimationFrame(tick);
    }
  }
  function schedulePointer() {
    if (!pointerFrame) pointerFrame = requestAnimationFrame(tick);
  }
  if (finePointer.matches && stage) {
    stage.addEventListener("pointermove", e => {
      if (pausedByUser || isReduced()) return;
      const r = stage.getBoundingClientRect();
      pointerX = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      pointerY = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
      schedulePointer();
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      pointerX = pointerY = 0;
      schedulePointer();
    });
  }

  function setHold(state) {
    if (state === holding) return;
    holding = state;
    document.body.classList.toggle("is-holding", state);
    holdButton?.setAttribute("aria-pressed", String(state));
    if (note) {
      note.textContent = state
        ? "INSIDE THE LANDSCAPE · RELEASE TO RETURN"
        : "MOVE THE MOUSE TO SHIFT DEPTH · HOLD TO ENTER THE LANDSCAPE";
    }
  }
  function releaseHold() {
    heldPointerId = null;
    setHold(false);
  }
  // Press/hold the scenic area or the dedicated control.
  function beginHold(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest("a,button:not(#hold-button)")) return;
    heldPointerId = e.pointerId ?? null;
    setHold(true);
    if (e.pointerId != null && e.currentTarget?.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
  }
  function endHold(e) {
    if (heldPointerId == null || e.pointerId == null || heldPointerId === e.pointerId) releaseHold();
  }
  stage?.addEventListener("pointerdown", e => {
    if (e.target instanceof Element && e.target.closest("#hold-button")) return;
    beginHold(e);
  });
  stage?.addEventListener("pointerup", endHold);
  stage?.addEventListener("pointercancel", releaseHold);
  holdButton?.addEventListener("pointerdown", beginHold);
  holdButton?.addEventListener("pointerup", endHold);
  holdButton?.addEventListener("pointercancel", releaseHold);
  holdButton?.addEventListener("click", e => {
    // Keyboard and assistive-tech users can toggle the same effect.
    if (e.detail === 0) setHold(!holding);
  });
  document.addEventListener("pointerup", endHold);
  window.addEventListener("blur", releaseHold);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseHold(); });
  document.addEventListener("keydown", e => {
    if (e.code === "Space" && !["INPUT","SELECT","TEXTAREA","BUTTON"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      setHold(true);
    }
  });
  document.addEventListener("keyup", e => { if (e.code === "Space") releaseHold(); });

  // Media failure is acknowledged, but the CSS mountain gradient remains readable.
  const mountain = new Image();
  mountain.addEventListener("load", () => { document.body.dataset.landscapeLoaded = "true"; });
  mountain.addEventListener("error", () => { document.body.dataset.landscapeLoaded = "false"; });
  mountain.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85";
})();
