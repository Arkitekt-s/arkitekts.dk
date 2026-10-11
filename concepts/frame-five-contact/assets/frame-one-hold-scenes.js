/* Frame 01 only: press and hold cycles three moving arch worlds.
 * Original: mountain film. Two extra worlds: procedural fluid paintings.
 * A violet liquid wipe hides the swap. Other four frames stay untouched.
 */
(() => {
  "use strict";
  const stage=document.getElementById("frame");
  const panorama=document.getElementById("panorama");
  const arches=[...document.querySelectorAll("#panorama .arch")];
  if(!stage||!panorama||arches.length!==3)return;

  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const names=["Mountain Film","Tidal Ink","Liquid Aurora"];
  let scene=0,armed=null,heldPointer=null,transition=null;
  let anim=0,lastPaint=-Infinity,paintVersion=-1;
  const palette=[
    [[5,23,65],[29,75,144],[62,159,206],[131,213,210],[246,206,99],[18,71,145],[7,20,58]],
    [[46,17,92],[119,46,156],[194,93,187],[245,162,199],[252,215,167],[146,76,177],[36,19,84]]
  ];
  const source=document.createElement("canvas");
  source.width=360;source.height=240;
  const ink=source.getContext("2d",{alpha:false});
  const bits=ink.createImageData(source.width,source.height);
  const pixels=bits.data;

  // The SAME generated film is cropped into three arch windows.
  const panes=arches.map(arch=>{
    const canvas=document.createElement("canvas");
    canvas.className="hold-scene-paint";
    canvas.setAttribute("aria-hidden","true");
    arch.append(canvas);
    return {arch,canvas,ctx:canvas.getContext("2d",{alpha:false})};
  });

  const wipe=document.createElement("canvas");
  wipe.className="hold-scene-wipe";
  wipe.setAttribute("aria-hidden","true");
  stage.append(wipe);
  const wipeCtx=wipe.getContext("2d",{alpha:true});
  let wipeWidth=0,wipeHeight=0,dpr=1;

  const button=document.createElement("button");
  button.type="button";
  button.className="hold-scene-control";
  button.id="hold-scene-control";
  button.setAttribute("aria-label","Press and hold the scene, or click to cycle through three animated backgrounds");
  stage.append(button);

  const hint=document.createElement("span");
  hint.className="hold-scene-hint";
  hint.setAttribute("aria-hidden","true");
  hint.textContent="HOLD ANYWHERE TO CHANGE THE ART";
  stage.append(hint);

  function eligible(){
    return (document.body.dataset.currentFrame||"1")==="1" &&
      Number(document.body.dataset.portalProgress||"0")<.075 &&
      !document.body.classList.contains("motion-off") && !document.hidden;
  }
  function syncButton(){
    button.textContent="PRESS & HOLD  ·  "+String(scene+1).padStart(2,"0")+" / 03";
    button.setAttribute("aria-label",names[scene]+". Hold the page or click to see the next animated scene");
  }
  function resize(){
    const r=stage.getBoundingClientRect();
    wipeWidth=r.width;wipeHeight=r.height;dpr=Math.min(devicePixelRatio||1,1.4);
    wipe.width=Math.max(1,Math.round(r.width*dpr));
    wipe.height=Math.max(1,Math.round(r.height*dpr));
    wipeCtx.setTransform(dpr,0,0,dpr,0,0);
    for(const p of panes){
      const rect=p.arch.getBoundingClientRect();
      p.canvas.width=Math.max(1,Math.round(rect.width*Math.min(devicePixelRatio||1,1.5)));
      p.canvas.height=Math.max(1,Math.round(rect.height*Math.min(devicePixelRatio||1,1.5)));
    }
    paintVersion=-1;
  }
  // Muted color bands follow a smoothly moving curl field. Nothing
  // depends on external image URLs or heavyweight video downloads.
  function paint(time){
    if(!ink)return;
    const w=source.width,h=source.height;
    const colors=palette[scene-1];
    if(!colors)return;
    const t=time*.001;
    for(let y=0;y<h;y++){
      const v=y/h;
      const fy=Math.sin(v*12-t*.31);
      for(let x=0;x<w;x++){
        const u=x/w;
        const curve=u*10.7+Math.sin(v*8.4+t*.36)*2.1+fy*.49;
        const bend=Math.sin(curve)+.46*Math.sin((u-v)*19-t*.48)+
          .27*Math.cos(v*20+Math.sin(u*8-t*.27)*2.3);
        const scaled=clamp((bend+1.73)/3.46,0,.999)*6;
        const k=Math.floor(scaled),alpha=scaled-k;
        const a=colors[k],b=colors[k+1];
        const brightness=.87+.13*Math.cos((u+v)*8.1+t*.27);
        const z=(y*w+x)*4;
        pixels[z]=(a[0]+(b[0]-a[0])*alpha)*brightness;
        pixels[z+1]=(a[1]+(b[1]-a[1])*alpha)*brightness;
        pixels[z+2]=(a[2]+(b[2]-a[2])*alpha)*brightness;
        pixels[z+3]=255;
      }
    }
    ink.putImageData(bits,0,0);
    // Fine streaks evoke moving ink and a painterly liquid surface.
    for(let line=0;line<52;line++){
      const baseY=line*5.1-11;
      ink.beginPath();
      for(let x=0;x<=w;x+=4){
        const y=baseY+11*Math.sin(x*.025+baseY*.018+t*.39)+
          4*Math.cos(x*.07+baseY*.04-t*.30);
        if(x===0)ink.moveTo(x,y);else ink.lineTo(x,y);
      }
      const light=scene===1?"244,224,163":"255,223,251";
      ink.lineWidth=line%8===0?1.2:.42;
      ink.strokeStyle="rgba("+light+","+(line%8===0?.23:.13)+")";
      ink.stroke();
    }
    const sourceWidth=w/3;
    for(let i=0;i<panes.length;i++){
      const p=panes[i],ctx=p.ctx;
      if(!ctx)continue;
      ctx.clearRect(0,0,p.canvas.width,p.canvas.height);
      ctx.drawImage(source,i*sourceWidth,0,sourceWidth,h,
        0,0,p.canvas.width,p.canvas.height);
    }
  }
  function repaint(time){
    anim=0;
    if(scene===0||!eligible())return;
    if(time-lastPaint>52 || paintVersion!==scene){
      paint(time);lastPaint=time;paintVersion=scene;
    }
    if(!reduced.matches)anim=requestAnimationFrame(repaint);
  }
  function startPainting(){
    if(anim)cancelAnimationFrame(anim);
    anim=0;lastPaint=-Infinity;
    if(scene!==0)anim=requestAnimationFrame(repaint);
  }
  function setScene(next){
    scene=((next%3)+3)%3;
    panorama.dataset.artScene=String(scene);
    document.body.dataset.frameOneArt=String(scene);
    syncButton();startPainting();
  }
  function wipeFrame(now){
    if(!transition)return;
    const s=transition;
    const t=clamp((now-s.started)/1430,0,1);
    if(!eligible()){reset();return;}
    if(!s.switched && t>=.49){
      s.switched=true;
      setScene(s.next);
    }
    wipeCtx.clearRect(0,0,wipeWidth,wipeHeight);
    if(t>=1){
      wipe.style.visibility="hidden";
      transition=null;return;
    }
    const opacity=1-ease((t-.69)/.30);
    const centerX=s.x,centerY=s.y;
    const maxR=Math.hypot(wipeWidth,wipeHeight)*1.18;
    const radius=(25+maxR*ease(t/.56));
    const grad=wipeCtx.createRadialGradient(centerX,centerY,0,centerX,centerY,radius);
    grad.addColorStop(0,"rgba(248,181,254,1)");
    grad.addColorStop(.30,"rgba(203,87,225,1)");
    grad.addColorStop(.67,"rgba(132,33,180,1)");
    grad.addColorStop(1,"rgba(70,13,111,1)");
    wipeCtx.globalAlpha=opacity;
    wipeCtx.shadowBlur=42;wipeCtx.shadowColor="rgba(242,137,254,.9)";
    wipeCtx.beginPath();
    const steps=72;
    for(let i=0;i<=steps;i++){
      const a=i/steps*Math.PI*2;
      const ripple=1+.065*Math.sin(a*5+now*.005)+.045*Math.sin(a*11-now*.006);
      const distance=radius*ripple;
      const x=centerX+Math.cos(a)*distance,y=centerY+Math.sin(a)*distance;
      if(i===0)wipeCtx.moveTo(x,y);else wipeCtx.lineTo(x,y);
    }
    wipeCtx.closePath();
    wipeCtx.fillStyle=grad;wipeCtx.fill();
    wipeCtx.shadowBlur=0;
    wipeCtx.globalAlpha=1;
    requestAnimationFrame(wipeFrame);
  }
  function advance(x,y){
    if(!eligible()||transition)return;
    if(reduced.matches){
      setScene((scene+1)%3);
      return;
    }
    resize();
    const r=stage.getBoundingClientRect();
    transition={
      next:(scene+1)%3,
      started:performance.now(),
      switched:false,
      x:clamp(x-r.left,0,r.width),y:clamp(y-r.top,0,r.height)
    };
    wipe.style.visibility="visible";
    requestAnimationFrame(wipeFrame);
  }
  function unarm(){
    if(armed!==null)clearTimeout(armed);
    armed=null;heldPointer=null;
  }
  function reset(){
    unarm();
    transition=null;
    wipe.style.visibility="hidden";
    wipeCtx.clearRect(0,0,wipeWidth,wipeHeight);
    if(scene!==0)setScene(0);
    else if(anim){cancelAnimationFrame(anim);anim=0;}
  }

  stage.addEventListener("pointerdown",e=>{
    if(!eligible()||transition||e.button!==0||armed!==null)return;
    if(e.target instanceof Element && e.target.closest(
      "a,button,input,textarea,select,.journey-scrollbar,#journey-scrollbar,#gallery-viewport,#globe-shell"))return;
    const startX=e.clientX,startY=e.clientY;
    heldPointer={id:e.pointerId,x:startX,y:startY,triggered:false};
    armed=setTimeout(()=>{
      armed=null;
      if(!heldPointer||heldPointer.id!==e.pointerId)return;
      heldPointer.triggered=true;
      advance(startX,startY);
    },e.pointerType==="touch"?440:320);
  },{passive:true});
  stage.addEventListener("pointermove",e=>{
    if(!heldPointer||heldPointer.id!==e.pointerId||heldPointer.triggered)return;
    if(Math.hypot(e.clientX-heldPointer.x,e.clientY-heldPointer.y)>18)unarm();
  },{passive:true});
  addEventListener("pointerup",unarm,{passive:true});
  addEventListener("pointercancel",unarm,{passive:true});
  addEventListener("blur",()=>{unarm();reset();});
  button.addEventListener("click",()=>{
    const r=stage.getBoundingClientRect();
    advance(r.left+r.width*.33,r.top+r.height*.46);
  });
  addEventListener("keydown",e=>{
    if(e.key==="Escape")reset();
  });
  addEventListener("resize",()=>{resize();if(scene!==0)startPainting();},{passive:true});
  reduced.addEventListener("change",()=>{if(scene!==0)startPainting();});
  document.getElementById("motion-button")?.addEventListener("click",()=>{
    if(document.body.classList.contains("motion-off"))reset();
  });
  new MutationObserver(()=>{
    if(!eligible()){
      if(scene!==0||transition||armed!==null)reset();
    }
  }).observe(document.body,{attributes:true,attributeFilter:[
    "data-current-frame","data-portal-progress","class"
  ]});
  resize();
  setScene(0);
  wipe.style.visibility="hidden";
})();