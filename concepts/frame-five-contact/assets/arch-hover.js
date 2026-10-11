/* SOHEIL / ARCH 01 — Elastic, cursor-disturbed arch silhouettes.
 * Three windows are visibly smaller at rest. Only the edge NEAR the cursor
 * is pulled inward or outward; the rigid arch box never translates/rotates.
 * Per-vertex spring physics returns the exact original shape on departure.
 * Scroll-controlled opening is preserved, and reduced-motion is respected.
 */
(() => {
  "use strict";
  const arches=[...document.querySelectorAll("#panorama .arch")];
  if(arches.length!==3 || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const svgNS="http://www.w3.org/2000/svg";
  const maskSVG=document.createElementNS(svgNS,"svg");
  maskSVG.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  maskSVG.setAttribute("aria-hidden","true");
  const defs=document.createElementNS(svgNS,"defs");
  maskSVG.append(defs);
  document.body.append(maskSVG);

  // Curved mask keeps a small spare gutter around each silhouette, so the
  // rubber outline has genuine room to bulge OUT as well as bend IN.
  const items=arches.map((element,i)=>{
    const clip=document.createElementNS(svgNS,"clipPath");
    clip.id="elastic-arch-"+i;
    clip.setAttribute("clipPathUnits","objectBoundingBox");
    const path=document.createElementNS(svgNS,"path");
    clip.append(path);
    defs.append(clip);
    const border=document.createElementNS(svgNS,"svg");
    border.classList.add("elastic-arch-outline");
    border.setAttribute("viewBox","0 0 1 1");
    border.setAttribute("preserveAspectRatio","none");
    border.setAttribute("aria-hidden","true");
    border.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:visible";
    const stroke=document.createElementNS(svgNS,"path");
    stroke.setAttribute("fill","none");
    stroke.setAttribute("stroke","rgba(250,226,255,.62)");
    stroke.setAttribute("stroke-width","1.15");
    stroke.setAttribute("vector-effect","non-scaling-stroke");
    border.append(stroke);
    element.append(border);
    return {element,path,stroke,id:clip.id,rect:null,vertices:[],
      applied:false, progress:0,active:false};
  });
  const CURVE_STEPS=48, SIDE_STEPS=18;
  let mouseX=-10000,mouseY=-10000,tracking=false;
  let frame=0,lastFrame=0,lastMeasure=-Infinity,needsMeasure=true;
  let lastScrollProgress=-1;

  function sceneProgress(){
    return clamp(Number(document.body.dataset.portalProgress||0),0,1);
  }
  function available(){
    return !reduced.matches && !document.body.classList.contains("motion-off") &&
      !document.hidden && Number(document.body.dataset.currentFrame||1)===1;
  }
  function easing(t){t=clamp(t,0,1);return t*t*(3-2*t);}

  function geometry(a,progress){
    const rect=a.rect;
    if(!rect||rect.width<8||rect.height<8)return [];
    const w=rect.width,h=rect.height;
    const initialGutter=Math.min(14,Math.max(5,w*.068));
    const topGutter=Math.min(13,Math.max(5,h*.025));
    // Match the original scroll transition: the opening expands from
    // three rounded arch windows to one seamless rectangular full-screen film.
    const growth=easing(clamp((progress-.015)/(.88-.015),0,1));
    const gap=1-growth;
    const inset=initialGutter*gap,top=topGutter*gap;
    const left=inset,right=w-inset;
    const round=matchMedia("(max-width:470px)").matches?.23:.28;
    const radius=h*round*gap;
    const result=[];
    function vertex(x,y,nx,ny){
      result.push({x,y,nx,ny,displacement:0,velocity:0});
    }
    for(let i=0;i<=CURVE_STEPS;i++){
      const t=i/CURVE_STEPS;
      const z=2*t-1;
      const radiusY=radius*(1-Math.sqrt(Math.max(0,1-z*z)));
      const x=left+(right-left)*t,y=top+radiusY;
      const slope=z/Math.sqrt(Math.max(.001,1-z*z));
      // (slope,-1) is the OUTWARD unit normal for the upper ellipse.
      const sx=slope*radius*2/Math.max(1,right-left);
      const inv=1/Math.hypot(sx,1);
      vertex(x,y,sx*inv,-inv);
    }
    for(let i=1;i<=SIDE_STEPS;i++){
      const f=i/SIDE_STEPS;
      vertex(right,top+radius+(h-top-radius)*f,1,0);
    }
    // Lower edge is not distorted. It stays fixed when the sides flex.
    vertex(left,h,-1,0);
    for(let i=SIDE_STEPS-1;i>=0;i--){
      const f=i/SIDE_STEPS;
      vertex(left,top+radius+(h-top-radius)*f,-1,0);
    }
    return result;
  }
  function measure(now,force=false){
    if(!force && !needsMeasure && now-lastMeasure<100)return;
    lastMeasure=now;needsMeasure=false;
    const p=sceneProgress();
    for(const a of items){
      const r=a.element.getBoundingClientRect();
      if(!r.width||!r.height)continue;
      const changed=!a.rect || Math.abs(r.width-a.rect.width)>1 ||
        Math.abs(r.height-a.rect.height)>1 || Math.abs(p-a.progress)>.008;
      a.rect=r;
      if(changed || !a.vertices.length){
        const next=geometry(a,p);
        // Keep the spring state across scrolling/resizes.
        if(next.length===a.vertices.length){
          next.forEach((v,i)=>{
            v.displacement=a.vertices[i].displacement;
            v.velocity=a.vertices[i].velocity;
          });
        }
        a.vertices=next;a.progress=p;
      }
    }
  }
  function setMask(a,apply){
    if(a.applied===apply)return;
    a.applied=apply;
    if(apply){
      a.element.style.clipPath="url(#"+a.id+")";
      a.element.style.borderRadius="0";
      a.stroke.parentElement.style.display="";
    }else{
      a.element.style.removeProperty("clip-path");
      // The scroll controller owns border-radius outside the intro.
      a.element.style.removeProperty("border-radius");
      a.stroke.parentElement.style.display="none";
    }
  }
  function drawMask(a){
    const r=a.rect;
    if(!r || !a.vertices.length)return;
    const w=Math.max(1,r.width),h=Math.max(1,r.height);
    const commands=a.vertices.map((v,i)=>{
      const x=clamp((v.x+v.nx*v.displacement)/w,0,1);
      const y=clamp((v.y+v.ny*v.displacement)/h,0,1);
      return (i?"L":"M")+x.toFixed(5)+" "+y.toFixed(5);
    });
    // Complete silhouette; bottom is a straight unchanging line.
    commands.push("Z");
    const d=commands.join(" ");
    a.path.setAttribute("d",d);
    a.stroke.setAttribute("d",d);
    a.element.style.setProperty("--arch-glow","7px");
  }

  function animate(now){
    frame=0;
    if(!available()){
      items.forEach(a=>setMask(a,false));
      lastFrame=0;return;
    }
    const dt=lastFrame?clamp((now-lastFrame)/16.67,.55,1.8):1;
    lastFrame=now;
    measure(now);
    const p=sceneProgress();
    // Stop deforming before arches merge into one film.
    const strength=1-easing(clamp((p-.075)/.24,0,1));
    let alive=false;
    for(const a of items){
      if(!a.rect||!a.vertices.length)continue;
      // Only disable the clip when the rounded arch has fully opened.
      if(p>=.92){
        setMask(a,false);
        continue;
      }
      setMask(a,true);
      for(const v of a.vertices){
        const dx=mouseX-(a.rect.left+v.x);
        const dy=mouseY-(a.rect.top+v.y);
        const dist=Math.hypot(dx,dy);
        const reach=133;
        const influence=Math.exp(-Math.pow(dist/reach,2));
        // Cursor either pulls an outer point outward or presses an inner
        // point inward. Neither direction is clamped at the old silhouette.
        const signed=dx*v.nx+dy*v.ny;
        const amplitude=clamp(signed*.93,-43,43);
        const target=tracking ? amplitude*influence*strength : 0;
        // Underdamped spring: bends smoothly, overshoots slightly,
        // then restores the identical arch contour after the cursor leaves.
        v.velocity=(v.velocity+(target-v.displacement)*.14*dt)*Math.pow(.74,dt);
        v.displacement+=v.velocity*dt;
        if(Math.abs(target-v.displacement)>.07||Math.abs(v.velocity)>.055)
          alive=true;
        else{v.displacement=target;v.velocity=0;}
      }
      drawMask(a);
    }
    if(alive)requestFrame();
    else lastFrame=0;
  }
  function requestFrame(){if(!frame)frame=requestAnimationFrame(animate);}
  function move(e){
    if(e.pointerType!=="mouse"&&e.pointerType!=="pen")return;
    tracking=!(e.target instanceof Element && e.target.closest(
      ".site-header,.site-footer,.portal-navigation,#twenty-hotspot,.gallery-viewport,#globe-shell,#journey-scrollbar"));
    mouseX=e.clientX;mouseY=e.clientY;
    requestFrame();
  }

  // Install the REST mask before any movement: no popping on first hover.
  // The shape is restored by spring physics rather than a mask toggle.
  if(available()){
    measure(performance.now(),true);
    for(const a of items){setMask(a,true);drawMask(a);}
  }
  addEventListener("pointermove",move,{passive:true});
  document.addEventListener("mouseout",e=>{
    if(!e.relatedTarget){tracking=false;requestFrame();}
  },{passive:true});
  addEventListener("blur",()=>{tracking=false;requestFrame();});
  addEventListener("resize",()=>{
    tracking=false;needsMeasure=true;lastMeasure=-Infinity;
    requestFrame();
  },{passive:true});
  reduced.addEventListener("change",()=>{
    tracking=false;needsMeasure=true;requestFrame();
  });
  document.getElementById("motion-button")?.addEventListener("click",()=>{
    tracking=false;requestFrame();
  });
  new MutationObserver(()=>{
    const p=sceneProgress();
    if(!available()){tracking=false;requestFrame();return;}
    if(Math.abs(p-lastScrollProgress)>.006){
      lastScrollProgress=p;needsMeasure=true;requestFrame();
    }
  }).observe(document.body,{attributes:true,
    attributeFilter:["data-current-frame","data-portal-progress","class"]});
})();
