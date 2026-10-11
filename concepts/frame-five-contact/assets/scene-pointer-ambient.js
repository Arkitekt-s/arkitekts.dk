/* Homepage sections 01 and 02: colorful cinematic cursor light.
 * Inspired by luminous interactive studios, without copying their code.
 * Creates vivid ambient color along the mouse's path, fading naturally.
 * Crucially: never moves the picture, text, film or grid; no press/hold.
 */
(() => {
  "use strict";
  const canvas=document.getElementById("pointer-pattern");
  if(!canvas || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const lifespan=1250;
  const palette=[
    [170,78,249],  // Violet on the left
    [249,76,184],  // Magenta/pink in the center
    [67,205,245]   // Cyan on the right
  ];
  let width=0,height=0,dpr=1;
  let px=-1000,py=-1000,tx=-1000,ty=-1000;
  let trail=[],lastMove=-Infinity,lastSample=-Infinity,frameId=0;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const active=()=>{
    const scene=document.body.dataset.currentFrame;
    return (!scene||scene==="1"||scene==="2")&&!reduced.matches;
  };
  function tint(x){
    const t=clamp(x/Math.max(1,width),0,1)*2;
    const i=t<1?0:1;
    const f=t-i;
    return palette[i].map((v,k)=>Math.round(v+(palette[i+1][k]-v)*f));
  }
  const rgba=(rgb,alpha)=>"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+","+clamp(alpha,0,1).toFixed(3)+")";
  function resize(){
    width=innerWidth;height=innerHeight;
    dpr=Math.min(devicePixelRatio||1,1.4);
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
  }
  function reset(){
    if(frameId)cancelAnimationFrame(frameId);
    frameId=0;
    trail=[];
    px=py=tx=ty=-1000;
    lastMove=-Infinity;
    canvas.dataset.ambientActive="false";
    ctx.clearRect(0,0,width,height);
  }
  function blob(x,y,radius,color,alpha){
    if(alpha<.004)return;
    const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,rgba(color,alpha));
    gradient.addColorStop(.35,rgba(color,alpha*.62));
    gradient.addColorStop(.72,rgba(color,alpha*.20));
    gradient.addColorStop(1,rgba(color,0));
    ctx.fillStyle=gradient;
    ctx.fillRect(x-radius,y-radius,2*radius,2*radius);
  }
  function draw(now){
    frameId=0;
    if(!active()||document.hidden){reset();return;}
    trail=trail.filter(p=>now-p.time<lifespan);
    const rest=now-lastMove;
    const alive=trail.length||rest<1050;
    if(!alive){reset();return;}
    // Color blooms persist briefly along the path instead of fading instantly.
    ctx.clearRect(0,0,width,height);
    for(let i=0;i<trail.length;i++){
      const mark=trail[i];
      const life=clamp(1-(now-mark.time)/lifespan,0,1);
      const fade=life*life;
      const radius=104+30*(1-life);
      blob(mark.x,mark.y,radius,mark.color,.21*fade);
    }
    if(tx>=0){
      px+=(tx-px)*.22;
      py+=(ty-py)*.22;
      const live=clamp((1120-rest)/540,0,1);
      const color=tint(px);
      const companion=tint(clamp(px+width*.26,0,width));
      // Broad atmospheric color and an inner responsive halo.
      blob(px-34,py+15,218,color,.23*live);
      blob(px+37,py-19,145,companion,.20*live);
      blob(px,py,82,color,.34*live);
      // Fine luminous accent keeps motion clearly visible on dark scenes.
      blob(px,py,24,[255,226,251],.15*live);
    }
    canvas.dataset.ambientActive="true";
    frameId=requestAnimationFrame(draw);
  }
  const request=()=>{if(!frameId)frameId=requestAnimationFrame(draw);};
  function record(x,y,now){
    const last=trail[trail.length-1];
    const dist=last?Math.hypot(x-last.x,y-last.y):999;
    if(dist<11 && now-lastSample<28)return;
    // Fast cursor movement paints short, continuous clouds, not sparse dots.
    if(last && dist>44 && dist<550){
      const steps=Math.min(9,Math.floor(dist/35));
      for(let i=1;i<steps;i++){
        const f=i/steps;
        const nx=last.x+(x-last.x)*f,ny=last.y+(y-last.y)*f;
        trail.push({x:nx,y:ny,time:now,color:tint(nx)});
      }
    }
    trail.push({x,y,time:now,color:tint(x)});
    if(trail.length>27)trail.splice(0,trail.length-27);
    lastSample=now;
  }
  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    if(!active())return;
    const now=performance.now();
    const x=event.clientX,y=event.clientY;
    if(px<0||now-lastMove>lifespan || Math.hypot(x-tx,y-ty)>width*.67){
      // No color streak across the screen when the mouse re-enters.
      px=x;py=y;trail=[];lastSample=-Infinity;
    }
    tx=x;ty=y;
    lastMove=now;
    record(x,y,now);
    request();
  },{passive:true});
  addEventListener("resize",()=>{resize();reset();},{passive:true});
  reduced.addEventListener("change",()=>{if(reduced.matches)reset();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)reset();});
  // The story changes sections without a page reload.
  // Clear lingering glow immediately when leaving scene 02.
  new MutationObserver(()=>{
    if(!active())reset();
  }).observe(document.body,{attributes:true,attributeFilter:["data-current-frame"]});
  canvas.dataset.ambientActive="false";
  resize();
})();
