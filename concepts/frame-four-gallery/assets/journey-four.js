/* Frames 01 -> 02 -> 03 -> 04: approved journey plus cinematic photo gallery.
 * Preserve the approved Frame 01 code as-is (loaded from shared assets).
 * Isolated progressive animation layer; both approved baseline folders unchanged.
 * Scroll DOWN grows arches until video fills the viewport, revealing text.
 * Scroll UP runs the exact transition backward.
 */
(() => {
  "use strict";
  const stage=document.getElementById("frame");
  const panorama=document.getElementById("panorama");
  const arches=[...document.querySelectorAll("#panorama .arch")];
  const hero=document.querySelector(".hero-text");
  const support=document.querySelector(".supporting-line");
  const eyebrow=document.querySelector(".scene-eyebrow");
  const chapter=document.querySelector("#chapter-two");
  const third=document.querySelector("#chapter-three");
  const fourth=document.getElementById("frame-four-gallery");
  const backdrop=document.querySelector(".frame-four-backdrop");
  const curtain=document.getElementById("frame-four-curtain");
  const viewport=document.getElementById("gallery-viewport");
  const reel=document.getElementById("gallery-reel");
  const photos=[...document.querySelectorAll(".gallery-photo")];
  const count=document.getElementById("gallery-count");
  const galleryPrev=document.getElementById("gallery-prev");
  const galleryNext=document.getElementById("gallery-next");
  const twenty=document.querySelector("#twenty-hotspot");
  const twentyParts=[...document.querySelectorAll(".twenty-piece")];
  const shade=document.querySelector(".portal-shade");
  const rail=document.querySelector(".portal-navigation");
  const fill=document.getElementById("portal-fill");
  const wheelHint=document.getElementById("wheel-hint");
  const note=document.getElementById("interaction-note");
  const live=document.getElementById("live-status");
  const tools=document.querySelector(".scene-tools");
  const film=document.getElementById("portal-film");
  const windowVideos=[...document.querySelectorAll("#panorama .arch-video")];
  const pauseControl=document.getElementById("motion-button");
  let filmStarted=false, windowsPaused=false;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(!stage||!panorama||arches.length!==3||!chapter||!third||!twenty||!fourth||!reel||photos.length<5)return;

  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const normalize=(v,from,to)=>clamp((v-from)/(to-from),0,1);
  const toPx=n=>n.toFixed(2)+"px";

  let target=0,position=0,frame=0;
  let initial={w:0,h:0,top:0,gap:0,head:0,foot:0};
  let touchY=null;
  let lastVisible=false, thirdVisible=false, fourthVisible=false;
  let galleryTarget=2,galleryPosition=2,galleryPointer=0,galleryPointerTarget=0;
  let reelDragging=false,downX=0,downIndex=0,galleryStep=320;
  let filmSuspendedForGallery=false;
  let lastRendered=0;

  function measure(){
    // Drop runtime values briefly so measurements come from approved CSS.
    const stageWas=[stage.style.top,stage.style.bottom];
    const overrides=[panorama.style.width,panorama.style.height,panorama.style.gap,panorama.style.top,panorama.style.transform];
    stage.style.removeProperty("top");
    stage.style.removeProperty("bottom");
    for(const property of ["width","height","gap","top","transform"])panorama.style.removeProperty(property);
    const style=getComputedStyle(panorama);
    const head=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h"));
    const foot=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--footer-h"));
    initial={
      w:parseFloat(style.width),h:parseFloat(style.height),
      gap:parseFloat(style.gap),top:parseFloat(style.top),
      head:Number.isFinite(head)?head:100,
      foot:Number.isFinite(foot)?foot:80
    };
    // Restore the current state immediately.
    stage.style.top=stageWas[0];stage.style.bottom=stageWas[1];
    ["width","height","gap","top","transform"].forEach((p,i)=>{
      if(overrides[i])panorama.style.setProperty(p,overrides[i]);
    });
    galleryStep=Math.max(120,photos[1].offsetLeft-photos[0].offsetLeft);
    paint();
  }

  function syncFilms(p){
    if(!film)return;
    const lead=windowVideos[0];
    const motionPaused=reduced.matches||document.body.classList.contains("motion-off");

    // When arches are nearly joined, prepare one film with the same source.
    if(p>.52 && !filmStarted && !motionPaused){
      filmStarted=true;
      if(lead && lead.readyState>=2){
        try{film.currentTime=lead.currentTime;}catch{}
      }
      film.play().catch(()=>{filmStarted=false;});
    }
    if(p>.52 && !motionPaused && film.paused && !filmStarted){
      filmStarted=true;
      film.play().catch(()=>{filmStarted=false;});
    }
    if(motionPaused)film.pause();

    const ready=film.readyState>=2;
    const blend=ready?smooth(normalize(p,.70,.95)):0;
    film.classList.toggle("is-active",blend>.005);
    film.style.opacity=String(blend);

    // Once the seamless movie is fully opaque, decode just one stream.
    // Resume and resync all arches when the user scrolls back.
    if(p>.995 && ready && !windowsPaused){
      windowVideos.forEach(video=>video.pause());
      windowsPaused=true;
    }else if(p<.975 && windowsPaused){
      windowVideos.forEach(video=>{
        try{if(film.readyState>=2)video.currentTime=film.currentTime;}catch{}
        if(!motionPaused)video.play().catch(()=>{});
      });
      windowsPaused=false;
    }
    if(p<.46 && filmStarted){
      film.pause();
      filmStarted=false;
    }
  }
  pauseControl?.addEventListener("click",()=>{
    // The frozen Frame 01 handler runs first; then mirror its state.
    setTimeout(()=>{
      if(!film)return;
      if(document.body.classList.contains("motion-off"))film.pause();
      else if(position>.52)film.play().catch(()=>{});
    },0);
  });

  function paint(){
    const journey=position;
    const p=Math.min(1,journey);
    const grow=smooth(normalize(p,.015,.88));
    const fillScreen=smooth(normalize(p,.12,.97));
    const head=Math.max(0,initial.head*(1-fillScreen));
    const foot=Math.max(0,initial.foot*(1-fillScreen));
    const sceneHeight=innerHeight-head-foot;
    stage.style.top=toPx(head);
    stage.style.bottom=toPx(foot);
    // The landscape travels from the first-frame card to the full-viewport film.
    panorama.style.width=toPx(lerp(initial.w,innerWidth+2,grow));
    panorama.style.height=toPx(lerp(initial.h,sceneHeight+2,grow));
    panorama.style.gap=toPx(lerp(initial.gap,0,grow));
    panorama.style.top=toPx(lerp(initial.top,sceneHeight*.5,grow));
    if(p>.001){
      panorama.style.transform="translate3d(-50%,-50%,0) scale(1)";
    }else{
      panorama.style.removeProperty("transform");
    }
    const round=(1-grow);
    if(grow>.002){
      arches.forEach(a=>{
        a.style.borderRadius=(50*round).toFixed(3)+"% "+(50*round).toFixed(3)+"% 0 0 / "+(28*round).toFixed(3)+"% "+(28*round).toFixed(3)+"% 0 0";
      });
    }else{
      arches.forEach(a=>a.style.removeProperty("border-radius"));
    }
    // The old statement leaves before the video finishes expanding.
    const firstOpacity=1-smooth(normalize(p,.13,.53));
    if(hero)hero.style.opacity=String(firstOpacity);
    if(support)support.style.opacity=String(firstOpacity);
    if(eyebrow)eyebrow.style.opacity=String(firstOpacity);
    if(note)note.style.opacity=String(firstOpacity);
    if(live)live.style.opacity=String(firstOpacity);
    const darkness=smooth(normalize(p,.47,.87));
    if(shade)shade.style.opacity=String(darkness*.93);
    syncFilms(p);
    // The next episode is a genuine full-screen movie with staggered new copy.
    const textOpacity=smooth(normalize(p,.78,.99));
    const leaveTwo=smooth(normalize(journey,1.12,1.48));
    chapter.style.opacity=String(textOpacity*(1-leaveTwo));
    const shouldShow=journey>.81 && journey<1.49;
    if(shouldShow!==lastVisible){
      chapter.classList.toggle("is-visible",shouldShow);
      chapter.inert=!shouldShow;
      chapter.setAttribute("aria-hidden",String(!shouldShow));
      lastVisible=shouldShow;
    }
    // Frame 03 changes only the editorial composition. The seamless movie,
    // original grid, header and footer remain in place.
    const leaveThree=smooth(normalize(journey,2.20,2.62));
    const thirdOpacity=smooth(normalize(journey,1.30,1.84))*(1-leaveThree);
    third.style.opacity=String(thirdOpacity);
    const showThird=journey>1.39 && journey<2.56;
    if(thirdVisible!==showThird){
      third.classList.toggle("is-visible",showThird);
      third.inert=!showThird;
      third.setAttribute("aria-hidden",String(!showThird));
      thirdVisible=showThird;
      if(!showThird)resetTwenty();
    }
    document.body.classList.toggle("frame-three-active",showThird);
    // A bottom-to-top dark wipe covers the moving film, then clears to
    // reveal the image carousel. The chrome remains in its fixed position.
    const enter=smooth(normalize(journey,2,2.52));
    const exit=smooth(normalize(journey,2.52,3));
    const curtainPercent=journey<=2.52?105*(1-enter):-105*exit;
    if(curtain)curtain.style.transform="translate3d(0,"+curtainPercent.toFixed(2)+"%,0)";
    const cover=smooth(normalize(journey,2.20,2.59));
    backdrop.style.opacity=String(cover);
    backdrop.classList.toggle("is-active",journey>2.05);
    const galleryOpacity=smooth(normalize(journey,2.56,2.95));
    fourth.style.opacity=String(galleryOpacity);
    const showFourth=journey>2.52;
    if(fourthVisible!==showFourth){
      fourthVisible=showFourth;
      fourth.classList.toggle("is-visible",showFourth);
      fourth.inert=!showFourth;
      fourth.setAttribute("aria-hidden",String(!showFourth));
      if(showFourth) {
        galleryTarget=2;
        galleryPosition=2;
        galleryPointer=galleryPointerTarget=0;
      }
    }
    document.body.classList.toggle("frame-four-active",showFourth);
    // Stop the full-screen film once the gallery fully covers it.
    if(journey>2.99 && !filmSuspendedForGallery && film && !film.paused){
      film.pause();filmSuspendedForGallery=true;
    }else if(journey<2.76 && filmSuspendedForGallery){
      filmSuspendedForGallery=false;
      if(!reduced.matches && !document.body.classList.contains("motion-off"))film.play().catch(()=>{});
    }
    renderGallery();
    document.body.dataset.journeyProgress=journey.toFixed(4);
    document.body.dataset.currentFrame=journey<.83?"1":journey<1.42?"2":journey<2.55?"3":"4";
    if(rail){
      rail.classList.toggle("is-visible",p>.035);
      rail.style.opacity=String(smooth(normalize(p,.035,.16)));
    }
    if(fill)fill.style.transform="scaleX("+clamp(journey/3,0,1).toFixed(4)+")";
    if(wheelHint){
      wheelHint.style.opacity=(journey>.06&&journey<.82)?"1":"0";
      wheelHint.innerHTML=p>.82?"SCROLL UP TO RETURN <span>↑</span>":"KEEP SCROLLING TO ENTER <span>↓</span>";
    }
    document.body.classList.toggle("portal-zoom",grow>.12);
    document.body.classList.toggle("chapter-two-active",p>.75);
    document.body.dataset.portalProgress=p.toFixed(4);
    document.documentElement.style.setProperty("--portal-progress",p.toFixed(4));
    if(tools)tools.style.opacity=String(1-smooth(normalize(p,.69,.95))*.75);
    lastRendered=p;
  }

  function frameStep(){
    frame=0;
    if(reduced.matches)position=target;
    else position+= (target-position)*.28;
    if(Math.abs(target-position)<.0006)position=target;
    paint();
    if(!reelDragging)galleryPosition+=(galleryTarget-galleryPosition)*(reduced.matches?1:.22);
    if(Math.abs(galleryPosition-galleryTarget)<.003)galleryPosition=galleryTarget;
    galleryPointer+=(galleryPointerTarget-galleryPointer)*(reduced.matches?1:.12);
    if(Math.abs(galleryPointer-galleryPointerTarget)<.05)galleryPointer=galleryPointerTarget;
    if(position!==target || galleryPosition!==galleryTarget || galleryPointer!==galleryPointerTarget)frame=requestAnimationFrame(frameStep);
  }
  function schedule(){
    if(!frame)frame=requestAnimationFrame(frameStep);
  }
  function setTarget(value){
    target=clamp(value,0,3);
    if(reduced.matches)position=target;
    schedule();
  }

  // Continual native wheel motion, not binary next/previous slides.
  // Roughly 700px of cumulative wheel delta expands all the way through.
  addEventListener("wheel",event=>{
    if(event.ctrlKey)return; // browser pinch-to-zoom must remain available
    if(event.target instanceof Element && event.target.closest(".navigation,.site-header a,.site-header button,.site-footer a,.chapter-link"))return;
    event.preventDefault();
    const pixels=event.deltaMode===1?event.deltaY*18:event.deltaMode===2?event.deltaY*innerHeight:event.deltaY;
    if(!Number.isFinite(pixels)||Math.abs(pixels)<.1)return;
    const delta=clamp(pixels,-160,160);
    if(target>=2.995 && position>2.90){
      // Vertical wheel becomes horizontal gallery navigation in Frame 04.
      // At the leftmost photograph, one more upward gesture returns to Frame 03.
      if(delta<0 && galleryTarget<=.005){
        setTarget(2);
      }else{
        galleryTarget=clamp(galleryTarget+delta/240,0,photos.length-1);
        schedule();
      }
    }else setTarget(target+delta/790);
  },{passive:false});

  // Touch drag scrolls through the very same continuous expansion.
  stage.addEventListener("touchstart",event=>{
    if(event.touches.length===1)touchY=event.touches[0].clientY;
  },{passive:true});
  stage.addEventListener("touchmove",event=>{
    if(touchY===null||event.touches.length!==1)return;
    if(event.target instanceof Element && event.target.closest("button,a,.gallery-viewport"))return;
    const next=event.touches[0].clientY;
    const delta=touchY-next;
    touchY=next;
    if(event.cancelable)event.preventDefault();
    setTarget(target+delta/Math.max(300,innerHeight*.72));
  },{passive:false});
  stage.addEventListener("touchend",()=>{touchY=null},{passive:true});
  stage.addEventListener("touchcancel",()=>{touchY=null},{passive:true});

  addEventListener("keydown",event=>{
    const key=event.key;
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.target instanceof Element && event.target.closest("a,button,input,textarea,select"))return;
    if((key==="ArrowLeft"||key==="ArrowRight") && position>2.92){
      event.preventDefault();
      galleryTarget=clamp(galleryTarget+(key==="ArrowRight"?1:-1),0,photos.length-1);
      schedule();
    }else if((key==="ArrowDown"||key==="ArrowUp"||key===" " ) && position>2.92){
      event.preventDefault();
      galleryTarget=clamp(galleryTarget+(key==="ArrowUp"?-1:1),0,photos.length-1);
      schedule();
    }else if(key==="ArrowDown"||key==="PageDown"||key===" "){
      event.preventDefault();setTarget(target+.24);
    }else if(key==="ArrowUp"||key==="PageUp"){
      event.preventDefault();setTarget(target-.24);
    }else if(key==="Home"){
      event.preventDefault();setTarget(0);
    }else if(key==="End"){
      event.preventDefault();setTarget(3);
    }
  });
  document.getElementById("next-chapter")?.addEventListener("click",()=>{
    if(position>2.94){
      galleryTarget=clamp(galleryTarget+1,0,photos.length-1);schedule();
    }else setTarget(Math.min(3,Math.floor(target+.12)+1));
  });
  document.getElementById("previous-chapter")?.addEventListener("click",()=>setTarget(position>2.75?2:Math.max(0,Math.ceil(target-.12)-1)));

  // The central "20" is original typography split into nine SVG pieces.
  // The mouse approaches -> parts fan outward in a controlled pattern.
  // Mouse moves away -> the same pieces return to their exact positions.
  // Clicking/tapping briefly activates the effect and then restores it.
  twentyParts.forEach((piece,index)=>{
    const x=(index%3)-1,y=Math.floor(index/3)-1;
    piece.style.setProperty("--intro-x",(x*85)+"px");
    piece.style.setProperty("--intro-y",(y*66)+"px");
    piece.style.setProperty("--intro-rotation",((x+y)*9)+"deg");
  });
  let digitPower=0,digitAutoTimer=0,digitFrame=0;
  function fanTwenty(power,dx=0,dy=0){
    digitPower=reduced.matches?0:clamp(power,0,1);
    twenty.dataset.reacting=String(digitPower>.07);
    twenty.setAttribute("aria-pressed",String(digitPower>.12));
    const rect=twenty.getBoundingClientRect();
    const unit=Math.max(10,Math.min(rect.width/12,47));
    twentyParts.forEach((piece,index)=>{
      const col=index%3-1,row=Math.floor(index/3)-1;
      // Each shard departs on its own radial trajectory, then comes back.
      const ux=col||((index&1)?-.5:.5);
      const uy=row||((index%2)?-.4:.4);
      const tx=(ux*unit*1.5-dx*unit*.34)*digitPower;
      const ty=(uy*unit*1.25-dy*unit*.33)*digitPower;
      const angle=(col*8-row*6+(index%2?3:-3))*digitPower;
      piece.style.setProperty("--offset-x",tx.toFixed(2)+"px");
      piece.style.setProperty("--offset-y",ty.toFixed(2)+"px");
      piece.style.setProperty("--angle",angle.toFixed(2)+"deg");
    });
  }
  function resetTwenty(){clearTimeout(digitAutoTimer);fanTwenty(0);}
  twenty.addEventListener("pointermove",e=>{
    if(!thirdVisible||reduced.matches||e.pointerType==="touch")return;
    clearTimeout(digitAutoTimer);
    const rect=twenty.getBoundingClientRect();
    const dx=(e.clientX-(rect.left+rect.width/2))/(rect.width/2);
    const dy=(e.clientY-(rect.top+rect.height/2))/(rect.height/2);
    const r=Math.hypot(dx*.78,dy*.8);
    fanTwenty(clamp((1.15-r)*1.34,0,1),dx,dy);
  },{passive:true});
  twenty.addEventListener("pointerleave",resetTwenty);
  twenty.addEventListener("pointercancel",resetTwenty);
  twenty.addEventListener("blur",resetTwenty);
  twenty.addEventListener("click",()=>{
    if(!thirdVisible||reduced.matches)return;
    fanTwenty(1);
    clearTimeout(digitAutoTimer);
    digitAutoTimer=setTimeout(resetTwenty,1000);
  });


  // Continuous horizontal photo reel. Each image has an independently
  // computed perspective depth. The primary portrait initially faces front.
  function renderGallery(){
    const positionIndex=galleryPosition;
    const middle=(photos.length-1)/2;
    const offset=(middle-positionIndex)*galleryStep;
    reel.style.setProperty("--reel-offset",offset.toFixed(2)+"px");
    reel.style.setProperty("--pointer-nudge",galleryPointer.toFixed(2)+"px");
    let focused=clamp(Math.round(positionIndex),0,photos.length-1);
    photos.forEach((item,index)=>{
      const delta=index-positionIndex,abs=Math.abs(delta);
      const rotate=clamp(-delta*7,-26,26);
      const depth=-Math.min(abs,3)*44;
      const scale=1-Math.min(abs,4)*.075;
      item.style.zIndex=String(50-Math.round(abs*7));
      item.style.setProperty("--card-rotate",rotate.toFixed(2)+"deg");
      item.style.setProperty("--card-z",depth.toFixed(2)+"px");
      item.style.setProperty("--card-scale",Math.max(.70,scale).toFixed(3));
      item.style.setProperty("--card-brightness",Math.max(.42,1-abs*.18).toFixed(3));
      item.style.setProperty("--card-saturation",Math.max(.6,1-abs*.11).toFixed(3));
      item.style.setProperty("--card-opacity",Math.max(.37,1-abs*.17).toFixed(3));
      item.classList.toggle("is-current",index===focused);
    });
    if(count)count.textContent=String(focused+1).padStart(2,"0");
    if(galleryPrev)galleryPrev.disabled=galleryTarget<=0;
    if(galleryNext)galleryNext.disabled=galleryTarget>=photos.length-1;
    document.body.dataset.galleryIndex=galleryPosition.toFixed(3);
  }
  function moveGallery(direction){
    galleryTarget=clamp(Math.round(galleryTarget)+direction,0,photos.length-1);
    schedule();
  }
  document.getElementById("gallery-back")?.addEventListener("click",()=>setTarget(2));
  galleryPrev?.addEventListener("click",()=>moveGallery(-1));
  galleryNext?.addEventListener("click",()=>moveGallery(1));
  if(viewport){
    viewport.addEventListener("pointerdown",event=>{
      if(event.button!==0||position<2.88)return;
      // Frame 01's unchanged stage handler captures pointerdown globally.
      // Keep this gallery gesture local, or its capture steals pointermove/up.
      event.stopPropagation();
      reelDragging=true;downX=event.clientX;downIndex=galleryTarget;
      viewport.classList.add("is-dragging");
      try{viewport.setPointerCapture(event.pointerId);}catch{}
      event.preventDefault();
    });
    viewport.addEventListener("pointermove",event=>{
      if(position<2.86)return;
      if(reelDragging){
        galleryTarget=clamp(downIndex-(event.clientX-downX)/galleryStep,0,photos.length-1);
        galleryPosition=galleryTarget;
        renderGallery();
      }else if(event.pointerType==="mouse"){
        const norm=(event.clientX-innerWidth/2)/(innerWidth/2);
        galleryPointerTarget=clamp(-norm*23,-23,23);
        schedule();
      }
    },{passive:true});
    const endDrag=()=>{
      if(!reelDragging)return;
      reelDragging=false;viewport.classList.remove("is-dragging");
      galleryTarget=clamp(Math.round(galleryTarget),0,photos.length-1);
      schedule();
    };
    viewport.addEventListener("pointerup",endDrag);
    viewport.addEventListener("pointercancel",endDrag);
    window.addEventListener("pointerup",endDrag,{passive:true});
    window.addEventListener("blur",endDrag);
    viewport.addEventListener("pointerleave",()=>{
      if(!reelDragging){galleryPointerTarget=0;schedule();}
    });
  }
  // Video/photo failure should not collapse the reel.
  // Empty placeholders retain individual dark gradient panels.
  photos.forEach(photo=>{
    const img=photo.querySelector("img");
    img?.addEventListener("error",()=>photo.classList.add("image-fallback"));
  });

  reduced.addEventListener("change",()=>{if(reduced.matches)position=target;schedule();});
  let resizeTimer=0;
  addEventListener("resize",()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{measure();schedule();},90);
  },{passive:true});
  measure();
  paint();
})();
