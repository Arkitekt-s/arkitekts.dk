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

  // All three arches show synchronized sections of one genuinely moving movie.
  // Two public-footage sources provide resilience if a CDN has a temporary fault.
  const videos = Array.from(document.querySelectorAll(".arch-video"));
  const liveText = $("#live-status span");
  const primary = new URL("assets/mountain-loop.mp4", location.href).href;
  const backup = "https://videos.pexels.com/video-files/2888383/2888383-hd_1280_720_24fps.mp4";
  let sourceIndex = 0;
  let live = false;
  let movieFailure = false;
  let videoTimer;
  const reducedVideo = () => reduced.matches;
  function setVideoStatus(s,code) {
    if(liveText) liveText.textContent = s;
    document.body.classList.toggle("video-live",code==="live");
    document.body.classList.toggle("video-unavailable",code==="unavailable");
    document.body.dataset.videoStatus = code;
  }
  function startVideo() {
    if (!videos.length) return;
    if (reducedVideo() || pausedByUser) {
      videos.forEach(v=>v.pause());
      setVideoStatus("MOTION PAUSED · IMAGE FALLBACK","paused");
      return;
    }
    videos.forEach(v=>{
      v.muted=true;
      v.playsInline=true;
      v.play().catch(()=>{});
    });
  }
  function changeVideoSource() {
    if(sourceIndex>0)return;
    sourceIndex=1;
    movieFailure=false;
    clearTimeout(videoTimer);
    videos.forEach(v=>{
      v.classList.remove("is-playing");
      v.pause();
      v.removeAttribute("poster");
      v.src=backup;
      v.load();
    });
    setVideoStatus("TRYING BACKUP LANDSCAPE FOOTAGE…","loading");
    startVideo();
    videoTimer=setTimeout(()=>{
      if(!live){setVideoStatus("MOUNTAIN PHOTO / LIVE VIDEO UNAVAILABLE","unavailable");}
    },11500);
  }
  let videoCanPlay=false;
  if(videos.length){
    setVideoStatus("LOADING LIVE LANDSCAPE…","loading");
    const lead=videos[0];
    videos.forEach((v,index)=>{
      v.addEventListener("error",()=>{
        if(sourceIndex===0)changeVideoSource();
        else if(index===0){movieFailure=true;setVideoStatus("MOUNTAIN PHOTO / LIVE VIDEO UNAVAILABLE","unavailable");}
      });
      v.addEventListener("playing",()=>{
        if(index===0){
          live=true;
          videoCanPlay=true;
          clearTimeout(videoTimer);
          setVideoStatus("REAL MOUNTAIN FOOTAGE / LIVE","live");
          videos.forEach(vv=>vv.classList.add("is-playing"));
        }
      });
    });
    lead.addEventListener("timeupdate",()=>{
      // Small correction prevents slices moving out of phase.
      if(pausedByUser || reducedVideo() || !videoCanPlay)return;
      videos.slice(1).forEach(other=>{
        if(Math.abs(other.currentTime-lead.currentTime)>.2 && other.readyState>=2){
          try{other.currentTime=lead.currentTime;}catch{}
        }
      });
    });
    videoTimer=setTimeout(()=>{if(!live)changeVideoSource();},8500);
    startVideo();
  }

  // Extend the moving field across the entire frame, including transparent
  // header and footer. Cursor displacement distorts the underlying grid.
  // The effect is original Canvas 2D geometry; no third-party shader.
  const field=$("#pointer-pattern");
  const ctx=field?.getContext("2d",{alpha:true,desynchronized:true});
  let fieldWidth=0,fieldHeight=0,fieldDpr=1;
  let mx=-900,my=-900,trail=[],energy=0,fieldScheduled=false,fieldLast=0;
  let pointerHeld=false,fieldPointerActive=false;
  let lastInteraction=0,fieldDraws=0;
  const GRID_X=13,GRID_Y=8;
  const points=[];
  for(let row=0;row<GRID_Y;row++){
    for(let col=0;col<GRID_X;col++)points.push({col,row});
  }
  function measureField(){
    if(!ctx)return;
    fieldWidth=innerWidth;fieldHeight=innerHeight;
    fieldDpr=Math.min(devicePixelRatio||1,1.5);
    field.width=Math.round(fieldWidth*fieldDpr);
    field.height=Math.round(fieldHeight*fieldDpr);
    ctx.setTransform(fieldDpr,0,0,fieldDpr,0,0);
    renderField(performance.now());
  }
  function fieldCoord(p,t){
    const px=(p.col+.15)*(fieldWidth/GRID_X);
    const py=(p.row+.12)*(fieldHeight/GRID_Y);
    const dx=px-mx,dy=py-my,r=Math.hypot(dx,dy);
    const influence=Math.max(0,1-r/(pointerHeld?350:250));
    const amplitude=pointerHeld?38:18;
    return{
      x:px+Math.cos(t*.0015+p.row*.8)*influence*amplitude+ (r?dx/r:0)*influence*14,
      y:py+Math.sin(t*.0012+p.col*.8)*influence*amplitude+ (r?dy/r:0)*influence*14,
      influence
    };
  }
  function renderField(now){
    if(!ctx)return;
    fieldDraws+=1;
    if(field){field.dataset.draws=String(fieldDraws);}
    if(!pointerHeld&&now-lastInteraction>800)fieldPointerActive=false;
    ctx.clearRect(0,0,fieldWidth,fieldHeight);
    if(reducedVideo() || pausedByUser){fieldScheduled=false;return;}
    const active=fieldPointerActive || energy>.015 || trail.length;
    if(!active){fieldScheduled=false;return;}
    energy=Math.max(0,energy-.018);
    const coords=points.map(p=>fieldCoord(p,now));
    ctx.lineWidth=.72;
    for(let i=0;i<coords.length;i++){
      const cur=coords[i],p=points[i];
      if(cur.influence<.012)continue;
      if(p.col<GRID_X-1){
        const next=coords[i+1];
        ctx.strokeStyle="rgba(224,133,247,"+(cur.influence*.30).toFixed(3)+")";
        ctx.beginPath();ctx.moveTo(cur.x,cur.y);ctx.lineTo(next.x,next.y);ctx.stroke();
      }
      if(p.row<GRID_Y-1){
        const next=coords[i+GRID_X];
        ctx.strokeStyle="rgba(155,201,255,"+(cur.influence*.18).toFixed(3)+")";
        ctx.beginPath();ctx.moveTo(cur.x,cur.y);ctx.lineTo(next.x,next.y);ctx.stroke();
      }
      if(cur.influence>.14){
        ctx.fillStyle="rgba(235,182,255,"+(cur.influence*.75).toFixed(3)+")";
        ctx.beginPath();ctx.arc(cur.x,cur.y,cur.influence*(pointerHeld?2.5:1.8),0,Math.PI*2);ctx.fill();
      }
    }
    // Short luminous pointer trail. Hold creates expanding magnetic rings.
    trail=trail.filter(p=>now-p.born<740);
    for(let i=0;i<trail.length;i++){
      const a=trail[i],age=(now-a.born)/740;
      ctx.strokeStyle="rgba(215,105,255,"+((1-age)*.29).toFixed(3)+")";
      ctx.lineWidth=1.3*(1-age);
      if(i>0){
        const b=trail[i-1];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    if(mx>=0 && my>=0){
      const size=pointerHeld?35:20;
      const gradient=ctx.createRadialGradient(mx,my,0,mx,my,size*2.5);
      gradient.addColorStop(0,"rgba(231,151,255,.19)");
      gradient.addColorStop(1,"rgba(231,151,255,0)");
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(mx,my,size*2.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(238,170,255,"+(pointerHeld?.85:.45).toString()+")";
      ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(mx,my,size+(pointerHeld?Math.sin(now/120)*7:0),0,Math.PI*2);ctx.stroke();
    }
    fieldScheduled=false;
    if(fieldPointerActive || trail.length || energy>0)queueField();
  }
  function queueField(){
    if(!fieldScheduled && ctx){fieldScheduled=true;requestAnimationFrame(renderField);}
  }
  addEventListener("pointermove",e=>{
    if(!ctx||reducedVideo()||pausedByUser)return;
    mx=e.clientX;my=e.clientY;energy=1;fieldPointerActive=true;lastInteraction=performance.now();
    if(field){field.dataset.pointerX=String(Math.round(mx));field.dataset.pointerY=String(Math.round(my));}
    const now=performance.now();
    if(!trail.length || Math.hypot(mx-trail[trail.length-1].x,my-trail[trail.length-1].y)>7){
      trail.push({x:mx,y:my,born:now});
      if(trail.length>24)trail.shift();
    }
    queueField();
  },{passive:true});
  addEventListener("pointerdown",e=>{
    if(e.button!==0)return;
    pointerHeld=true;fieldPointerActive=true;queueField();
  },{passive:true});
  addEventListener("pointerup",()=>{
    pointerHeld=false;
    fieldPointerActive=false;
    queueField();
  },{passive:true});
  addEventListener("pointercancel",()=>{pointerHeld=false;fieldPointerActive=false;queueField();},{passive:true});
  addEventListener("pointerleave",()=>{fieldPointerActive=false;queueField();},{passive:true});
  addEventListener("resize",measureField,{passive:true});
  measureField();

  // Toggle video and lattice with the same explicit pause button.
  pauseButton?.addEventListener("click",()=>{
    if(pausedByUser){videos.forEach(v=>v.play().catch(()=>{}));startVideo();}
    else{videos.forEach(v=>v.pause());setVideoStatus("MOTION PAUSED / MOUNTAIN PHOTO","paused");}
    queueField();
  });
  reduced.addEventListener("change",()=>{
    if(reducedVideo()){videos.forEach(v=>v.pause());setVideoStatus("REDUCED MOTION / MOUNTAIN PHOTO","paused");}
    else startVideo();
    queueField();
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){videos.forEach(v=>v.pause());fieldPointerActive=false;}
    else if(!pausedByUser&&!reducedVideo())startVideo();
  });

  // Media failure is acknowledged, but the CSS mountain gradient remains readable.
  const mountain = new Image();
  mountain.addEventListener("load", () => { document.body.dataset.landscapeLoaded = "true"; });
  mountain.addEventListener("error", () => { document.body.dataset.landscapeLoaded = "false"; });
  mountain.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85";
})();
