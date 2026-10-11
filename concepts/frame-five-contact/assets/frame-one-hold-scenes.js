/* Cinematic Frame 01: three real scenic films selected by press-and-hold.
 * The chosen film continues into Frames 02 and 03, then pauses behind
 * Frames 04–05. All three movies run at calm 70% playback speed.
 * The press-and-hold switch borrows the 10-step bottom-up staircase
 * curtain from the existing Frame 03→04 gallery reveal.
 * The approved scroll timeline, arch springs and typography
 * are untouched. Alternate clips licensed by Pexels (free video license):
 * https://www.pexels.com/video/clear-ocean-water-853862/
 * https://www.pexels.com/video/northern-lights-time-lapse-5700806/
 */
(() => {
  "use strict";
  const stage=document.getElementById("frame");
  const panorama=document.getElementById("panorama");
  const arches=[...document.querySelectorAll("#panorama .arch")];
  const shade=document.querySelector(".portal-shade");
  if(!stage||!panorama||arches.length!==3||!shade)return;

  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const films=[
    {name:"Mountain Film"},
    {
      name:"Ocean Coast",
      url:"https://videos.pexels.com/video-files/853862/853862-hd_1920_1080_25fps.mp4",
      poster:"https://images.pexels.com/videos/853862/free-video-853862.jpg?auto=compress&w=1600",
      fallback:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=85"
    },
    {
      name:"Northern Lights",
      url:"https://videos.pexels.com/video-files/5700806/5700806-hd_1920_1080_25fps.mp4",
      poster:"https://images.pexels.com/videos/5700806/pexels-photo-5700806.jpeg?auto=compress&w=1600",
      fallback:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=85"
    }
  ];
  const player=document.createElement("video");
  player.id="hold-scene-film";
  player.className="hold-scene-film";
  player.muted=true;
  player.loop=true;
  player.playsInline=true;
  player.preload="none";
  player.disablePictureInPicture=true;
  player.setAttribute("aria-hidden","true");
  player.setAttribute("tabindex","-1");
  const FILM_SPEED=.70;
  // The same reduced speed carries from three windows into the full screen.
  const originalMovies=[
    ...document.querySelectorAll("#panorama .arch-video"),
    document.getElementById("portal-film")
  ].filter(Boolean);
  function slowMovies(){
    for(const video of [...originalMovies,player]){
      if(Math.abs(video.playbackRate-FILM_SPEED)>.001)
        video.playbackRate=FILM_SPEED;
    }
  }
  originalMovies.forEach(video=>{
    video.addEventListener("loadedmetadata",slowMovies);
    video.addEventListener("playing",slowMovies);
  });
  player.addEventListener("loadedmetadata",slowMovies);
  player.addEventListener("playing",slowMovies);
  slowMovies();
  stage.insertBefore(player,shade);

  // Render ONE moving video through three synchronized arch windows.
  // This uses one decoded movie, not three separate video downloads.
  const panes=arches.map(arch=>{
    const canvas=document.createElement("canvas");
    canvas.className="hold-scene-paint";
    canvas.setAttribute("aria-hidden","true");
    arch.append(canvas);
    return {arch,canvas,ctx:canvas.getContext("2d",{alpha:true})};
  });
  const photo=new Image();
  photo.decoding="async";
  // The existing 03→04 transition rises as ten staggered columns.
  // Reuse that visual language here, but without altering its actual code.
  const wipe=document.createElement("div");
  wipe.className="hold-scene-wipe";
  wipe.setAttribute("aria-hidden","true");
  const curtainPanels=Array.from({length:10},(_,i)=>{
    const panel=document.createElement("span");
    panel.className="hold-scene-curtain-panel";
    panel.style.left=i*10+"%";
    panel.style.width="calc(10% + 1px)";
    panel.style.top="100%";
    panel.style.bottom="0";
    wipe.append(panel);
    return panel;
  });
  stage.append(wipe);
  const button=document.createElement("button");
  button.type="button";button.className="hold-scene-control";
  button.id="hold-scene-control";
  stage.append(button);
  const hint=document.createElement("span");
  hint.className="hold-scene-hint";
  hint.setAttribute("aria-hidden","true");
  hint.textContent="HOLD ANYWHERE TO CHANGE THE SCENE";
  stage.append(hint);

  let scene=0,armed=null,heldPointer=null,transition=null;
  let videoLoop=0,lastDraw=0,selectionVersion=0;
  let lastDimensions="",lastOpacity=-1,lastVisible=false;
  function progress(){return clamp(Number(document.body.dataset.portalProgress||0),0,1);}
  function journey(){return Number(document.body.dataset.journeyProgress||0);}
  function eligible(){
    return (document.body.dataset.currentFrame||"1")==="1" &&
      progress()<.075 && !document.body.classList.contains("motion-off") &&
      !document.hidden;
  }
  function inMovieChapters(){
    return journey()<2.82 && !document.hidden;
  }
  function motionAllowed(){
    return !reduced.matches && !document.body.classList.contains("motion-off");
  }
  function status(){
    button.textContent="PRESS & HOLD  ·  "+String(scene+1).padStart(2,"0")+" / 03";
    button.setAttribute("aria-label",
      films[scene].name+". Click to change to the next moving landscape.");
  }
  function resize(){sizePanes();}
  function sizePanes(){
    for(const pane of panes){
      const r=pane.arch.getBoundingClientRect();
      const scale=Math.min(devicePixelRatio||1,1.4);
      const w=Math.max(1,Math.round(r.width*scale));
      const h=Math.max(1,Math.round(r.height*scale));
      if(pane.canvas.width!==w)pane.canvas.width=w;
      if(pane.canvas.height!==h)pane.canvas.height=h;
    }
  }
  // A cover-fit crop is calculated across the FULL panorama, then sliced
  // by each arch's actual position. No stretched images, no seams.
  function paintPanes(){
    if(scene===0||!inMovieChapters())return false;
    const media=player.readyState>=2&&player.videoWidth ? player :
      (photo.complete&&photo.naturalWidth?photo:null);
    if(!media)return false;
    const srcW=media.videoWidth||media.naturalWidth;
    const srcH=media.videoHeight||media.naturalHeight;
    if(srcW<1||srcH<1)return false;
    const full=panorama.getBoundingClientRect();
    const w=Math.max(1,full.width),h=Math.max(1,full.height);
    const scaling=Math.max(w/srcW,h/srcH);
    const cropW=w/scaling,cropH=h/scaling;
    const startX=(srcW-cropW)*.5,startY=(srcH-cropH)*.5;
    sizePanes();
    let drawn=false;
    for(const pane of panes){
      if(!pane.ctx)continue;
      const r=pane.arch.getBoundingClientRect();
      const local=clamp((r.left-full.left)/w,0,1);
      const part=clamp(r.width/w,.001,1-local);
      try{
        pane.ctx.drawImage(media,startX+cropW*local,startY,
          Math.max(1,cropW*part),cropH,
          0,0,pane.canvas.width,pane.canvas.height);
        drawn=true;
      }catch{
        // If a remote clip is blocked, the still fallback remains visible.
      }
    }
    if(drawn && panorama.dataset.artMediaReady!=="true"){
      panorama.dataset.artMediaReady="true";
      showFilm();
    }
    return drawn;
  }
  function render(now){
    videoLoop=0;
    if(scene===0||!inMovieChapters())return;
    if(now-lastDraw>=32){
      lastDraw=now;
      if(progress()<.995)paintPanes();
    }
    if(motionAllowed()&&player.paused && player.readyState>=2)
      player.play().catch(()=>{});
    if(inMovieChapters()&&motionAllowed())videoLoop=requestAnimationFrame(render);
  }
  function startRender(){
    if(scene===0||videoLoop||!inMovieChapters()||!motionAllowed())return;
    videoLoop=requestAnimationFrame(render);
  }
  function stopRender(){
    if(videoLoop)cancelAnimationFrame(videoLoop);
    videoLoop=0;
  }
  function showFilm(){
    if(scene===0)return;
    const p=progress();
    const visible=inMovieChapters() && p>.63 && panorama.dataset.artMediaReady==="true";
    const opacity=visible?ease((p-.69)/.24):0;
    if(opacity!==lastOpacity){
      player.style.opacity=opacity.toFixed(3);
      lastOpacity=opacity;
    }
    if(visible!==lastVisible){
      player.style.visibility=visible?"visible":"hidden";
      lastVisible=visible;
    }
    if(!inMovieChapters()||!motionAllowed()){
      player.pause();stopRender();
    }else if(player.paused && player.readyState>=2){
      player.play().catch(()=>{});
      startRender();
    }
  }
  function setScene(next){
    scene=((next%3)+3)%3;
    panorama.dataset.artMediaReady="false";
    selectionVersion++;
    const version=selectionVersion;
    panorama.dataset.artScene=String(scene);
    document.body.dataset.frameOneArt=String(scene);
    status();
    lastOpacity=-1;lastVisible=false;
    if(scene===0){
      stopRender();player.pause();
      player.style.opacity="0";player.style.visibility="hidden";
      player.removeAttribute("src");player.load();
      return;
    }
    const cfg=films[scene];
    photo.onload=()=>{if(version===selectionVersion){paintPanes();startRender();}};
    photo.onerror=()=>{
      if(version!==selectionVersion)return;
      if(!photo.src.startsWith(cfg.fallback))photo.src=cfg.fallback;
    };
    photo.src=cfg.poster;
    player.pause();
    player.src=cfg.url;
    player.load();
    player.poster=cfg.poster;
    if(motionAllowed()&&inMovieChapters())
      player.play().catch(()=>{});
    startRender();
    showFilm();
  }
  player.addEventListener("loadeddata",()=>{paintPanes();startRender();});
  player.addEventListener("playing",startRender);
  player.addEventListener("error",()=>{
    // Prefer an attractive full-size image instead of a blank patterned film.
    if(scene!==0)paintPanes();
  });
  // Bottom-up staircase curtain, like the Frame 03 → 04 reveal.
  // Cover the outgoing image, swap halfway, then reveal the new image
  // from bottom to top. Each of the ten columns is slightly staggered.
  const CURTAIN_MS=1850;
  function resetPanels(){
    for(const panel of curtainPanels){
      panel.style.top="100%";
      panel.style.bottom="0";
    }
  }
  function wipeFrame(now){
    if(!transition)return;
    const state=transition;
    const t=clamp((now-state.started)/CURTAIN_MS,0,1);
    if(!eligible()){
      transition=null;
      wipe.style.visibility="hidden";
      resetPanels();
      return;
    }
    if(!state.switched && t>=.5){
      state.switched=true;
      setScene(state.next);
    }
    for(let i=0;i<curtainPanels.length;i++){
      const offset=i*.012;
      const panel=curtainPanels[i];
      if(t<.5){
        const rise=ease((t-offset)/(.49-9*.012));
        panel.style.top=(100*(1-rise)).toFixed(3)+"%";
        panel.style.bottom="0";
      }else{
        const reveal=ease((t-.5-offset)/(.5-9*.012));
        panel.style.top="0";
        panel.style.bottom=(100*reveal).toFixed(3)+"%";
      }
    }
    if(t>=1){
      transition=null;
      wipe.style.visibility="hidden";
      resetPanels();
      return;
    }
    requestAnimationFrame(wipeFrame);
  }
  function advance(x,y){
    if(!eligible()||transition)return;
    resize();
    if(reduced.matches){setScene((scene+1)%3);return;}
    resetPanels();
    transition={
      next:(scene+1)%3,started:performance.now(),switched:false
    };
    wipe.style.visibility="visible";
    requestAnimationFrame(wipeFrame);
  }
  function unarm(){
    if(armed!==null)clearTimeout(armed);
    armed=null;heldPointer=null;
  }
  stage.addEventListener("pointerdown",e=>{
    if(!eligible()||transition||e.button!==0||armed!==null)return;
    if(e.target instanceof Element&&e.target.closest(
      "a,button,input,textarea,select,.journey-scrollbar,#journey-scrollbar,#gallery-viewport,#globe-shell"))return;
    const x=e.clientX,y=e.clientY;
    heldPointer={id:e.pointerId,x,y,triggered:false};
    armed=setTimeout(()=>{
      armed=null;
      if(!heldPointer||heldPointer.id!==e.pointerId)return;
      heldPointer.triggered=true;advance(x,y);
    },e.pointerType==="touch"?440:320);
  },{passive:true});
  stage.addEventListener("pointermove",e=>{
    if(!heldPointer||heldPointer.id!==e.pointerId||heldPointer.triggered)return;
    if(Math.hypot(e.clientX-heldPointer.x,e.clientY-heldPointer.y)>18)unarm();
  },{passive:true});
  addEventListener("pointerup",unarm,{passive:true});
  addEventListener("pointercancel",unarm,{passive:true});
  addEventListener("blur",()=>{unarm();player.pause();stopRender();});
  button.addEventListener("click",()=>{
    const r=stage.getBoundingClientRect();
    advance(r.left+r.width*.34,r.top+r.height*.48);
  });
  addEventListener("keydown",e=>{
    if(e.key==="Escape")unarm();
  });
  addEventListener("resize",()=>{resize();startRender();},{passive:true});
  reduced.addEventListener("change",showFilm);
  document.getElementById("motion-button")?.addEventListener("click",showFilm);
  document.addEventListener("visibilitychange",showFilm);
  new MutationObserver(()=>{
    const p=progress(),j=journey();
    // Do not revert to mountains on entering the other chapters.
    // Keep playing through Section 03; stop under Gallery and Contact.
    const signature=[p.toFixed(3),(j>=2.82?"gallery":"film"),
      document.body.classList.contains("motion-off")?"off":"on"].join(":");
    if(signature!==lastDimensions){
      lastDimensions=signature;
      if(!eligible())unarm();
      if(transition&&!eligible()){
        if(!transition.switched){
          // A rapid scroll during a swap still resolves to the requested film.
          setScene(transition.next);
          transition.switched=true;
        }
        transition=null;wipe.style.visibility="hidden";resetPanels();
      }
      showFilm();
      startRender();
    }
  }).observe(document.body,{attributes:true,attributeFilter:[
    "data-current-frame","data-portal-progress","data-journey-progress","class"
  ]});
  resize();setScene(0);wipe.style.visibility="hidden";
})();