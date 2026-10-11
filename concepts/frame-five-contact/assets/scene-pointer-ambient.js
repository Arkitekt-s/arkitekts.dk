/* Homepage scenes 01–03: flowing painter's brush and the S. logo square.
 * Leave scenes 04–05 and every other website page with the default cursor.
 * The landscape, content and camera do not respond to mouse buttons or hold.
 */
(() => {
  "use strict";
  const canvas=document.getElementById("pointer-pattern");
  if(!canvas || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const context=canvas.getContext("2d",{alpha:true});
  if(!context)return;
  const prefersReduced=matchMedia("(prefers-reduced-motion: reduce)");
  const dot=document.createElement("span");
  dot.className="paint-cursor";
  dot.setAttribute("aria-hidden","true");
  document.body.append(dot);

  const colors=[
    [170,78,249],   // violet, left side
    [249,76,184],   // magenta, middle
    [67,205,245]    // cyan, right side
  ];
  const fadeTime=2200;
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  let width=0,height=0,dpr=1;
  let marks=[],lastMove=-Infinity,lastPoint=null,frameId=0;
  let pointerInside=false,enabled=false;
  let pointerX=0,pointerY=0;

  const sceneEnabled=()=>{
    const id=document.body.dataset.currentFrame;
    return (!id || id==="1" || id==="2" || id==="3")
       && !prefersReduced.matches;
  };
  const colorAt=x=>{
    const scaled=clamp(x/Math.max(width,1),0,1)*2;
    const i=Math.min(1,Math.floor(scaled));
    const f=scaled-i;
    return colors[i].map((v,k)=>Math.round(v+(colors[i+1][k]-v)*f));
  };
  const color=(rgb,alpha)=>"rgba("+rgb.join(",")+","+clamp(alpha,0,1).toFixed(3)+")";

  function resize(){
    width=innerWidth;
    height=innerHeight;
    dpr=Math.min(devicePixelRatio||1,1.25);
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    context.clearRect(0,0,width,height);
  }
  function erase(){
    if(frameId)cancelAnimationFrame(frameId);
    frameId=0;
    marks=[];
    lastPoint=null;
    lastMove=-Infinity;
    canvas.dataset.ambientActive="false";
    context.clearRect(0,0,width,height);
  }
  function syncScene(){
    const shouldEnable=sceneEnabled();
    if(enabled!==shouldEnable){
      enabled=shouldEnable;
      document.body.classList.toggle("paint-cursor-active",enabled);
      if(!enabled)erase();
    }
    dot.classList.toggle("is-visible",enabled && pointerInside);
    if(enabled && marks.length)request();
  }

  // Draw continuous wet-paint ribbons. Every segment keeps its own color
  // and timestamp, so the color remains on the path and fades in place.
  // Layered rounded strokes create a soft edge and a richer paint center.
  function stroke(a,b,rgb,life){
    context.lineCap="round";
    context.lineJoin="round";
    const v=Math.pow(life,1.45);
    context.beginPath();
    context.moveTo(a.x,a.y);
    context.lineTo(b.x,b.y);
    context.lineWidth=90;
    context.strokeStyle=color(rgb,.060*v);
    context.stroke();

    context.beginPath();
    context.moveTo(a.x,a.y);
    context.lineTo(b.x,b.y);
    context.lineWidth=47;
    context.strokeStyle=color(rgb,.20*v);
    context.stroke();

    context.beginPath();
    context.moveTo(a.x,a.y);
    context.lineTo(b.x,b.y);
    context.lineWidth=26;
    context.strokeStyle=color(rgb,.35*v);
    context.stroke();

    // Small pigment flecks follow the actual mouse path.
    // They are decorative, but deterministic rather than jittering.
    if(b.index%5===0){
      const side=b.index%2?1:-1;
      const dx=b.x-a.x,dy=b.y-a.y;
      const length=Math.max(1,Math.hypot(dx,dy));
      const fx=b.x-side*dy/length*22;
      const fy=b.y+side*dx/length*22;
      context.beginPath();
      context.arc(fx,fy,2.8,0,Math.PI*2);
      context.fillStyle=color(rgb,.34*v);
      context.fill();
    }
  }

  function draw(now){
    frameId=0;
    if(!sceneEnabled() || document.hidden){erase();return;}
    marks=marks.filter(m=>now-m.time<fadeTime);
    context.clearRect(0,0,width,height);
    if(!marks.length){
      canvas.dataset.ambientActive="false";
      return;
    }
    for(let i=0;i<marks.length;i++){
      const mark=marks[i];
      const previous=marks[i-1]||mark;
      const life=clamp(1-(now-mark.time)/fadeTime,0,1);
      stroke(previous,mark,mark.rgb,life);
    }
    canvas.dataset.ambientActive="true";
    request();
  }
  function request(){
    if(!frameId)frameId=requestAnimationFrame(draw);
  }
  let markIndex=0;
  function addMark(x,y,now){
    marks.push({x,y,time:now,rgb:colorAt(x),index:markIndex++});
    if(marks.length>105)marks.splice(0,marks.length-105);
  }
  function paintMovement(x,y,now){
    // Interpolate between pointer events: fast gestures paint connected lines.
    // Never draw a long diagonal when the cursor jumps back into the page.
    if(!lastPoint || now-lastMove>280 ||
       Math.hypot(x-lastPoint.x,y-lastPoint.y)>Math.max(220,width*.40)){
      marks=[];
      addMark(x,y,now);
    }else{
      const dx=x-lastPoint.x,dy=y-lastPoint.y;
      const length=Math.hypot(dx,dy);
      const steps=Math.min(22,Math.max(1,Math.ceil(length/12)));
      for(let n=1;n<=steps;n++){
        const ratio=n/steps;
        addMark(lastPoint.x+dx*ratio,lastPoint.y+dy*ratio,now);
      }
    }
    lastPoint={x,y};
    lastMove=now;
    request();
  }

  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse" && event.pointerType!=="pen")return;
    if(!sceneEnabled())return;
    pointerInside=true;
    pointerX=event.clientX;
    pointerY=event.clientY;
    dot.style.transform="translate3d("+(pointerX-5.5).toFixed(1)+"px,"+
      (pointerY-5.5).toFixed(1)+"px,0)";
    dot.classList.add("is-visible");
    paintMovement(pointerX,pointerY,performance.now());
  },{passive:true});
  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget){
      pointerInside=false;
      dot.classList.remove("is-visible");
    }
  },{passive:true});
  addEventListener("blur",()=>{
    pointerInside=false;
    dot.classList.remove("is-visible");
    erase();
  });
  addEventListener("resize",()=>{
    resize();
    erase();
  },{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)erase();
  });
  prefersReduced.addEventListener("change",syncScene);

  // The section counter updates while scrolling. The browser cursor must
  // return immediately in scenes 04 and 05, and on all other pages.
  new MutationObserver(syncScene).observe(document.body,{
    attributes:true,attributeFilter:["data-current-frame"]
  });
  canvas.dataset.ambientActive="false";
  resize();
  syncScene();
})();
