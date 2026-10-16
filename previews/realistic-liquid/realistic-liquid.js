/* Three REAL liquid interaction models. Preview only.
   All geometry samples and paints pixels from the actual playing hero video.
   No pre-rendered sprites, arbitrary particle colors, or modifications to the
   original arch video and mask. */
(()=>{
"use strict";
const stage=document.getElementById("frame"),video=document.getElementById("arch-morph-video"),
poster=document.getElementById("arch-morph-poster"),mask=document.getElementById("live-arch-morph-path");
if(!stage||!video||!mask)return;
document.body.classList.add("liquid-portal-preview");
const canvas=document.createElement("canvas");canvas.className="liquid-splash-canvas";canvas.id="liquid-splash-canvas";canvas.setAttribute("aria-hidden","true");stage.append(canvas);
const ctx=canvas.getContext("2d",{alpha:true});if(!ctx)return;
const probe=document.createElement("canvas");probe.width=40;probe.height=30;
const pc=probe.getContext("2d",{willReadFrequently:true});
const demo=document.getElementById("liquid-demo"),slider=document.getElementById("liquid-strength"),output=document.getElementById("liquid-strength-value"),status=document.getElementById("liquid-preview-status");
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
let W=0,H=0,DPR=1,mode="b",pointer={x:-1000,y:-1000},origin=null;
let hit=false,force=0,returnForce=0,frame=0,last=0,phase=0,demoAt=0,demoOn=false,returning=false;
let rgba=[68,133,211],videoSample="waiting",readable=true;
let palette=[[45,138,223],[99,65,217],[231,99,176],[60,200,222],[228,155,204]];
let textureStamp=-Infinity;
const texture=document.createElement("canvas"),textureCtx=texture.getContext("2d",{willReadFrequently:true});
texture.width=768;texture.height=480;
const rgb=(v,a=1)=>"rgba("+v.map(n=>Math.round(clamp(n,0,255))).join(",")+","+a+")";
const shine=(v,amount=.34)=>v.map(x=>clamp(x+(255-x)*amount,0,255));
const deep=(v,amount=.38)=>v.map(x=>clamp(x*(1-amount),0,255));
const saturated=(v)=>{
 const avg=(v[0]+v[1]+v[2])/3;
 return v.map(x=>clamp((x-avg)*1.62+avg*1.13+7,0,255));
};
function actualColors(t){
 if(t-textureStamp<65)return;
 const media=source();if(!media)return;
 try{
  const sw=media.videoWidth||media.naturalWidth,sh=media.videoHeight||media.naturalHeight;
  if(!sw||!sh)return;
  const k=Math.max(texture.width/sw,texture.height/sh),cw=texture.width/k,ch=texture.height/k;
  textureCtx.clearRect(0,0,texture.width,texture.height);
  textureCtx.drawImage(media,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,texture.width,texture.height);
  textureStamp=t;
  const sampleAt=(px,py)=>{
   const x=Math.floor(clamp(px/W,0,1)*(texture.width-1)),y=Math.floor(clamp(py/H,0,1)*(texture.height-1));
   const d=textureCtx.getImageData(x,y,1,1).data;
   return saturated([d[0],d[1],d[2]]);
  };
  const pos=origin||{x:W*.52,y:H*.44};
  palette=[
   sampleAt(pos.x-65,pos.y-145),sampleAt(pos.x+50,pos.y-90),
   sampleAt(pos.x-90,pos.y+25),sampleAt(pos.x+95,pos.y+68),
   sampleAt(pos.x+20,pos.y+140)
  ];
  rgba=sampleAt(pointer.x,pointer.y);
  videoSample=media===video?"playing-video":"poster";
  readable=true;
 }catch(e){
  textureStamp=-Infinity;readable=false;videoSample="unreadable-source";
 }
}
let drops=[];
function setMode(m){
 if(!["a","b","c"].includes(m))return;
 mode=m;document.body.dataset.liquidMode=m;
 for(const b of document.querySelectorAll("[data-liquid-mode]"))b.setAttribute("aria-pressed",String(b.dataset.liquidMode===m));
 drops=[];origin=null;force=0;returnForce=0;
 if(location.hash!==("#"+m))history.replaceState(null,"","#"+m);
 schedule();
}
document.querySelectorAll("[data-liquid-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.liquidMode)));
function resize(){
 const rect=stage.getBoundingClientRect();W=rect.width;H=rect.height;DPR=Math.min(devicePixelRatio||1,1.7);
 canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);
}
new ResizeObserver(resize).observe(stage);resize();
function source(){if(video.readyState>=2&&video.videoWidth)return video;return poster.naturalWidth?poster:null}
function paintFrame(src){
 if(textureStamp>0){
  ctx.drawImage(texture,0,0,texture.width,texture.height,0,0,W,H);
  return true;
 }
 const sw=src?.videoWidth||src?.naturalWidth,sh=src?.videoHeight||src?.naturalHeight;
 if(!sw||!sh)return false;
 const k=Math.max(W/sw,H/sh);
 try{ctx.drawImage(src,(sw-W/k)/2,(sh-H/k)/2,W/k,H/k,0,0,W,H);return true}catch{return false}
}
function sample(t){actualColors(t)}
function screenPoint(e){const r=stage.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function geometry(pt){
 const b=stage.getBoundingClientRect();
 const arches=[...document.querySelectorAll("#panorama .arch")];
 let best=null;
 for(const a of arches){
  const q=a.getBoundingClientRect(),left=q.left-b.left,top=q.top-b.top;
  if(pt.x<left-18||pt.x>left+q.width+18||pt.y<top-16||pt.y>top+q.height+16)continue;
  if(!best||Math.abs(pt.x-(left+q.width/2))<Math.abs(pt.x-best.center))
    best={left,right:left+q.width,top,bottom:top+q.height,center:left+q.width/2,width:q.width};
 }
 if(!best)return null;
 const side=pt.x<best.center?-1:1;
 return {x:side===1?best.right:best.left,y:clamp(pt.y,best.top+20,best.bottom-20),side,center:best.center,arch:best};
}
function archContains(pt){
 try{return ctx.isPointInPath(new Path2D(mask.getAttribute("d")||""),pt.x,pt.y)}
 catch{return false}
}
function createDrop(i,anchor,count){
 const seed=i*2.399963229728653;
 const spacing=mode==="a"?38:mode==="b"?58:43;
 return {start:seed,x:anchor.x,y:anchor.y,vx:0,vy:0,
  radius:32,
  offset:(i-(count-1)/2)*spacing,
  phase:seed,stretch:.76+((i*7)%9)/16};
}
function setup(g){
 origin=g;
 const count=mode==="a"?2:mode==="b"?3:3;
 drops=Array.from({length:count},(_,i)=>createDrop(i,g,count));
}


/* Liquid surface renderer v3: continuous refractive sheets, not tubes.
 * Sample texture from the playing film, shaded with thin-film iridescence.
 * No separate mouse glow, cartoon spheres or arbitrary radial radiation.
 */
function ribbonSurface(ax,ay,tx,ty,width,phaseOffset,index){
 const dx=tx-ax,dy=ty-ay,length=Math.max(1,Math.hypot(dx,dy));
 const normal={x:-dy/length,y:dx/length};
 const wobble=phase*1.1+phaseOffset;
 // Sheet bends and folds: wide at the root, fluid in the middle, pointed at the far tip.
 const fold=(t)=>Math.sin(t*Math.PI)*Math.sin(wobble+t*5.5)*width*.39;
 const center=(t)=>{
  const arch=t*(1-t)*4;
  return {x:ax+dx*t+normal.x*(Math.sin(t*Math.PI)*width*.24+fold(t)),
          y:ay+dy*t+normal.y*(Math.sin(t*Math.PI)*width*.24+fold(t))+
             arch*Math.sin(wobble*.62)*width*.25};
 };
 const thickness=(t)=>{
  const neck=Math.pow(Math.max(0,1-t),.45);
  const swell=.75+.48*Math.sin(Math.PI*t)+.12*Math.sin(12*t+phaseOffset);
  return Math.max(.3,width*neck*swell);
 };
 const p=new Path2D(),N=34;
 for(let i=0;i<=N;i++){
  const t=i/N,c=center(t),r=thickness(t);
  const x=c.x+normal.x*r,y=c.y+normal.y*r;
  if(!i)p.moveTo(x,y);else p.lineTo(x,y);
 }
 for(let i=N;i>=0;i--){
  const t=i/N,c=center(t),r=thickness(t);
  p.lineTo(c.x-normal.x*r,c.y-normal.y*r);
 }
 p.closePath();
 return {path:p,normal,center,thickness,length};
}
function drawLiquid(d,index,amp,src){
 if(!origin)return 0;
 const ax=origin.x,ay=clamp(origin.y+d.offset,12,H-12),tx=d.x,ty=d.y;
 const reach=Math.hypot(tx-ax,ty-ay);
 if(reach<2||amp<.014)return 0;
 // Each material is a broad wave-shaped membrane, not a cylindrical bead.
 const widths={a:[74,49],b:[49,40,33],c:[51,38,32]};
 const baseWidth=widths[mode][index%widths[mode].length];
 const width=baseWidth*amp*(Number(slider?.value||75)/75);
 const surface=ribbonSurface(ax,ay,tx,ty,width,d.phase,index);
 const p=surface.path;
 const n=surface.normal;
 // Use original movie frames as moving interior pigment.
 // Refractive cyan/purple/magenta reflections are deliberately optical
 // overlays; they are NOT claimed to be exact sampled film colors.
 const gradient=ctx.createLinearGradient(ax,ay,tx,ty);
 const tone=index%3;
 const palette=[
   [[24,161,237],[103,99,238],[246,121,184]],
   [[68,200,223],[123,83,221],[255,167,176]],
   [[39,103,225],[194,116,247],[251,145,197]]
 ][tone];
 const shift=Math.sin(phase*.62+d.phase)*.14;
 const col=(n,t=.0)=>palette[n].map(v=>Math.round(clamp(v*(1+t),0,255)));
 gradient.addColorStop(0,rgb(col(0,.15),.76*amp));
 gradient.addColorStop(.29,rgb(col(1),.67*amp));
 gradient.addColorStop(.53,rgb(col(2,.12),.59*amp));
 gradient.addColorStop(.73,rgb(col(0,shift),.68*amp));
 gradient.addColorStop(1,rgb(col(1,.16),.77*amp));
 ctx.save();
 ctx.shadowColor=rgb(col(1),.33*amp);ctx.shadowBlur=20;
 ctx.fillStyle=gradient;ctx.fill(p);ctx.restore();
 ctx.save();ctx.clip(p);
 if(src){
  // Continuous animated content inside the arch feeds each membrane.
  ctx.globalAlpha=.24;
  paintFrame(src);
  ctx.globalAlpha=1;
 }
 // Semi-transparent liquid glass changes spectral hue across its curved surface.
 ctx.globalCompositeOperation="source-over";
 ctx.fillStyle=gradient;ctx.fill(p);
 const t0=surface.center(.54),r0=surface.thickness(.54);
 const cross=ctx.createLinearGradient(
    t0.x+n.x*r0*1.4,t0.y+n.y*r0*1.4,
    t0.x-n.x*r0*1.4,t0.y-n.y*r0*1.4);
 cross.addColorStop(0,"rgba(247,252,255,.73)");
 cross.addColorStop(.13,"rgba(255,255,255,.21)");
 cross.addColorStop(.36,"rgba(255,255,255,.012)");
 cross.addColorStop(.65,"rgba(12,5,53,.21)");
 cross.addColorStop(.85,"rgba(12,6,62,.30)");
 cross.addColorStop(1,"rgba(255,255,255,.53)");
 ctx.fillStyle=cross;ctx.fill(p);
 // Translucent folds create flowing sheets rather than parallel flat ribbons.
 ctx.globalCompositeOperation="screen";
 for(let layer=0;layer<2;layer++){
  ctx.beginPath();
  const fraction=layer===0?.47:-.31;
  for(let i=0;i<=31;i++){
   const t=i/31,c=surface.center(t),r=surface.thickness(t);
   const bend=Math.sin(phase*(layer?.83:1.1)+t*13+d.phase)*r*.09;
   const x=c.x+n.x*(r*fraction+bend);
   const y=c.y+n.y*(r*fraction+bend);
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.lineWidth=layer===0?Math.max(2,width*.13):Math.max(1,width*.055);
  ctx.strokeStyle=layer===0?"rgba(235,251,255,.38)":"rgba(255,198,242,.44)";
  ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
 }
 ctx.restore();
 ctx.save();
 ctx.strokeStyle="rgba(248,248,255,"+(.36*amp)+")";
 ctx.lineWidth=1.2;
 ctx.shadowColor=rgb(col(1),.48*amp);ctx.shadowBlur=7;
 ctx.stroke(p);ctx.restore();
 // Only splash mode has a few small, soft detachable droplets.
 if(mode==="b" && index>0 && reach>90){
  for(let k=0;k<2;k++){
   const t=.71+k*.16,c=surface.center(t);
   const off=surface.thickness(t)*(1.45+k*.44);
   const x=c.x+n.x*off,y=c.y+n.y*off;
   const r=(3+k*2)*amp;
   const g=ctx.createRadialGradient(x-r*.24,y-r*.32,0,x,y,r);
   g.addColorStop(0,"rgba(255,255,255,.82)");
   g.addColorStop(.4,rgb(col(k),.77*amp));
   g.addColorStop(1,rgb(col(1),0));
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
 }
 return reach;
}
function drawVortex(){}
function animate(t){
 frame=0;
 const dt=last?clamp((t-last)/16.7,.5,1.9):1;last=t;phase+=dt*.041;
 if(demoOn){
  const elapsed=(t-demoAt)/1000;
  if(elapsed<5){
   const q=document.querySelector("#panorama .arch:nth-child(2)")?.getBoundingClientRect(),r=stage.getBoundingClientRect();
   if(q){pointer={x:q.left-r.left+q.width*(.57+.19*Math.sin(elapsed*2.6)),y:q.top-r.top+q.height*(.48+.16*Math.sin(elapsed*3.8))};hit=true}
  }else{demoOn=false;hit=false}
 }
 const playing=!video.paused,canAct=Number(document.body.dataset.journeyProgress||0)<.25&&
  !matchMedia("(prefers-reduced-motion:reduce)").matches;
 const inside=canAct&&hit&&archContains(pointer);
 let g=inside?geometry(pointer):null;
 const was=force>.07;
 force+=(Number(inside)-force)*(1-Math.exp(-dt/(inside?8:18)));
 if(inside&&g){
  if(!origin||g.side!==origin.side||Math.abs(g.center-origin.center)>50)setup(g);
  origin=g;
 }
 const intensity=Number(slider?.value||75)/75;
 const src=source();
 ctx.clearRect(0,0,W,H);
 if(inside)sample(t);
 let sum=0,velocity=0;
 for(const d of drops){
  if(!origin)continue;
  const a=origin;
  const distance=(mode==="a"?240:mode==="b"?335:350)*d.stretch*intensity;
  const outward=inside?a.side*distance:0;
  const spread=mode==="a"?25:mode==="b"?66:108;
  const targetX=a.x+outward;
  const targetY=clamp(a.y+d.offset+(inside?Math.sin(phase*.92+d.phase)*spread*.64:0),5,H-5);
  const springiness=mode==="a"?.11:mode==="b"?.18:.125;
  const friction=mode==="a"?.79:mode==="b"?.78:.83;
  d.vx=(d.vx+(targetX-d.x)*springiness*dt)*Math.pow(friction,dt);
  d.vy=(d.vy+(targetY-d.y)*(springiness*.72)*dt)*Math.pow(friction,dt);
  d.x+=d.vx*dt;d.y+=d.vy*dt;
  velocity+=Math.abs(d.vx)+Math.abs(d.vy);
  sum+=drawLiquid(d,drops.indexOf(d),force,src);
 }
 canvas.dataset.liquidActive=String(inside);
 canvas.dataset.liquidExtent=String(Math.round(sum));
 canvas.dataset.sampleSource=videoSample;
 canvas.dataset.sampleRgb=rgba.map(Math.round).join(",");
 canvas.dataset.cursorGlowDisabled="true";
 canvas.dataset.liquidVariant="iridescent-flowing-membrane-v3";
 canvas.dataset.videoPlaying=String(playing);
 if(inside)status.textContent={a:"A · THICK LIQUID GEL",b:"B · DYNAMIC VIDEO SPLASH",c:"C · STRETCHY LIQUID SILK"}[mode];
 else if(was)status.textContent="LIQUID FLOWING BACK INTO THE ARCH";
 if(!inside&&force<.008&&velocity<2){ctx.clearRect(0,0,W,H);canvas.dataset.liquidExtent="0";status.textContent="RESET · VIDEO STILL PLAYING";last=0;return}
 schedule();
}
function schedule(){if(!frame)frame=requestAnimationFrame(animate)}
function ptr(e){
 if(demoOn)demoOn=false;
 const rect=stage.getBoundingClientRect();
 pointer={x:e.clientX-rect.left,y:e.clientY-rect.top};
 hit=!(e.target instanceof Element&&e.target.closest(".liquid-preview-panel,.site-header,.site-footer,.portal-navigation"));
 schedule();
}
addEventListener("pointermove",ptr,{passive:true});
addEventListener("pointerdown",e=>{if(e.pointerType==="touch")ptr(e)},{passive:true});
addEventListener("pointerup",e=>{if(e.pointerType==="touch"){hit=false;schedule()}},{passive:true});
document.addEventListener("mouseout",e=>{if(!e.relatedTarget){hit=false;schedule()}},{passive:true});
addEventListener("blur",()=>{hit=false;schedule()});
demo?.addEventListener("click",()=>{demoOn=true;demoAt=performance.now();origin=null;hit=true;schedule()});
slider?.addEventListener("input",()=>{output.textContent=slider.value+"%";schedule()});
video.addEventListener("playing",()=>{canvas.dataset.videoPlaying="true"});
const initial=location.hash.slice(1);setMode(["a","b","c"].includes(initial)?initial:"b");
canvas.dataset.liquidActive="false";canvas.dataset.liquidExtent="0";
})();