/* Homepage media and navigation controller.
 * Mouse position and press/hold no longer change the opening landscape.
 * Keep the continuous video, optional pause control and mobile menu.
 */
(() => {
  "use strict";
  const $ = (q, parent = document) => parent.querySelector(q);
  const $$ = (q, parent = document) => [...parent.querySelectorAll(q)];
  const pauseButton = $("#motion-button");
  const menu = $("#navigation");
  const menuButton = $("#menu-button");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
 
  const setOpen = open => {
    menu?.classList.toggle("open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  menuButton?.addEventListener("click", () => setOpen(menuButton.getAttribute("aria-expanded") !== "true"));
  menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
  matchMedia("(min-width: 761px)").addEventListener("change", e => { if (e.matches) setOpen(false); });

  let pausedByUser = false;
  const isReduced = () => reduced.matches;

  // This control affects media playback only, not mouse positioning.
  function updatePause() {
    const off = pausedByUser || isReduced();
    document.body.classList.toggle("motion-off", off);
    pauseButton?.setAttribute("aria-pressed", String(off));
    if(pauseButton)pauseButton.textContent=off ? "RESUME MOTION" : "PAUSE MOTION";
  }
  pauseButton?.addEventListener("click", () => {
    pausedByUser = !pausedByUser;
    updatePause();
  });
  reduced.addEventListener("change", updatePause);
  updatePause();

  // All three arches show synchronized sections of one genuinely moving movie.
  // Two public-footage sources provide resilience if a CDN has a temporary fault.
  const videos = Array.from(document.querySelectorAll(".arch-video"));
  const liveText = $("#live-status span");
  const primary = new URL("../frame-one-live/assets/mountain-loop.webm", location.href).href;
  const backup = new URL("../frame-one-live/assets/mountain-loop.mp4", location.href).href;
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

  // Explicitly pause or resume only the landscape video.
  pauseButton?.addEventListener("click",()=>{
    if(pausedByUser){videos.forEach(v=>v.play().catch(()=>{}));startVideo();}
    else{videos.forEach(v=>v.pause());setVideoStatus("MOTION PAUSED / MOUNTAIN PHOTO","paused");}
  });
  reduced.addEventListener("change",()=>{
    if(reducedVideo()){videos.forEach(v=>v.pause());setVideoStatus("REDUCED MOTION / MOUNTAIN PHOTO","paused");}
    else startVideo();
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){videos.forEach(v=>v.pause());}
    else if(!pausedByUser&&!reducedVideo())startVideo();
  });

  // Media failure is acknowledged, but the CSS mountain gradient remains readable.
  const mountain = new Image();
  mountain.addEventListener("load", () => { document.body.dataset.landscapeLoaded = "true"; });
  mountain.addEventListener("error", () => { document.body.dataset.landscapeLoaded = "false"; });
  mountain.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85";
})();
