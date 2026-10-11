/* Cinematic Frame 01: AI, server and coding footage via press-and-hold.
 * The selected first AI film continues into Frames 02 and 03, then pauses behind
 * Frames 04–05. All three movies run at calm 50% playback speed.
 * The hold transition is a translucent organic, marbled liquid wave.
 * Only the film changes; the title and all Section 01 layout stay fixed.
 * The approved scroll timeline, arch springs and typography
 * are untouched. Alternate clips licensed by Pexels (free video license):
 * https://www.pexels.com/video/an-artist-s-animation-of-artificial-intelligence-ai-this-video-represents-how-ai-powered-tools-can-support-us-and-save-time-it-was-created-by-martina-stiftinger-as-part-of-the-visualis-18069232/
 * https://www.pexels.com/video/an-artist-s-illustration-of-artificial-intelligence-ai-this-image-explores-ai-generated-media-can-be-watermarked-it-was-created-by-zunc-studio-as-part-of-the-visualising-ai-project-lau-25744122/
 * https://www.pexels.com/video/an-artist-s-animation-of-artificial-intelligence-ai-this-visual-depicts-the-process-used-by-text-to-image-diffusion-models-it-was-created-by-artist-linus-zoll-as-part-of-the-visualisin-18069165/
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
    {name:"AI Visualisation · Google DeepMind"},
    {
      name:"Visualising AI · SynthID Watermarking · Zünc Studio",
      // Pexels 25744122: HD delivery with the confirmed 4K download as backup.
      url:"https://videos.pexels.com/video-files/25744122/11904079_1920_1080_30fps.mp4",
      backup:"https://videos.pexels.com/video-files/25744122/11904079_3840_2160_30fps.mp4",
      poster:"https://images.pexels.com/videos/25744122/pexels-photo-25744122.jpeg?auto=compress&w=1600",
      fallback:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85"
    },
    {
      name:"Visualising AI · Text-to-image Diffusion · Linus Zoll",
      // Official Pexels download for video 18069165 (square 2160p, 24fps).
      url:"https://videos.pexels.com/video-files/18069165/18069165-uhd_2160_2160_24fps.mp4",
      poster:"https://images.pexels.com/videos/18069165/ai-ai-art-artificial-intelligence-computer-18069165.jpeg?auto=compress&w=1600",
      fallback:"https://images.pexels.com/videos/18069165/ai-ai-art-artificial-intelligence-computer-18069165.jpeg?auto=compress&w=1600"
    }
  ];
  // Fresh, independent choice for every homepage load. We deliberately do
  // not store the choice: reloading can select any of the three movies.
  // Once chosen, the same film stays active through sections 01, 02 and 03.
  const preselected=Number(document.documentElement.dataset.initialHomepageFilm);
  const initialScene=Number.isInteger(preselected) && preselected>=0 && preselected<films.length
    ? preselected : Math.floor(Math.random()*films.length);
  document.body.dataset.initialHomepageFilm=String(initialScene);
  const player=document.createElement("video");
  player.id="hold-scene-film";
  player.className="hold-scene-film";
  player.muted=true;
  player.loop=true;
  player.playsInline=true;
  player.preload="metadata";
  player.disablePictureInPicture=true;
  player.setAttribute("aria-hidden","true");
  player.setAttribute("tabindex","-1");
  const FILM_SPEED=.50;
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
  photo.className="hold-scene-poster";
  photo.setAttribute("aria-hidden","true");
  stage.insertBefore(photo,player);
  let usedBackup=false;
  // An offscreen painterly texture gives the organic wave marbled detail.
  // It is generated once, not recreated each animation frame.
  const texture=document.createElement("canvas");
  texture.width=600;texture.height=350;
  const tex=texture.getContext("2d",{alpha:false});
  function createMarble(){
    if(!tex)return;
    const w=texture.width,h=texture.height;
    const img=tex.createImageData(w,h),data=img.data;
    const colors=[[43,22,84],[81,43,140],[129,74,177],
      [180,119,210],[219,158,222],[240,184,218],[87,53,152]];
    for(let y=0;y<h;y++){
      const v=y/h;
      for(let x=0;x<w;x++){
        const u=x/w;
        const dx=u-.40,dy=v-.46;
        const radius=Math.hypot(dx*1.2,dy*.86);
        const theta=Math.atan2(dy,dx);
        const flow=19*radius-2.6*theta+
          2.1*Math.sin(v*8+u*3)+1.3*Math.sin(u*13-v*6);
        const band=.5+.23*Math.sin(flow)+.14*Math.sin(flow*2.35+
          Math.sin(v*14))+.09*Math.cos(23*u+10*v);
        const pos=clamp(band,0,.9999)*(colors.length-1);
        const a=Math.floor(pos),b=Math.min(colors.length-1,a+1),z=pos-a;
        const offset=(y*w+x)*4;
        const shade=.91+.09*Math.sin((u+v)*6.3);
        for(let k=0;k<3;k++)
          data[offset+k]=(colors[a][k]*(1-z)+colors[b][k]*z)*shade;
        data[offset+3]=255;
      }
    }
    tex.putImageData(img,0,0);
    // Threads of polished silver-violet flow across the painted waves.
    tex.lineCap="round";
    for(let row=0;row<120;row++){
      const baseline=(row+.5)*h/120;
      tex.beginPath();
      for(let x=0;x<=w;x+=5){
        const y=baseline+17*Math.sin(x*.023+row*.082)+
          6*Math.sin(x*.067-row*.12);
        if(x===0)tex.moveTo(x,y);else tex.lineTo(x,y);
      }
      tex.lineWidth=row%10===0?1.05:.38;
      tex.strokeStyle=row%10===0?
        "rgba(255,218,252,.19)":"rgba(246,199,247,.10)";
      tex.stroke();
    }
  }
  createMarble();
  const wipe=document.createElement("canvas");
  wipe.className="hold-scene-wipe";
  wipe.setAttribute("aria-hidden","true");
  document.body.append(wipe);
  const wipeCtx=wipe.getContext("2d",{alpha:true});
  let wipeW=1,wipeH=1,wipeDpr=1;
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
  function resize(){
    wipeW=Math.max(1,innerWidth);wipeH=Math.max(1,innerHeight);
    wipeDpr=Math.min(devicePixelRatio||1,1.5);
    wipe.width=Math.ceil(wipeW*wipeDpr);
    wipe.height=Math.ceil(wipeH*wipeDpr);
    wipeCtx?.setTransform(wipeDpr,0,0,wipeDpr,0,0);
    sizePanes();
  }
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
      if(progress()<.90)paintPanes();
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
    // Option A: alternate movie and poster dissolve over the same window
    // as the default full-screen film. No late cut or default-film bleed.
    const visible=inMovieChapters() && p>.39 && panorama.dataset.artMediaReady==="true";
    const opacity=visible?ease((p-.42)/.47):0;
    // Real HD footage takes over when decoded. A still poster preserves
    // the selected look if the media host is slow or temporarily blocked.
    photo.style.opacity=opacity.toFixed(3);
    player.style.opacity=player.readyState>=2?opacity.toFixed(3):"0";
    lastOpacity=opacity;
    if(visible!==lastVisible){
      player.style.visibility=visible?"visible":"hidden";
      photo.style.visibility=visible?"visible":"hidden";
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
    // The baseline video must not play behind the selected alternative.
    // Resume the shared original film if the user manually cycles to 01.
    for(const base of originalMovies){
      if(scene!==0){base.pause();continue;}
      if(!reduced.matches && !document.body.classList.contains("motion-off"))
        base.play().catch(()=>{});
    }
    status();
    lastOpacity=-1;lastVisible=false;
    if(scene===0){
      stopRender();player.pause();
      player.style.opacity="0";player.style.visibility="hidden";
      photo.style.opacity="0";photo.style.visibility="hidden";
      player.removeAttribute("src");player.load();
      return;
    }
    const cfg=films[scene];
    usedBackup=false;
    photo.onload=()=>{if(version===selectionVersion){paintPanes();showFilm();startRender();}};
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
  player.addEventListener("loadeddata",()=>{
    slowMovies();paintPanes();showFilm();startRender();
  });
  player.addEventListener("playing",()=>{slowMovies();showFilm();startRender();});
  player.addEventListener("error",()=>{
    if(scene===0)return;
    const cfg=films[scene];
    if(!usedBackup && cfg.backup && cfg.backup!==cfg.url){
      // The source's Pexels download redirect confirms this UHD file.
      usedBackup=true;
      player.src=cfg.backup;
      player.load();
      if(motionAllowed()&&inMovieChapters())player.play().catch(()=>{});
    }else{
      // Keep a real photographic still if the Pexels servers refuse playback.
      player.style.opacity="0";
      paintPanes();showFilm();
    }
  });
  // Inspired by the supplied reference: one translucent marbled wave
  // expands across the arch background without moving the white headline.
  // The new landscape fades in through the wave, then the wave evaporates.
  const LIQUID_MS=2400;
  function clearWipe(){
    if(wipeCtx)wipeCtx.clearRect(0,0,wipeW,wipeH);
    wipe.style.visibility="hidden";
  }
  function liquidFrame(now){
    if(!transition||!wipeCtx)return;
    const tr=transition;
    const t=clamp((now-tr.started)/LIQUID_MS,0,1);
    if(!eligible()){
      if(!tr.switched)setScene(tr.next);
      transition=null;clearWipe();
      return;
    }
    // Prepare the new scene underneath the semi-transparent wave.
    if(!tr.switched&&t>=.48){
      tr.switched=true;
      setScene(tr.next);
    }
    wipeCtx.clearRect(0,0,wipeW,wipeH);
    if(t>=1){
      transition=null;clearWipe();
      return;
    }
    const maxRadius=Math.hypot(wipeW, wipeH)*1.18;
    const entering=ease(t/.52);
    const leaving=1-ease((t-.57)/.42);
    const radius=Math.max(1,22+maxRadius*Math.min(entering,leaving));
    // Liquid keeps drifting sideways, as in the filmed reference.
    const drift=ease(t);
    const cx=tr.x+(wipeW*.22)*drift;
    const cy=tr.y-(wipeH*.065)*drift;
    const alpha=.68*(1-ease((t-.62)/.37));
    if(alpha>.002){
      wipeCtx.save();
      wipeCtx.beginPath();
      const segments=110;
      for(let i=0;i<=segments;i++){
        const a=(i/segments)*Math.PI*2;
        const flutter=1+.050*Math.sin(7*a+now*.0024)+
          .030*Math.sin(13*a-now*.0022)+
          .014*Math.cos(19*a+now*.0018);
        const x=cx+Math.cos(a)*radius*flutter;
        const y=cy+Math.sin(a)*radius*flutter*.89;
        if(i===0)wipeCtx.moveTo(x,y);else wipeCtx.lineTo(x,y);
      }
      wipeCtx.closePath();
      wipeCtx.save();
      wipeCtx.clip();
      wipeCtx.globalAlpha=alpha;
      if(tex){
        const shift=(t*.04)*wipeW;
        wipeCtx.drawImage(texture,-wipeW*.06+shift,-wipeH*.08,
          wipeW*1.12,wipeH*1.16);
      }else{
        wipeCtx.fillStyle="rgba(169,101,201,.82)";
        wipeCtx.fillRect(0,0,wipeW,wipeH);
      }
      // Gentle luminous bloom, never a fully opaque colored curtain.
      const gleam=wipeCtx.createRadialGradient(cx,cy,4,cx,cy,radius);
      gleam.addColorStop(0,"rgba(245,209,255,.19)");
      gleam.addColorStop(.53,"rgba(215,144,250,.08)");
      gleam.addColorStop(1,"rgba(85,31,154,.04)");
      wipeCtx.fillStyle=gleam;
      wipeCtx.fillRect(0,0,wipeW,wipeH);
      wipeCtx.restore();
      wipeCtx.lineWidth=2.5;
      wipeCtx.strokeStyle="rgba(249,202,255,"+(.68*alpha).toFixed(3)+")";
      wipeCtx.shadowBlur=22;
      wipeCtx.shadowColor="rgba(218,120,252,"+(.64*alpha).toFixed(3)+")";
      wipeCtx.stroke();
      wipeCtx.restore();
    }
    requestAnimationFrame(liquidFrame);
  }
  const rectlessWidth=()=>Math.max(1,innerWidth);
  const rectlessHeight=()=>Math.max(1,innerHeight);
  function advance(x,y){
    if(!eligible()||transition)return;
    resize();
    if(reduced.matches){setScene((scene+1)%3);return;}
    transition={
      next:(scene+1)%3,started:performance.now(),switched:false,
      x:clamp(x,0,rectlessWidth()),y:clamp(y,0,rectlessHeight())
    };
    wipe.style.visibility="visible";
    requestAnimationFrame(liquidFrame);
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
        transition=null;clearWipe();
      }
      showFilm();
      startRender();
    }
  }).observe(document.body,{attributes:true,attributeFilter:[
    "data-current-frame","data-portal-progress","data-journey-progress","class"
  ]});
  resize();setScene(initialScene);clearWipe();
})();