/* Cinematic homepage arches respond gently to mouse proximity.
 * Only arch masks move; the mountain footage, words and scroll timeline don't.
 * No mouse-button or hold interaction.  Avoid seams once arches are full-screen.
 */
(() => {
  "use strict";
  const arches=[...document.querySelectorAll("#panorama .arch")];
  if(arches.length!==3 || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const items=arches.map(element=>({
    element,rect:null,x:0,y:0,angle:0,glow:0,tx:0,ty:0,tAngle:0,tGlow:0
  }));
  let mouseX=-2000,mouseY=-2000;
  let lastMeasure=-Infinity,frameId=0,lastTime=0,isTracking=false;

  const isActive=()=>{
    const scene=Number(document.body.dataset.currentFrame||1);
    return scene>=1&&scene<=3&&!reduced.matches;
  };
  function setValues(item){
    item.element.style.setProperty("--arch-x",item.x.toFixed(2)+"px");
    item.element.style.setProperty("--arch-y",item.y.toFixed(2)+"px");
    item.element.style.setProperty("--arch-turn",item.angle.toFixed(3)+"deg");
    item.element.style.setProperty("--arch-glow",(item.glow*12).toFixed(2)+"px");
  }
  function fadeTargets(){
    let needsUpdate=false;
    for(const item of items){
      if(item.tx||item.ty||item.tAngle||item.tGlow||
         Math.abs(item.x)>.03||Math.abs(item.y)>.03||
         Math.abs(item.angle)>.009||Math.abs(item.glow)>.009)
        needsUpdate=true;
      item.tx=item.ty=item.tAngle=item.tGlow=0;
    }
    if(needsUpdate)schedule();
  }
  function measure(now){
    // Layout reads are capped, rather than forced on every animation frame.
    if(now-lastMeasure<145)return;
    lastMeasure=now;
    for(const item of items)item.rect=item.element.getBoundingClientRect();
  }
  function calculate(now,refreshRects=true){
    if(!isActive()||!isTracking){fadeTargets();return;}
    if(refreshRects)measure(now);
    const progress=clamp(Number(document.body.dataset.portalProgress||0),0,1);
    // Near the intro the three arches can flex. During the scroll-to-film
    // transition they settle down, preventing visible gaps in the video.
    const flex=1-clamp((progress-.28)/.56,0,1);
    for(const item of items){
      const rect=item.rect;
      if(!rect || rect.width<=0 || flex<=0){
        item.tx=item.ty=item.tAngle=item.tGlow=0;
        continue;
      }
      const outsideX=Math.max(rect.left-mouseX,0,mouseX-rect.right);
      const outsideY=Math.max(rect.top-mouseY,0,mouseY-rect.bottom);
      const distance=Math.hypot(outsideX,outsideY);
      const radius=135;
      let proximity=clamp(1-distance/radius,0,1);
      // Smooth approach and departure: no snapping at the radius boundary.
      proximity=proximity*proximity*(3-2*proximity);
      const centerX=rect.left+rect.width/2;
      const centerY=rect.top+rect.height/2;
      const horizontal=clamp((mouseX-centerX)/Math.max(100,rect.width*.5),-1,1);
      const vertical=clamp((mouseY-centerY)/Math.max(100,rect.height*.5),-1,1);
      // The arch edge yields to the cursor, then returns by spring damping.
      item.tx=horizontal*8*proximity*flex;
      item.ty=vertical*5*proximity*flex;
      item.tAngle=horizontal*.95*proximity*flex;
      item.tGlow=proximity*flex;
    }
    schedule();
  }
  function animate(now){
    frameId=0;
    const dt=lastTime?clamp(now-lastTime,1,50):16.7;
    lastTime=now;
    const smooth=1-Math.exp(-dt/115);
    let moving=false;
    for(const item of items){
      item.x+=(item.tx-item.x)*smooth;
      item.y+=(item.ty-item.y)*smooth;
      item.angle+=(item.tAngle-item.angle)*smooth;
      item.glow+=(item.tGlow-item.glow)*smooth;
      setValues(item);
      if(Math.abs(item.tx-item.x)>.025||Math.abs(item.ty-item.y)>.025||
         Math.abs(item.tAngle-item.angle)>.008||Math.abs(item.tGlow-item.glow)>.009)
        moving=true;
    }
    if(moving)frameId=requestAnimationFrame(animate);
    else lastTime=0;
  }
  function schedule(){if(!frameId)frameId=requestAnimationFrame(animate);}
  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    mouseX=event.clientX;mouseY=event.clientY;
    isTracking=true;
    // No effect when the pointer is over navigation or interactive controls.
    const control=event.target instanceof Element &&
      event.target.closest(".site-header,.site-footer,.portal-navigation,#twenty-hotspot,.gallery-viewport,#globe-shell");
    if(control){
      fadeTargets();
      return;
    }
    calculate(performance.now());
  },{passive:true});
  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget){isTracking=false;fadeTargets();}
  },{passive:true});
  addEventListener("blur",()=>{isTracking=false;fadeTargets();});
  addEventListener("resize",()=>{lastMeasure=-Infinity;fadeTargets();},{passive:true});
  reduced.addEventListener("change",()=>{
    if(reduced.matches)fadeTargets();
  });
  // On scroll, release the arches before the three windows merge into
  // the full-width film. This does not cause repeated layout measurement.
  let lastProgress=-1;
  new MutationObserver(()=>{
    if(!isActive()){isTracking=false;fadeTargets();return;}
    const progress=Number(document.body.dataset.portalProgress||0);
    if(Math.abs(progress-lastProgress)<.014)return;
    lastProgress=progress;
    if(progress>=.84){fadeTargets();return;}
    if(isTracking)calculate(performance.now(),false);
  }).observe(document.body,{attributes:true,
    attributeFilter:["data-current-frame","data-portal-progress"]});
})();
