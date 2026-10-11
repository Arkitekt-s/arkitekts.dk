/* SILVER GLASS — opening Frame 01 only.
 * Frame 02–05 use the browser's native cursor, without a colored trail.
 * This does not control arch deformation, video, scrolling, or other scenes.
 */
(() => {
  "use strict";
  const canvas=document.getElementById("pointer-pattern");
  if(!canvas || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const smooth=t=>t*t*(3-2*t);
  const dot=document.createElement("span");
  dot.className="paint-cursor";
  dot.setAttribute("aria-hidden","true");
  const core=document.createElement("span");
  core.className="paint-cursor-core";
  dot.append(core);
  document.body.append(dot);

  let activeBefore=false,inside=false,frame=0,initialized=false;
  let px=-2000,py=-2000,tx=-2000,ty=-2000;
  let textRects=[],lastScan=-Infinity;
  function active(){
    return (document.body.dataset.currentFrame||"1")==="1" &&
      !reduced.matches && !document.body.classList.contains("motion-off") &&
      !document.hidden;
  }
  function clearCanvas(){
    if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height);
    canvas.dataset.ambientActive="false";
  }
  function position(){
    frame=0;
    if(!active())return;
    px+=(tx-px)*.33;
    py+=(ty-py)*.33;
    dot.style.transform="translate3d("+px.toFixed(1)+"px,"+py.toFixed(1)+"px,0)";
    if(Math.hypot(tx-px,ty-py)>.35)frame=requestAnimationFrame(position);
  }
  function cancelPosition(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;initialized=false;
  }
  function sync(){
    const next=active();
    if(activeBefore!==next){
      activeBefore=next;
      document.body.classList.toggle("paint-cursor-active",next);
      lastScan=-Infinity;
      if(!next){cancelPosition();clearCanvas();}
    }
    dot.classList.toggle("is-visible",next&&inside);
  }
  function nearText(x,y,now){
    if(now-lastScan>150){
      lastScan=now;
      textRects=[...document.querySelectorAll(
        ".site-header .site-name,.navigation a,.site-header .brand-icon,"+
        ".hero-text span,.hero-text em,.scene-eyebrow span")]
        .filter(el=>el.getClientRects().length)
        .map(el=>el.getBoundingClientRect())
        .filter(r=>r.width>0&&r.height>0);
    }
    let nearest=Infinity;
    for(const r of textRects){
      const dx=Math.max(r.left-x,0,x-r.right);
      const dy=Math.max(r.top-y,0,y-r.bottom);
      nearest=Math.min(nearest,Math.hypot(dx,dy));
    }
    return smooth(clamp(1-nearest/40,0,1));
  }
  function onMove(event){
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    if(!active()){sync();return;}
    inside=true;
    const x=event.clientX,y=event.clientY;
    tx=x;ty=y;
    if(!initialized||Math.hypot(x-px,y-py)>350){
      px=x;py=y;initialized=true;
    }
    core.style.setProperty("--cursor-scale",
      (1+.67*nearText(x,y,performance.now())).toFixed(3));
    if(!frame)frame=requestAnimationFrame(position);
    dot.classList.add("is-visible");
  }
  addEventListener("pointermove",onMove,{passive:true});
  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget){
      inside=false;
      dot.classList.remove("is-visible");
      cancelPosition();
    }
  },{passive:true});
  addEventListener("blur",()=>{
    inside=false;
    dot.classList.remove("is-visible");
    cancelPosition();clearCanvas();
  });
  addEventListener("resize",()=>{
    cancelPosition();lastScan=-Infinity;clearCanvas();
  },{passive:true});
  document.addEventListener("visibilitychange",sync);
  reduced.addEventListener("change",sync);
  new MutationObserver(sync).observe(document.body,{
    attributes:true,attributeFilter:["data-current-frame","class"]
  });
  clearCanvas();
  sync();
})();