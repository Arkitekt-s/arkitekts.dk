/* Frames 01 -> 02 -> 03 -> 04 -> 05: final contact and 3D globe.
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
  const chapterTitleLines=[...document.querySelectorAll("#chapter-two .chapter-title > span")];
  const chapterDescription=chapter?.querySelector(".chapter-description");
  const chapterLink=chapter?.querySelector(".chapter-link");
  const third=document.querySelector("#chapter-three");
  const thirdKicker=third?.querySelector(".chapter-three-kicker");
  const thirdStatements=[...third.querySelectorAll(".side-statement span")];
  const fourth=document.getElementById("frame-four-gallery");
  const fifth=document.getElementById("frame-five-contact");
  const fifthBackdrop=document.querySelector(".frame-five-backdrop");
  const backdrop=document.querySelector(".frame-four-backdrop");
  const curtain=document.getElementById("frame-four-curtain");
  // Staggered full-height panels replace the single flat wipe.
  const curtainPanels=curtain?Array.from({length:10},(_,i)=>{
    const panel=document.createElement("span");
    panel.className="frame-four-curtain-panel";
    panel.style.setProperty("--panel-index",String(i));
    curtain.appendChild(panel);
    return panel;
  }):[];
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
  const scrollbar=document.getElementById("journey-scrollbar");
  const scrollbarThumb=document.getElementById("journey-scrollbar-thumb");
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(!stage||!panorama||arches.length!==3||!chapter||!third||!twenty||!fourth||!fifth||!fifthBackdrop||!reel||photos.length<5)return;

  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const normalize=(v,from,to)=>clamp((v-from)/(to-from),0,1);
  const toPx=n=>n.toFixed(2)+"px";

  let target=0,position=0,frame=0;
  let initial={w:0,h:0,top:0,gap:0,head:0,foot:0};
  let touchY=null;
  let lastVisible=false, thirdVisible=false, fourthVisible=false, fifthVisible=false, galleryVisited=false;
  let galleryTarget=0,galleryPosition=0,galleryPointer=0,galleryPointerTarget=0;
  let reelDragging=false,downX=0,downIndex=0,galleryStep=320;
  // A single downward gesture in Frame 04 completes the photo journey
  // before revealing Frame 05. Reversible by scrolling upward.
  let galleryAutoExit=false,galleryExitReadyAt=0,galleryNextPhotoAt=0;
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

  function updateJourneyScrollbar(){
    if(!scrollbar||!scrollbarThumb)return;
    const scrollRange=Math.max(0,scrollbar.clientHeight-scrollbarThumb.offsetHeight);
    const progress=clamp(position/4,0,1);
    scrollbarThumb.style.transform="translate3d(0,"+(scrollRange*progress).toFixed(2)+"px,0)";
    scrollbar.setAttribute("aria-valuenow",String(Math.round(progress*100)));
    scrollbar.setAttribute("aria-valuetext","Section "+Math.min(5,Math.round(position)+1)+" of 5");
  }

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
    // One uninterrupted, reversible scroll transition from 01 to 02.
    // The outgoing sentence starts drifting up before the arches finish
    // opening. Every value is derived from scroll progress, not a timer.
    const introExit=smooth(normalize(p,.22,.83));
    const firstOpacity=1-introExit;
    if(hero){
      hero.style.opacity=String(firstOpacity);
      hero.style.translate="0 "+(-22*introExit).toFixed(2)+"px";
      hero.style.filter=reduced.matches?"none":"blur("+(4.5*introExit).toFixed(2)+"px)";
    }
    if(support)support.style.opacity=String(firstOpacity);
    if(eyebrow)eyebrow.style.opacity=String(1-smooth(normalize(p,.31,.85)));
    if(note)note.style.opacity=String(firstOpacity);
    if(live)live.style.opacity=String(firstOpacity);
    const darkness=smooth(normalize(p,.47,.87));
    if(shade)shade.style.opacity=String(darkness*.93);
    syncFilms(p);

    // Crossfade the incoming line-by-line story into the outgoing sentence.
    // Text drifts upward and becomes sharp; scrolling back reverses it.
    const textOpacity=smooth(normalize(p,.55,.95));
    // Frame 02 is fully readable before leaving; then words float upward
    // and blur out, just like the opening headline. The 02→03 entrance
    // is a matched slow crossfade controlled by the same scroll progress.
    const leaveTwo=smooth(normalize(journey,1.37,1.88));
    chapter.style.opacity=String(textOpacity*(1-leaveTwo));
    chapter.style.translate="0 "+(22*(1-textOpacity)-24*leaveTwo).toFixed(2)+"px";
    chapter.style.filter=reduced.matches?"none":"blur("+(5.5*leaveTwo).toFixed(2)+"px)";
    chapterTitleLines.forEach((line,index)=>{
      const wordEnter=smooth(normalize(p,.54+index*.055,.84+index*.045));
      line.style.opacity=String(wordEnter);
      line.style.transform="translate3d(0,"+(28*(1-wordEnter)).toFixed(2)+"px,0)";
      line.style.filter=reduced.matches?"none":"blur("+(7*(1-wordEnter)).toFixed(2)+"px)";
    });
    const descriptionEnter=smooth(normalize(p,.70,.97));
    if(chapterDescription){
      chapterDescription.style.opacity=String(descriptionEnter);
      chapterDescription.style.transform="translate3d(0,"+(17*(1-descriptionEnter)).toFixed(2)+"px,0)";
    }
    const linkEnter=smooth(normalize(p,.76,1.00));
    if(chapterLink){
      chapterLink.style.opacity=String(linkEnter);
      chapterLink.style.transform="translate3d(0,"+(13*(1-linkEnter)).toFixed(2)+"px,0)";
    }
    const shouldShow=journey>.54 && journey<1.90;
    chapter.style.pointerEvents=journey>.88&&journey<1.56?"auto":"none";
    if(shouldShow!==lastVisible){
      chapter.classList.toggle("is-visible",shouldShow);
      chapter.inert=!shouldShow;
      chapter.setAttribute("aria-hidden",String(!shouldShow));
      lastVisible=shouldShow;
    }
    // Frame 03 changes only the editorial composition. The seamless movie,
    // original grid, header and footer remain in place.
    // Scene 03 text fades out before the staircase begins: video only.
    const leaveThree=smooth(normalize(journey,2.05,2.28));
    const enterThree=smooth(normalize(journey,1.41,1.89));
    const thirdOpacity=enterThree*(1-leaveThree);
    third.style.opacity=String(thirdOpacity);
    third.style.translate="0 "+(24*(1-enterThree)).toFixed(2)+"px";
    // Each word follows the same scroll gesture, rather than CSS timers.
    // The number 10 keeps its original untouched hover interaction.
    const kickerEnter=smooth(normalize(journey,1.47,1.79));
    if(thirdKicker){
      thirdKicker.style.opacity=String(.9*kickerEnter);
      thirdKicker.style.transform="translateX(-50%) translateY("+(-3+16*(1-kickerEnter)).toFixed(2)+"px)";
    }
    thirdStatements.forEach((word,index)=>{
      const wordEnter=smooth(normalize(journey,1.43+index*.075,1.75+index*.055));
      word.style.opacity=String(wordEnter);
      word.style.transform="translateY("+(30*(1-wordEnter)).toFixed(2)+"px)";
      word.style.filter=reduced.matches?"none":"blur("+(7*(1-wordEnter)).toFixed(2)+"px)";
    });
    const showThird=journey>1.40 && journey<2.60;
    if(thirdVisible!==showThird){
      third.classList.toggle("is-visible",showThird);
      third.inert=!showThird;
      third.setAttribute("aria-hidden",String(!showThird));
      thirdVisible=showThird;
      if(!showThird)scatterTen();
    }
    document.body.classList.toggle("frame-three-active",showThird);
    // One staircase mask reveals both the gallery and its background.
    // There is no separate dark curtain over the photographs.
    if(curtain)curtain.style.display="none";
    const stairStart=2.30,stairEnd=2.70;
    let revealMask="none";
    if(journey<stairStart){
      revealMask="inset(100% 0 0 0)";
    }else if(journey<stairEnd){
      const points=["0% 100%"];
      for(let i=0;i<10;i++){
        const rise=smooth(normalize(journey,stairStart+i*.015,stairEnd-.135+i*.015));
        const top=(100*(1-rise)).toFixed(3)+"%";
        points.push((i*10)+"% "+top,((i+1)*10)+"% "+top);
      }
      points.push("100% 100%");
      revealMask="polygon("+points.join(",")+")";
    }
    backdrop.style.clipPath=revealMask;
    backdrop.style.opacity=journey>=stairStart?"1":"0";
    backdrop.classList.toggle("is-active",journey>=stairStart);
    const leaveFourth=smooth(normalize(journey,3.12,3.80));
    fourth.style.opacity=String(1-leaveFourth);
    fourth.style.clipPath=revealMask;
    const reelReady=journey>=stairEnd;
    fourth.classList.toggle("gallery-reveal-complete",reelReady);
    const showFourth=journey>=stairStart && journey<3.81;
    if(fourthVisible!==showFourth){
      fourthVisible=showFourth;
      fourth.classList.toggle("is-visible",showFourth);
      fourth.inert=!showFourth;
      fourth.setAttribute("aria-hidden",String(!showFourth));
      if(showFourth && !galleryVisited){
        galleryVisited=true;
        // Every new entry starts at photo 01, never the middle portrait.
        galleryTarget=0;
        galleryPosition=0;
        galleryPointer=galleryPointerTarget=0;
      }
    }
    if(journey<2.20)galleryVisited=false;
    document.body.classList.toggle("frame-four-active",showFourth);

    // The final scene rises out of the gallery's dark ending.
    // The backdrop matches the gallery's fully darkened near-black colors.
    // Adjacent scenes now crossfade while their backing films stay continuous.
    const contactFade=smooth(normalize(journey,3.16,3.84));
    fifthBackdrop.style.opacity=String(smooth(normalize(journey,3.08,3.82)));
    fifthBackdrop.classList.toggle("is-active",journey>3.07);
    fifth.style.opacity=String(contactFade);
    const showFifth=journey>3.15;
    if(fifthVisible!==showFifth){
      fifthVisible=showFifth;
      fifth.classList.toggle("is-visible",showFifth);
      fifth.inert=!showFifth;
      fifth.setAttribute("aria-hidden",String(!showFifth));
      if(showFifth && window.soheilGlobe)window.soheilGlobe.center(true);
    }
    document.body.classList.toggle("frame-five-active",showFifth);
    // Stop the full-screen film once the gallery fully covers it.
    if(journey>2.99 && !filmSuspendedForGallery && film && !film.paused){
      film.pause();filmSuspendedForGallery=true;
    }else if(journey<2.76 && filmSuspendedForGallery){
      filmSuspendedForGallery=false;
      if(!reduced.matches && !document.body.classList.contains("motion-off"))film.play().catch(()=>{});
    }
    renderGallery();
    document.body.dataset.journeyProgress=journey.toFixed(4);
    document.body.dataset.currentFrame=journey<.83?"1":journey<1.42?"2":journey<2.55?"3":journey<3.49?"4":"5";
    if(rail){
      rail.classList.toggle("is-visible",p>.035);
      rail.style.opacity=String(smooth(normalize(p,.035,.16)));
    }
    if(fill)fill.style.transform="scaleX("+clamp(journey/4,0,1).toFixed(4)+")";
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
    updateJourneyScrollbar();
  }

  function frameStep(){
    frame=0;
    if(reduced.matches)position=target;
    else position+= (target-position)*.18;
    if(Math.abs(target-position)<.0006)position=target;
    paint();
    if(!reelDragging)galleryPosition+=(galleryTarget-galleryPosition)*(reduced.matches?1:.22);
    if(Math.abs(galleryPosition-galleryTarget)<.003)galleryPosition=galleryTarget;
    galleryPointer+=(galleryPointerTarget-galleryPointer)*(reduced.matches?1:.12);
    if(Math.abs(galleryPointer-galleryPointerTarget)<.05)galleryPointer=galleryPointerTarget;
    if(galleryAutoExit && !reelDragging){
      const now=performance.now();
      // Centre every photograph in sequence; never jump from 01 to 07.
      if(galleryTarget<photos.length-1){
        if(now>=galleryNextPhotoAt && Math.abs(galleryPosition-galleryTarget)<.035){
          galleryTarget+=1;
          galleryNextPhotoAt=now+(reduced.matches?0:310);
          document.body.dataset.galleryAutoPhoto=String(galleryTarget+1).padStart(2,"0");
        }
      }else if(galleryPosition>=photos.length-1-.025){
        // Hold the final photograph against the dark background before
        // entering Frame 05, preserving the approved crossfade.
        if(!galleryExitReadyAt)galleryExitReadyAt=now+(reduced.matches?0:750);
        else if(now>=galleryExitReadyAt){
          galleryAutoExit=false;
          galleryExitReadyAt=0;
          galleryNextPhotoAt=0;
          document.body.dataset.galleryAutoExit="complete";
          setTarget(4);
        }
      }
    }
    if(position!==target || galleryPosition!==galleryTarget ||
       galleryPointer!==galleryPointerTarget || galleryAutoExit)
      frame=requestAnimationFrame(frameStep);
  }
  function schedule(){
    if(!frame)frame=requestAnimationFrame(frameStep);
  }
  function setTarget(value){
    target=clamp(value,0,4);
    if(reduced.matches)position=target;
    schedule();
  }
  function cancelGalleryExit(){
    if(!galleryAutoExit)return;
    galleryAutoExit=false;
    galleryExitReadyAt=0;
    galleryNextPhotoAt=0;
    galleryTarget=clamp(Math.round(galleryPosition),0,photos.length-1);
    document.body.dataset.galleryAutoExit="cancelled";
    schedule();
  }
  function beginGalleryExit(){
    if(galleryAutoExit)return;
    galleryAutoExit=true;
    galleryExitReadyAt=0;
    galleryNextPhotoAt=performance.now()+(reduced.matches?0:450);
    setTarget(3); // Keep Frame 04 fully visible until the final photo arrives.
    // Auto-progress from the currently focused photo, one at a time.
    galleryPointerTarget=0;
    document.body.dataset.galleryAutoPhoto=String(Math.round(galleryPosition)+1).padStart(2,"0");
    document.body.dataset.galleryAutoExit="moving";
    schedule();
  }

  // A visible scrollbar gives a familiar cue that the scenes scroll.
  // Dragging its thumb navigates the same timeline as the mouse wheel.
  if(scrollbar&&scrollbarThumb){
    let dragging=false,grabOffset=0;
    const scrub=clientY=>{
      const rect=scrollbar.getBoundingClientRect();
      const travel=Math.max(1,rect.height-scrollbarThumb.offsetHeight);
      const progress=clamp((clientY-rect.top-grabOffset)/travel,0,1);
      cancelGalleryExit();
      setTarget(progress*4);
    };
    scrollbar.addEventListener("pointerdown",event=>{
      if(event.button!==0)return;
      const thumbRect=scrollbarThumb.getBoundingClientRect();
      grabOffset=event.target===scrollbarThumb?event.clientY-thumbRect.top:thumbRect.height/2;
      dragging=true;
      scrollbar.setPointerCapture(event.pointerId);
      scrub(event.clientY);
      event.preventDefault();
    });
    scrollbar.addEventListener("pointermove",event=>{
      if(dragging)scrub(event.clientY);
    });
    const endScrollDrag=()=>{dragging=false;};
    scrollbar.addEventListener("pointerup",endScrollDrag);
    scrollbar.addEventListener("pointercancel",endScrollDrag);
    scrollbar.addEventListener("lostpointercapture",endScrollDrag);
    scrollbar.addEventListener("keydown",event=>{
      let next=target;
      if(event.key==="ArrowDown")next+=.18;
      else if(event.key==="ArrowUp")next-=.18;
      else if(event.key==="PageDown")next+=1;
      else if(event.key==="PageUp")next-=1;
      else if(event.key==="Home")next=0;
      else if(event.key==="End")next=4;
      else return;
      event.stopPropagation();
      event.preventDefault();
      cancelGalleryExit();
      setTarget(next);
    });
  }

  // More reading time in the first three scenes (about 30% slower).
  // These remain continuous, not locked to a timer or forced pause.
  // Frames 04 and 05 retain their approved scroll pace.
  const editorialWheelDistance=1030;
  // Continual native wheel motion, not binary next/previous slides.
  addEventListener("wheel",event=>{
    if(event.ctrlKey)return; // browser pinch-to-zoom must remain available
    if(event.target instanceof Element && event.target.closest(".navigation,.site-header a,.site-header button,.site-footer a,.chapter-link"))return;
    event.preventDefault();
    const pixels=event.deltaMode===1?event.deltaY*18:event.deltaMode===2?event.deltaY*innerHeight:event.deltaY;
    if(!Number.isFinite(pixels)||Math.abs(pixels)<.1)return;
    const delta=clamp(pixels,-160,160);
    if(galleryAutoExit){
      // A reverse gesture cancels the automatic glide safely.
      if(delta<0)cancelGalleryExit();
      return;
    }
    if(target>=2.94 && target<3.20 && position>=2.70 && position<3.20){
      if(delta>0)beginGalleryExit();
      else if(galleryTarget<=.005)setTarget(2);
      else{
        galleryTarget=clamp(galleryTarget+delta/240,0,photos.length-1);
        schedule();
      }
    }else if(target>3.003 || position>3.20){
      // Scroll back from Frame 05 to the gallery's last photograph.
      setTarget(Math.max(3,target+delta/790));
    }else{
      // Matching scroll length for both 01→02 and 02→03 transitions.
      const distance=target<2.28?editorialWheelDistance:790;
      setTarget(target+delta/distance);
    }
  },{passive:false});

  // Touch drag scrolls through the very same continuous expansion.
  stage.addEventListener("touchstart",event=>{
    if(event.touches.length===1)touchY=event.touches[0].clientY;
  },{passive:true});
  stage.addEventListener("touchmove",event=>{
    if(touchY===null||event.touches.length!==1)return;
    if(event.target instanceof Element && event.target.closest("button,a,.gallery-viewport,#globe-shell"))return;
    const next=event.touches[0].clientY;
    const delta=touchY-next;
    touchY=next;
    if(event.cancelable)event.preventDefault();
    if(galleryAutoExit){
      if(delta<0)cancelGalleryExit();
    }else if(delta>0 && target>=2.94 && target<3.20 && position>=2.70 && position<3.20){
      beginGalleryExit();
    }else{
      const distance=target<2.28?Math.max(390,innerHeight*.95):Math.max(300,innerHeight*.72);
      setTarget(target+delta/distance);
    }
  },{passive:false});
  stage.addEventListener("touchend",()=>{touchY=null},{passive:true});
  stage.addEventListener("touchcancel",()=>{touchY=null},{passive:true});

  addEventListener("keydown",event=>{
    const key=event.key;
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.target instanceof Element && event.target.closest("a,button,input,textarea,select"))return;
    if((key==="ArrowLeft"||key==="ArrowRight") && position>2.92 && position<3.05){
      event.preventDefault();
      cancelGalleryExit();
      galleryTarget=clamp(galleryTarget+(key==="ArrowRight"?1:-1),0,photos.length-1);
      schedule();
    }else if((key==="ArrowDown"||key==="ArrowUp"||key===" " ) && position>2.92 && position<3.05){
      event.preventDefault();
      if(key==="ArrowUp"){
        cancelGalleryExit();
        galleryTarget=clamp(galleryTarget-1,0,photos.length-1);
        schedule();
      }else beginGalleryExit();
    }else if(key==="ArrowDown"||key==="PageDown"||key===" "){
      event.preventDefault();setTarget(target+.24);
    }else if(key==="ArrowUp"||key==="PageUp"){
      event.preventDefault();setTarget(target-.24);
    }else if(key==="Home"){
      event.preventDefault();setTarget(0);
    }else if(key==="End"){
      event.preventDefault();setTarget(4);
    }
  });
  document.getElementById("next-chapter")?.addEventListener("click",()=>{
    if(position>2.90 && position<3.20)beginGalleryExit();
    else setTarget(Math.min(4,Math.floor(target+.12)+1));
  });
  document.getElementById("previous-chapter")?.addEventListener("click",()=>setTarget(position>3.03?3:position>2.75?2:Math.max(0,Math.ceil(target-.12)-1)));

  // The scattered nine-piece number joins into a legible 10 on hover.
  // Leaving the hotspot returns every piece to its separate resting point.
  let digitAutoTimer=0;
  function assembleTen(strength){
    const power=reduced.matches?1:clamp(strength,0,1);
    twenty.dataset.reacting=String(power>.5);
    twenty.setAttribute("aria-pressed",String(power>.5));
    const rect=twenty.getBoundingClientRect();
    const unit=Math.max(15,Math.min(43,rect.width*.086));
    twentyParts.forEach((piece,index)=>{
      const col=index%3-1,row=Math.floor(index/3)-1;
      const dx=(col*1.18+(index%2?.27:-.27))*unit;
      const dy=(row*.93+(index%3===1?-.22:.22))*unit;
      const angle=col*9-row*7+(index%2?6:-6);
      const apart=1-power;
      piece.style.setProperty("--offset-x",(dx*apart).toFixed(2)+"px");
      piece.style.setProperty("--offset-y",(dy*apart).toFixed(2)+"px");
      piece.style.setProperty("--angle",(angle*apart).toFixed(2)+"deg");
    });
  }
  function scatterTen(){clearTimeout(digitAutoTimer);assembleTen(0);}
  assembleTen(0);
  twenty.addEventListener("pointerenter",event=>{
    if(!thirdVisible||event.pointerType==="touch")return;
    clearTimeout(digitAutoTimer);assembleTen(1);
  });
  twenty.addEventListener("pointermove",event=>{
    if(!thirdVisible||event.pointerType==="touch")return;
    clearTimeout(digitAutoTimer);assembleTen(1);
  },{passive:true});
  twenty.addEventListener("pointerleave",scatterTen);
  twenty.addEventListener("pointercancel",scatterTen);
  twenty.addEventListener("blur",scatterTen);
  twenty.addEventListener("click",()=>{
    if(!thirdVisible)return;
    clearTimeout(digitAutoTimer);assembleTen(1);
    digitAutoTimer=setTimeout(scatterTen,1300);
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
    // As the reel approaches its last two photographs, fade only the
    // background from the original atmospheric purple to near-black.
    // Reversing the wheel lightens it along the same path.
    const endDarkness=smooth(normalize(positionIndex,photos.length-3,photos.length-1));
    backdrop.style.setProperty("--gallery-end-darkness",endDarkness.toFixed(4));
    document.body.dataset.galleryDarkness=endDarkness.toFixed(4);
    if(count)count.textContent=String(focused+1).padStart(2,"0");
    if(galleryPrev)galleryPrev.disabled=galleryTarget<=0;
    if(galleryNext)galleryNext.disabled=galleryTarget>=photos.length-1;
    document.body.dataset.galleryIndex=galleryPosition.toFixed(3);
  }
  function moveGallery(direction){
    cancelGalleryExit();
    galleryTarget=clamp(Math.round(galleryTarget)+direction,0,photos.length-1);
    schedule();
  }
  galleryPrev?.addEventListener("click",()=>moveGallery(-1));
  galleryNext?.addEventListener("click",()=>moveGallery(1));
  if(viewport){
    viewport.addEventListener("pointerdown",event=>{
      if(event.button!==0||position<2.88)return;
      cancelGalleryExit();
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
