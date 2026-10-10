/* Shared interactive layer for home, project and guide pages.
 * Native scroll position + pointer-based CSS depth; optional real WebGL scene.
 * Motion is progressive enhancement: text and navigation work without JS/WebGL.
 */
(() => {
  "use strict";
  const by = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const menu = by("#main-navigation");
  const menuBtn = by("#menu-button");
  if (menu && menuBtn) {
    const toggle = state => {
      menu.classList.toggle("open", state);
      menuBtn.setAttribute("aria-expanded", String(state));
      menuBtn.setAttribute("aria-label", state ? "Close navigation" : "Open navigation");
    };
    menuBtn.addEventListener("click", () => toggle(menuBtn.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => toggle(false)));
    window.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
    window.matchMedia("(min-width: 781px)").addEventListener("change", e => { if (e.matches) toggle(false); });
  }

  const bar = by(".header");
  let scrollScheduled = false;
  function pageProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty("--page-progress", max > 0 ? String(Math.max(0, window.scrollY / max)) : "0");
    scrollScheduled = false;
  }
  addEventListener("scroll", () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(pageProgress); } }, { passive: true });
  addEventListener("resize", pageProgress, { passive: true });
  pageProgress();
  const year = by("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  // Small pointer tilt. No tilt for touch or reduced motion.
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerDevice = window.matchMedia("(hover: hover) and (pointer: fine)");
  const sculpture = by("[data-tilt]");
  let manualReduced = false;
  if (sculpture && pointerDevice.matches) {
    sculpture.addEventListener("pointermove", e => {
      if (manualReduced || motionPreference.matches) return;
      const r = sculpture.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      sculpture.style.setProperty("--tilt-x", (-dy * 7).toFixed(2) + "deg");
      sculpture.style.setProperty("--tilt-y", (dx * 7).toFixed(2) + "deg");
    });
    sculpture.addEventListener("pointerleave", () => {
      sculpture.style.setProperty("--tilt-x", "0deg");
      sculpture.style.setProperty("--tilt-y", "0deg");
    });
  }

  const chapters = all(".chapter[data-stage]");
  const captionIndex = by("[data-stage-index]");
  const captionHeading = by("[data-stage-heading]");
  const captionText = by("[data-stage-text]");
  const stageProgress = by("[data-visual-progress]");
  let currentStage = 0;
  let onStageChange = () => {};
  const setStage = index => {
    if (!chapters.length) return;
    currentStage = Math.min(chapters.length - 1, Math.max(0, index));
    chapters.forEach((c, i) => c.dataset.active = String(i === currentStage));
    const active = chapters[currentStage];
    if (captionIndex) captionIndex.textContent = String(currentStage + 1).padStart(2, "0") + " / " + String(chapters.length).padStart(2, "0");
    if (captionHeading) captionHeading.textContent = active.dataset.title || "";
    if (captionText) captionText.textContent = active.dataset.summary || "";
    if (stageProgress) stageProgress.style.width = String((currentStage + 1) * 100 / chapters.length) + "%";
    onStageChange(currentStage);
  };
  if (chapters.length) {
    setStage(0);
    const io = new IntersectionObserver(entries => {
      // Prefer the chapter nearest the top third of the viewport.
      const visible = entries.filter(e => e.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * .25) - Math.abs(b.boundingClientRect.top - window.innerHeight * .25));
      const stage = Number(visible[0].target.dataset.stage);
      if (Number.isInteger(stage)) setStage(stage);
    }, { rootMargin: "-16% 0px -40% 0px", threshold: [0, .2, .4] });
    chapters.forEach(ch => io.observe(ch));
    // Keyboard and touch users can activate the stages explicitly.
    chapters.forEach((ch,i)=>ch.addEventListener("focusin", ()=>setStage(i)));
  }

  const canvas = by("#journey-canvas");
  const view = by(".scene-view");
  const toggleMotion = by("[data-motion-toggle]");
  const qualitySelect = by("[data-graphics-quality]");
  let renderFrame = () => {};
  let resizeFrame = () => {};
  let visible = true;
  function isReduced() { return manualReduced || motionPreference.matches; }
  function applyMotion() {
    document.documentElement.dataset.reducedMotion = String(isReduced());
    if (toggleMotion) {
      toggleMotion.setAttribute("aria-pressed", String(isReduced()));
      toggleMotion.textContent = isReduced() ? "Enable motion" : "Reduce motion";
    }
    if (sculpture && isReduced()) {
      sculpture.style.setProperty("--tilt-x","0deg");
      sculpture.style.setProperty("--tilt-y","0deg");
    }
    renderFrame();
  }
  if (toggleMotion) toggleMotion.addEventListener("click", () => {manualReduced = !manualReduced; applyMotion();});
  motionPreference.addEventListener("change", applyMotion);
  applyMotion();

  // Optional, pinned, genuine 3D renderer. If CDN/WebGL is unavailable,
  // CSS geometric fallback remains visible with the complete content.
  async function initScene() {
    if (!canvas || !view) return;
    let THREE;
    try {
      THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
    } catch (err) {
      console.info("3D module unavailable; using accessible CSS illustration.");
      return;
    }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch (err) {
      console.info("WebGL unavailable; using accessible CSS illustration.");
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 50);
    camera.position.z = 7.0;
    scene.add(new THREE.AmbientLight(0xc7ecff, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(3, 4, 5); scene.add(key);
    const fill = new THREE.PointLight(0x51bacf, 45, 15);
    fill.position.set(-3, -2, 2); scene.add(fill);
    const assembly = new THREE.Group();
    scene.add(assembly);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.24, 1),
      new THREE.MeshPhysicalMaterial({ color: 0x61b6dc, metalness: .21, roughness: .21, transparent: true, opacity: .83, clearcoat: 1 })
    );
    assembly.add(core);
    const wires = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.27, 1)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .77 })
    );
    assembly.add(wires);
    const rings = [
      { r: 2.2, color: 0x206cc5, rx: .65, ry: .32 },
      { r: 1.85, color: 0x14a7a0, rx: 1.3, ry: -.38 },
      { r: 2.45, color: 0x89bcd3, rx: .18, ry: 1.25 }
    ];
    rings.forEach(({r, color, rx, ry}) => {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(r, .012, 6, 128),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .83 })
      );
      torus.rotation.set(rx, ry, 0); assembly.add(torus);
    });
    for (let n=0;n<9;n++){
      const a=n*Math.PI*2/9;
      const dot = new THREE.Mesh(
        new THREE.IcosahedronGeometry(.085, 0),
        new THREE.MeshStandardMaterial({ color: n%3===0 ? 0x16afa0 : 0x1a74d5, roughness: .35 })
      );
      dot.position.set(Math.cos(a)*2.25, Math.sin(a)*1.5, Math.sin(a*2)*.65);
      assembly.add(dot);
    }

    function quality() {
      const choice = qualitySelect?.value || "auto";
      const cap = choice === "lighter" ? 1 : choice === "sharper" ? 2 : 1.4;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
      resizeFrame();
    }
    resizeFrame = () => {
      const r=view.getBoundingClientRect();
      const w=Math.max(1,Math.floor(r.width)), h=Math.max(1,Math.floor(r.height));
      renderer.setSize(w,h,false);
      camera.aspect=w/h;
      camera.updateProjectionMatrix();
      if (isReduced()) renderer.render(scene,camera);
    };
    quality();
    qualitySelect?.addEventListener("change", quality);
    if ("ResizeObserver" in window) new ResizeObserver(resizeFrame).observe(view);
    else window.addEventListener("resize",resizeFrame,{passive:true});
    view.classList.add("webgl-active");
    let mouseX=0, mouseY=0, pointerX=0,pointerY=0;
    if (pointerDevice.matches) {
      view.addEventListener("pointermove", e => {
        const r=view.getBoundingClientRect();
        pointerX = ((e.clientX-r.left)/r.width-.5)*.35;
        pointerY = ((e.clientY-r.top)/r.height-.5)*.24;
      });
      view.addEventListener("pointerleave",()=>{pointerX=0;pointerY=0;});
    }
    let tick=0, scheduled=false;
    const paint=()=>{
      scheduled=false;
      if (!visible || document.hidden) return;
      const deltaX=(currentStage*.39 + pointerX);
      const deltaY=(-currentStage*.33 + pointerY);
      if (!isReduced()) {
        mouseX+=(deltaX-mouseX)*.065;
        mouseY+=(deltaY-mouseY)*.065;
        tick+=.0035;
        assembly.rotation.set(-.19+mouseY, .15+mouseX+tick, Math.sin(tick)*.06);
        camera.position.z+=(7-currentStage*.18-camera.position.z)*.025;
      } else {
        assembly.rotation.set(-.19+deltaY,.15+deltaX,0);
        camera.position.z=7-currentStage*.18;
      }
      renderer.render(scene,camera);
      if (!isReduced()) schedule();
    };
    const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(paint);}};
    renderFrame=schedule;
    onStageChange=schedule;
    const io = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting || false;
      if (visible) schedule();
    }, {threshold:.01});
    io.observe(view);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule();});
    schedule();
  }
  // Start WebGL only shortly before the 3D panel enters view.
  // On reduced-motion devices keep the CSS fallback until motion is requested.
  if (canvas && view) {
    let sceneStarted = false;
    const startScene = () => {
      if (sceneStarted || isReduced()) return;
      sceneStarted = true;
      initScene();
    };
    if ("IntersectionObserver" in window) {
      const loader = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          startScene();
          if (sceneStarted) loader.disconnect();
        }
      }, { rootMargin: "280px 0px", threshold: 0 });
      loader.observe(view);
    } else {
      startScene();
    }
    toggleMotion?.addEventListener("click", () => { if (!isReduced()) startScene(); });
    motionPreference.addEventListener("change", () => { if (!isReduced()) startScene(); });
  }

  // Useful for technical articles: copy the example code without hidden tracking.
  all("[data-copy-target]").forEach(button=>{
    button.addEventListener("click",async()=>{
      const target=document.getElementById(button.dataset.copyTarget);
      if(!target)return;
      try {
        await navigator.clipboard.writeText(target.innerText);
        button.textContent="Copied ✓";
        button.setAttribute("aria-label","Code copied");
      } catch { button.textContent="Select and copy the code"; }
    });
  });
})();
