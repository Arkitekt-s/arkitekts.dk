/* Homepage media and navigation controller.
 * First scene is Google DeepMind's AI animation on Pexels.
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

  // All three arches share synchronized sections of the AI film.
  // 1440p and 4K versions handle a temporary video file problem.
  const videos = Array.from(document.querySelectorAll(".arch-video"));
  const liveText = $("#live-status span");
  const primary = "https://videos.pexels.com/video-files/18069232/18069232-uhd_2560_1440_24fps.mp4";
  const backup = "https://videos.pexels.com/video-files/18069232/18069232-uhd_3840_2160_24fps.mp4";
  let sourceIndex = 0;
  let live = false;
  let movieFailure = false;
  let videoTimer;
  const reducedVideo = () => reduced.matches;
  const usingAlternate = () => {
    const selected = document.getElementById("panorama")?.dataset.artScene;
    return selected === "1" || selected === "2";
  };
  function setVideoStatus(s,code) {
    if(liveText) liveText.textContent = s;
    document.body.classList.toggle("video-live",code==="live");
    document.body.classList.toggle("video-unavailable",code==="unavailable");
    document.body.dataset.videoStatus = code;
  }
  function startVideo() {
    if (!videos.length) return;
    // Another video is selected for this visit. Do not decode three
    // unused 4K copies behind the selected film on mobile devices.
    if (usingAlternate()) {
      videos.forEach(v=>v.pause());
      return;
    }
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
    if(sourceIndex>0 || usingAlternate())return;
    sourceIndex=1;
    movieFailure=false;
    clearTimeout(videoTimer);
    videos.forEach(v=>{
      v.classList.remove("is-playing");
      v.pause();
      // Keep the actual AI still image visible while the backup loads.
      v.src=backup;
      v.load();
    });
    setVideoStatus("LOADING BACKUP AI FILM…","loading");
    startVideo();
    videoTimer=setTimeout(()=>{
      if(!live){setVideoStatus("AI IMAGE / LIVE VIDEO UNAVAILABLE","unavailable");}
    },11500);
  }
  let videoCanPlay=false;
  if(videos.length){
    setVideoStatus("LOADING AI FILM…","loading");
    const lead=videos[0];
    videos.forEach((v,index)=>{
      v.addEventListener("error",()=>{
        if(usingAlternate())return;
        if(sourceIndex===0)changeVideoSource();
        else if(index===0){movieFailure=true;setVideoStatus("AI IMAGE / LIVE VIDEO UNAVAILABLE","unavailable");}
      });
      v.addEventListener("playing",()=>{
        if(index===0){
          live=true;
          videoCanPlay=true;
          clearTimeout(videoTimer);
          setVideoStatus("AI MOTION / LIVE","live");
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
    videoTimer=setTimeout(()=>{if(!live && !usingAlternate())changeVideoSource();},8500);
    startVideo();
  }

  // The full-screen film uses the same source as the three arches.
  // If the smaller version fails, retry the confirmed 4K Pexels file.
  const portalFilm=document.getElementById("portal-film");
  let portalBackup=false;
  portalFilm?.addEventListener("error",()=>{
    if(portalBackup)return;
    portalBackup=true;
    portalFilm.src=backup;
    portalFilm.load();
    if(!pausedByUser&&!reducedVideo()&&
       Number(document.body.dataset.portalProgress||0)>.48)
      portalFilm.play().catch(()=>{});
  },true);

  // Pause or resume the AI video.
  pauseButton?.addEventListener("click",()=>{
    if(pausedByUser){startVideo();}
    else{videos.forEach(v=>v.pause());setVideoStatus("MOTION PAUSED / AI IMAGE","paused");}
  });
  reduced.addEventListener("change",()=>{
    if(reducedVideo()){videos.forEach(v=>v.pause());setVideoStatus("REDUCED MOTION / AI IMAGE","paused");}
    else startVideo();
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){videos.forEach(v=>v.pause());}
    else if(!pausedByUser&&!reducedVideo())startVideo();
  });

  // The corresponding Pexels still image remains readable if video fails.
  const mountain = new Image();
  mountain.addEventListener("load", () => { document.body.dataset.landscapeLoaded = "true"; });
  mountain.addEventListener("error", () => { document.body.dataset.landscapeLoaded = "false"; });
  mountain.src = "https://images.pexels.com/videos/18069232/ai-ai-tool-artificial-intelligence-assistive-technology-18069232.jpeg?auto=compress&w=2000";
})();
