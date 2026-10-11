/* A soft cursor-lit grid for homepage scenes 01 and 02.
 * Unlike the retired parallax/hold effect, this NEVER changes scene geometry,
 * captions, video position or pointer capture. No click/hold listeners.
 * It simply draws a faint mouse-following highlight, then fades away.
 */
(() => {
  "use strict";
  const canvas=document.getElementById("pointer-pattern");
  if(!canvas || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  let width=0,height=0,dpr=1,px=-1000,py=-1000,tx=-1000,ty=-1000;
  let lastMove=-Infinity,animationFrame=0,trail=[];
  const sceneActive=()=>{
    const frame=document.body.dataset.currentFrame;
    return (!frame || frame==="1" || frame==="2") && !document.body.classList.contains("motion-off") && !reduced.matches;
  };
  function resize(){
    width=innerWidth;
    height=innerHeight;
    dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);
    canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
  }
  function frame(now){
    animationFrame=0;
    if(!sceneActive() || document.hidden){
      ctx.clearRect(0,0,width,height);
      trail=[];
      return;
    }
    // All rendering is inside this overlay. The landscape never moves.
    const age=now-lastMove;
    const fade=Math.min(1,Math.max(0,(930-age)/530));
    if(fade<=0){
      trail=[];
      ctx.clearRect(0,0,width,height);
      return;
    }
    const ease=.16;
    px+=(tx-px)*ease;
    py+=(ty-py)*ease;
    ctx.clearRect(0,0,width,height);

    const glow=ctx.createRadialGradient(px,py,0,px,py,112);
    glow.addColorStop(0,"rgba(207,143,244,"+(.115*fade).toFixed(3)+")");
    glow.addColorStop(.48,"rgba(165,105,225,"+(.043*fade).toFixed(3)+")");
    glow.addColorStop(1,"rgba(165,105,225,0)");
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.arc(px,py,112,0,Math.PI*2);
    ctx.fill();

    // Tiny illuminated nodes on the existing static grid: no distortion.
    const dx=width/12;
    const dy=height/8;
    const col=Math.round(px/dx);
    const row=Math.round(py/dy);
    for(let c=col-1;c<=col+1;c++){
      for(let r=row-1;r<=row+1;r++){
        if(c<0||c>12||r<0||r>8)continue;
        const x=c*dx,y=r*dy;
        const influence=Math.max(0,1-Math.hypot(x-px,y-py)/175)*fade;
        if(influence<.02)continue;
        ctx.fillStyle="rgba(227,181,255,"+(.46*influence).toFixed(3)+")";
        ctx.beginPath();
        ctx.arc(x,y,1.65,0,Math.PI*2);
        ctx.fill();
      }
    }
    // A short, delicate glow trail. It disappears when the mouse stops.
    trail.push({x:px,y:py});
    if(trail.length>9)trail.shift();
    if(trail.length>1){
      ctx.lineCap="round";
      for(let i=1;i<trail.length;i++){
        ctx.beginPath();
        ctx.moveTo(trail[i-1].x,trail[i-1].y);
        ctx.lineTo(trail[i].x,trail[i].y);
        ctx.lineWidth=1.1;
        ctx.strokeStyle="rgba(232,181,249,"+(.15*fade*i/trail.length).toFixed(3)+")";
        ctx.stroke();
      }
    }
    animationFrame=requestAnimationFrame(frame);
  }
  function schedule(){
    if(!animationFrame)animationFrame=requestAnimationFrame(frame);
  }
  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse" && event.pointerType!=="pen")return;
    if(!sceneActive())return;
    tx=event.clientX;ty=event.clientY;
    if(px<0){px=tx;py=ty;}
    lastMove=performance.now();
    schedule();
  },{passive:true});
  addEventListener("resize",resize,{passive:true});
  reduced.addEventListener("change",()=>{
    if(reduced.matches){ctx.clearRect(0,0,width,height);trail=[];}
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){ctx.clearRect(0,0,width,height);trail=[];}
  });
  resize();
})();
