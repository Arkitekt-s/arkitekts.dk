/* Pointer-reactive liquid ARCH MASKS.
 * Keeps the existing layout, videos, text and cinematic scroll untouched.
 * Locally bends the edge closest to the cursor and springs back on exit.
 * Works only in the opening frame, with hover and normal motion enabled.
 */
(() => {
  "use strict";
  const arches=[...document.querySelectorAll("#panorama .arch")];
  if(arches.length!==3 || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,low,high)=>Math.min(high,Math.max(low,v));
  const SVG_NS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(SVG_NS,"svg");
  svg.setAttribute("aria-hidden","true");
  svg.setAttribute("width","0");
  svg.setAttribute("height","0");
  svg.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  const defs=document.createElementNS(SVG_NS,"defs");
  svg.append(defs);
  document.body.append(svg);

  const items=arches.map((element,index)=>{
    const clip=document.createElementNS(SVG_NS,"clipPath");
    clip.id="fluid-arch-mask-"+index;
    clip.setAttribute("clipPathUnits","objectBoundingBox");
    const path=document.createElementNS(SVG_NS,"path");
    clip.append(path);
    defs.append(clip);
    return {element,path,id:clip.id,rect:null,ry:.28,edge:.0,target:0,
      mx:-999,my:-999,shiftX:0,shiftY:0,enabled:false};
  });
  let cursorX=-2000,cursorY=-2000,tracking=false,raf=0,last=0,lastMeasure=0;
  function enabled(){
    const scene=Number(document.body.dataset.currentFrame||1);
    const progress=Number(document.body.dataset.portalProgress||0);
    return scene===1 && progress<.085 && !document.body.classList.contains("motion-off") &&
      !reduced.matches && !document.hidden;
  }
  function measure(now){
    if(now-lastMeasure<115)return;
    lastMeasure=now;
    for(const a of items){
      a.rect=a.element.getBoundingClientRect();
      a.ry=Math.min(.38,Math.max(.18,
        (parseFloat(getComputedStyle(a.element).borderTopLeftRadius.split(" ").pop()) || a.rect.height*.28)/
        Math.max(1,a.rect.height)));
    }
  }
  function reset(item){
    if(!item.enabled)return;
    item.enabled=false;
    item.element.style.removeProperty("clip-path");
    item.element.style.removeProperty("border-radius");
    item.element.style.removeProperty("--arch-glow");
    item.element.querySelector(".scenery")?.style.removeProperty("--photo-x");
    item.element.querySelector(".scenery")?.style.removeProperty("--photo-y");
  }
  function neutral(){
    for(const a of items){a.target=0;a.edge=0;reset(a);}
    last=0;
  }
  function updateTargets(now){
    if(!enabled()||!tracking){
      for(const a of items)a.target=0;
      request();
      return;
    }
    measure(now);
    for(const a of items){
      const r=a.rect;
      if(!r||r.width<8||r.height<8){a.target=0;continue;}
      const x=clamp((cursorX-r.left)/r.width,0,1);
      const topY=r.top+r.height*a.ry*(1-Math.sqrt(Math.max(0,1-Math.pow(2*x-1,2))));
      const nearTop=Math.hypot(Math.max(0,r.left-cursorX,cursorX-r.right),cursorY-topY);
      const sideY=clamp(cursorY,r.top+r.height*a.ry,r.bottom);
      const nearSide=Math.min(Math.hypot(cursorX-r.left,cursorY-sideY),
                              Math.hypot(cursorX-r.right,cursorY-sideY));
      const d=Math.min(nearTop,nearSide);
      a.target=clamp(1-d/112,0,1);
      a.target=a.target*a.target*(3-2*a.target);
      a.mx=cursorX;
      a.my=cursorY;
    }
    request();
  }
  function outline(a){
    const r=a.rect;
    if(!r)return;
    const w=Math.max(1,r.width),h=Math.max(1,r.height);
    const intensity=a.edge;
    const parts=[];
    // The original semi-elliptical arch, sampled sufficiently finely to
    // let the contour yield LOCALLY instead of rotating the entire window.
    for(let i=0;i<=36;i++){
      const t=i/36;
      const yy=a.ry*(1-Math.sqrt(Math.max(0,1-Math.pow(2*t-1,2))));
      const px=r.left+t*w,py=r.top+yy*h;
      const dist=Math.hypot((px-a.mx)*.83,py-a.my);
      const fall=Math.exp(-Math.pow(dist/79,2))*intensity;
      const dx=clamp((a.mx-px)*.12,-8,8)*fall/w;
      const dy=clamp((a.my-py)*.22,-13,13)*fall/h;
      const x=clamp(t+dx,0,1),y=clamp(yy+dy,0,1);
      parts.push((i?"L":"M")+x.toFixed(5)+" "+y.toFixed(5));
    }
    // Side surfaces ripple when brushed and then settle elastically.
    for(let i=1;i<=12;i++){
      const t=i/12,y=a.ry+(1-a.ry)*t;
      const px=r.right,py=r.top+y*h;
      const fall=Math.exp(-Math.pow(Math.hypot(px-a.mx,(py-a.my)*.84)/72,2))*intensity;
      const bend=clamp((a.mx-px)*.17,-10,10)*fall/w;
      parts.push("L"+clamp(1+bend,0,1).toFixed(5)+" "+y.toFixed(5));
    }
    parts.push("L0 1");
    for(let i=11;i>=0;i--){
      const t=i/12,y=a.ry+(1-a.ry)*t;
      const px=r.left,py=r.top+y*h;
      const fall=Math.exp(-Math.pow(Math.hypot(px-a.mx,(py-a.my)*.84)/72,2))*intensity;
      const bend=clamp((a.mx-px)*.17,-10,10)*fall/w;
      parts.push("L"+clamp(bend,0,1).toFixed(5)+" "+y.toFixed(5));
    }
    parts.push("Z");
    a.path.setAttribute("d",parts.join(" "));
  }
  function animate(now){
    raf=0;
    if(!enabled()){neutral();return;}
    const dt=last?clamp(now-last,1,40):16.7;
    last=now;
    const spring=1-Math.exp(-dt/105);
    let alive=false;
    for(const a of items){
      a.edge+=(a.target-a.edge)*spring;
      if(a.edge>.003 || a.target>.003){
        if(!a.enabled){
          a.enabled=true;
          a.element.style.clipPath="url(#"+a.id+")";
          a.element.style.borderRadius="0";
        }
        outline(a);
        a.element.style.setProperty("--arch-glow",(a.edge*12).toFixed(2)+"px");
        const scenery=a.element.querySelector(".scenery");
        if(scenery){
          scenery.style.setProperty("--photo-x",((a.mx-(a.rect?.left||a.mx)-(a.rect?.width||0)/2)*.011*a.edge).toFixed(2)+"px");
          scenery.style.setProperty("--photo-y",((a.my-(a.rect?.top||a.my)-(a.rect?.height||0)/2)*.005*a.edge).toFixed(2)+"px");
        }
      }else reset(a);
      if(Math.abs(a.edge-a.target)>.002)alive=true;
    }
    if(alive)request();
    else last=0;
  }
  function request(){if(!raf)raf=requestAnimationFrame(animate);}
  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    tracking=true;
    cursorX=event.clientX;cursorY=event.clientY;
    if(event.target instanceof Element && event.target.closest(
        ".site-header,.site-footer,.portal-navigation,#twenty-hotspot,.gallery-viewport,#globe-shell")){
      tracking=false;
    }
    updateTargets(performance.now());
  },{passive:true});
  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget){tracking=false;updateTargets(performance.now());}
  },{passive:true});
  addEventListener("blur",()=>{tracking=false;updateTargets(performance.now());});
  addEventListener("resize",()=>{lastMeasure=0;tracking=false;neutral();},{passive:true});
  reduced.addEventListener("change",()=>{tracking=false;neutral();});
  document.getElementById("motion-button")?.addEventListener("click",()=>{
    tracking=false;neutral();
  });
  new MutationObserver(()=>{
    if(!enabled()){tracking=false;neutral();}
  }).observe(document.body,{attributes:true,attributeFilter:["data-current-frame","data-portal-progress","class"]});
})();
