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
 const spacing=mode==="a"?62:mode==="b"?30:55;
 return {start:seed,x:anchor.x,y:anchor.y,vx:0,vy:0,
  radius:(mode==="a"?39:mode==="b"?25:31)+(i%3)*7,
  offset:(i-(count-1)/2)*spacing,
  phase:seed,stretch:.76+((i*7)%9)/16};
}
function setup(g){
 origin=g;
 const count=mode==="a"?4:mode==="b"?9:6;
 drops=Array.from({length:count},(_,i)=>createDrop(i,g,count));
}

function pathRibbon(d,ax,ay,tx,ty,r,twist){
 const dx=tx-ax,dy=ty-ay,L=Math.hypot(dx,dy)+.001,nx=-dy/L,ny=dx/L;
 const c1x=ax+dx*.32+nx*twist,c1y=ay+dy*.32+ny*twist;
 const c2x=ax+dx*.76-nx*twist*.48,c2y=ay+dy*.76-ny*twist*.48;
 const nose=r*(mode==="b"?.49:mode==="a"?.88:.32);
 const middle=r*(mode==="c"?.69:1.12),root=r*1.19;
 const path=new Path2D();
 path.moveTo(ax+nx*root,ay+ny*root);
 path.bezierCurveTo(c1x+nx*root,c1y+ny*root,c2x+nx*middle,c2y+ny*middle,tx+nx*nose,ty+ny*nose);
 path.bezierCurveTo(tx+dx*.20/L*nose+nx*nose,ty+dy*.20/L*nose+ny*nose,tx+dx/L*nose,ty+dy/L*nose,tx+dx/L*nose,ty+dy/L*nose);
 path.arc(tx,ty,nose,Math.atan2(dy,dx)-Math.PI/2,Math.atan2(dy,dx)+Math.PI/2,false);
 path.bezierCurveTo(tx-nx*nose,ty-ny*nose,c2x-nx*middle,c2y-ny*middle,c1x-nx*root,c1y-ny*root);
 path.bezierCurveTo(ax+dx*.11-nx*root,ay+dy*.11-ny*root,ax-nx*root,ay-ny*root,ax+nx*root,ay+ny*root);
 path.closePath();
 return {p:path,nx,ny,nose,root,middle,c1x,c1y,c2x,c2y,L};
}
function drawLiquid(d,index,amp,src){
 const a=origin;if(!a)return 0;
 const ax=a.x,ay=clamp(a.y+d.offset,12,H-12),tx=d.x,ty=d.y;
 const distance=Math.hypot(tx-ax,ty-ay);
 if(distance<2||amp<.015)return 0;
 const width=d.radius*amp*(mode==="a"?1.6:mode==="b"?1.06:1.16);
 const twist=Math.sin(phase*1.07+d.phase)*(mode==="c"?71:mode==="a"?25:48)*amp;
 const pp=pathRibbon(d,ax,ay,tx,ty,width,twist);
 const base=palette[index%palette.length].map(x=>clamp(x,0,255));
 const bright=shine(base,.52),dark=deep(base,.42);
 ctx.save();
 ctx.shadowColor=rgb(base,.66*amp);
 ctx.shadowBlur=23*amp;
 ctx.shadowOffsetY=6;
 ctx.fillStyle=rgb(base,.38*amp);
 ctx.fill(pp.p);
 ctx.restore();
 // Moving frames from the REAL original video are clipped to the shape.
 ctx.save();
 ctx.clip(pp.p);
 if(src){ctx.globalAlpha=.82;paintFrame(src);ctx.globalAlpha=1;}
 const longitudinal=ctx.createLinearGradient(ax,ay,tx,ty);
 longitudinal.addColorStop(0,rgb(dark,.80));
 longitudinal.addColorStop(.25,rgb(base,.64));
 longitudinal.addColorStop(.53,rgb(bright,.24));
 longitudinal.addColorStop(.81,rgb(base,.48));
 longitudinal.addColorStop(1,rgb(bright,.76));
 ctx.fillStyle=longitudinal;ctx.fill(pp.p);
 // Cylindrical specular refraction gives volume rather than a flat glow.
 const across=ctx.createLinearGradient(
   ax+pp.nx*width*1.4,ay+pp.ny*width*1.4,
   ax-pp.nx*width*1.4,ay-pp.ny*width*1.4);
 across.addColorStop(0,"rgba(255,255,255,.70)");
 across.addColorStop(.12,"rgba(255,255,255,.21)");
 across.addColorStop(.28,"rgba(255,255,255,.02)");
 across.addColorStop(.53,"rgba(6,9,38,.10)");
 across.addColorStop(.77,"rgba(6,8,39,.42)");
 across.addColorStop(.94,"rgba(255,255,255,.42)");
 across.addColorStop(1,"rgba(255,255,255,.56)");
 ctx.fillStyle=across;ctx.fill(pp.p);
 ctx.restore();
 ctx.save();
 ctx.strokeStyle="rgba(250,251,255,"+(amp*.84)+")";
 ctx.lineWidth=1.7;
 ctx.shadowColor=rgb(bright,.76);ctx.shadowBlur=12;
 ctx.stroke(pp.p);
 ctx.restore();
 // A bright ridge follows the curved, elastic core.
 ctx.save();
 ctx.beginPath();
 ctx.moveTo(ax+pp.nx*width*.62,ay+pp.ny*width*.62);
 ctx.bezierCurveTo(
   pp.c1x+pp.nx*width*.73,pp.c1y+pp.ny*width*.73,
   pp.c2x+pp.nx*width*.42,pp.c2y+pp.ny*width*.42,
   tx+pp.nx*pp.nose*.30,ty+pp.ny*pp.nose*.30);
 ctx.strokeStyle="rgba(255,255,255,"+(.26+.34*amp)+")";
 ctx.lineWidth=clamp(width*.075,1.8,5.4);
 ctx.lineCap="round";ctx.stroke();
 ctx.restore();
 if(mode!=="c" || index%2===0){
  const rad=clamp(pp.nose,5,42);
  const hi=ctx.createRadialGradient(tx-rad*.32,ty-rad*.37,0,tx,ty,rad);
  hi.addColorStop(0,"rgba(255,255,255,.96)");
  hi.addColorStop(.22,rgb(bright,.94));
  hi.addColorStop(.61,rgb(base,.92));
  hi.addColorStop(.90,rgb(dark,.84));
  hi.addColorStop(1,rgb(bright,.14));
  ctx.beginPath();ctx.ellipse(tx,ty,rad,rad*(mode==="b"?1.12:.87),twist*.008,0,Math.PI*2);
  ctx.fillStyle=hi;ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.53)";
  ctx.lineWidth=1.2;ctx.stroke();
 }
 // Tiny connected droplets. They retract with the parent liquid.
 if(mode==="b"&&distance>85){
  for(let n=0;n<2;n++){
   const t=.57+n*.21;
   const x=ax+(tx-ax)*t+pp.nx*width*(1.22+n*.4);
   const y=ay+(ty-ay)*t+pp.ny*width*(1.22+n*.4);
   const rad=clamp(width*(n===0?.20:.12),3,14);
   const grad=ctx.createRadialGradient(x-rad*.35,y-rad*.37,0,x,y,rad);
   grad.addColorStop(0,"rgba(255,255,255,.89)");
   grad.addColorStop(.35,rgb(bright,.92));
   grad.addColorStop(1,rgb(base,.28));
   ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();
  }
 }
 return distance;
}
// No separate luminous cursor or radial color disturbance.
// The only effect is liquid physically extruded from the video portal.
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
  const distance=(mode==="a"?235:mode==="b"?320:315)*d.stretch*intensity;
  const outward=inside?a.side*distance:0;
  const spread=mode==="a"?22:mode==="b"?63:99;
  const targetX=a.x+outward;
  const targetY=clamp(a.y+d.offset+(inside?Math.sin(phase*1.62+d.phase)*spread*.65:0),5,H-5);
  const springiness=mode==="a"?.11:mode==="b"?.18:.125;
  const friction=mode==="a"?.82:mode==="b"?.77:.83;
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
 canvas.dataset.liquidVariant="video-textured-sculpture-v2";
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