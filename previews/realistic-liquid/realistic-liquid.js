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
let rgba=[150,170,190],videoSample="waiting",paintable=null,readable=true;
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
function paintFrame(src){const sw=src.videoWidth||src.naturalWidth,sh=src.videoHeight||src.naturalHeight;if(!sw||!sh)return false;
 const k=Math.max(W/sw,H/sh);const cropW=W/k,cropH=H/k;
 try{ctx.drawImage(src,(sw-cropW)/2,(sh-cropH)/2,cropW,cropH,0,0,W,H);return true}catch{return false}}
function sample(t){
 if(t-(sample.last||0)<95)return;sample.last=t;const s=source();if(!s)return;
 try{
  pc.drawImage(s,0,0,40,30);
  let x=Math.floor(clamp(pointer.x/W,0,1)*39),y=Math.floor(clamp(pointer.y/H,0,1)*29);
  const data=pc.getImageData(Math.max(0,x-1),Math.max(0,y-1),3,3).data;let a=[0,0,0];
  for(let i=0;i<data.length;i+=4){a[0]+=data[i];a[1]+=data[i+1];a[2]+=data[i+2]}
  rgba=a.map(v=>v/9);readable=true;videoSample=s===video?"playing-video":"poster";
 }catch{readable=false;videoSample="cross-origin-source";}
}
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
function createDrop(i,anchor){
 const seed=i*2.399963229728653;
 return {start:seed,x:anchor.x,y:anchor.y,vx:0,vy:0,
  radius:14+(i%5)*3.7,offset:(i-(mode==="c"?5:7))*12,
  phase:seed,stretch:.6+((i*7)%11)/10};
}
function setup(g){
 origin=g;
 const count=mode==="a"?7:mode==="b"?16:11;
 drops=Array.from({length:count},(_,i)=>createDrop(i,g));
}
function pathRibbon(d,ax,ay,tx,ty,r,twist){
 const dx=tx-ax,dy=ty-ay,L=Math.hypot(dx,dy)+.001,nx=-dy/L,ny=dx/L;
 const midX=mix(ax,tx,.48)+nx*twist,midY=mix(ay,ty,.48)+ny*twist;
 const rr=r,head=r*(mode==="a"?1.08:mode==="b"?.56:.28);
 const p=new Path2D();p.moveTo(ax+nx*rr*.65,ay+ny*rr*.65);
 p.bezierCurveTo(midX+nx*r*1.25,midY+ny*r*1.25,tx+nx*head*.8,ty+ny*head*.8,tx+nx*head,ty+ny*head);
 p.bezierCurveTo(tx+dx*.12+nx*head,ty+dy*.12+ny*head,tx+dx*.14-nx*head,ty+dy*.14-ny*head,tx-nx*head,ty-ny*head);
 p.bezierCurveTo(tx-nx*r*.8,ty-ny*r*.8,midX-nx*r*1.22,midY-ny*r*1.22,ax-nx*rr*.65,ay-ny*rr*.65);p.closePath();
 return {p,head,nx,ny,midX,midY};
}
function drawLiquid(d,amp,src){
 const a=origin;if(!a)return 0;
 const ax=a.x,ay=clamp(a.y+d.offset,10,H-10),tx=d.x,ty=d.y;
 const dist=Math.hypot(tx-ax,ty-ay);if(dist<1.5||amp<.009)return 0;
 const width=d.radius*amp*(mode==="a"?1.2:mode==="b"?.85:.42);
 const twist=Math.sin(phase*1.95+d.phase)*(mode==="c"?30:mode==="a"?11:23)*amp;
 const pp=pathRibbon(d,ax,ay,tx,ty,width,twist);
 ctx.save();ctx.clip(pp.p);
 if(src)paintFrame(src);
 const light=rgba.map(v=>Math.round(clamp(v*1.55+55,0,255)));
 // Viscous surface and depth: film texture underneath, not arbitrary colored shapes.
 const gradient=ctx.createLinearGradient(ax,ay,tx,ty);
 gradient.addColorStop(0,'rgba('+rgba.map(Math.round).join(",")+',.58)');
 gradient.addColorStop(.43,'rgba('+light.join(",")+',.33)');
 gradient.addColorStop(.78,'rgba('+rgba.map(Math.round).join(",")+',.67)');
 gradient.addColorStop(1,'rgba('+light.join(",")+',.88)');
 ctx.fillStyle=gradient;ctx.fill(pp.p);ctx.restore();
 ctx.save();ctx.strokeStyle="rgba(235,255,255,"+(.18+amp*.58)+")";
 ctx.lineWidth=clamp(width*.068,.8,2.9);ctx.shadowColor="rgba("+light.join(",")+",.6)";ctx.shadowBlur=mode==="b"?16:9;
 ctx.stroke(pp.p);ctx.restore();
 if(mode!=="c"){
  const tip=clamp(width*(mode==="b"?1.32:.8),3,31);
  const grad=ctx.createRadialGradient(tx-tip*.3,ty-tip*.35,0,tx,ty,tip);
  grad.addColorStop(0,"rgba(255,255,255,.87)");
  grad.addColorStop(.3,"rgba("+light.join(",")+",.77)");
  grad.addColorStop(.7,"rgba("+rgba.map(Math.round).join(",")+",.83)");
  grad.addColorStop(1,"rgba("+rgba.map(Math.round).join(",")+",0)");
  ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(tx,ty,tip,tip*(mode==="b"?1.2:.85),phase*.2,0,Math.PI*2);ctx.fill();
 }
 if(mode==="c"){
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(pp.midX,pp.midY,tx,ty);
  ctx.lineWidth=Math.max(1,width*.31);ctx.strokeStyle="rgba(255,255,255,"+(.16+amp*.44)+")";ctx.stroke();
 }
 return dist;
}
function drawVortex(src){
 if(force<.02||!archContains(pointer))return;
 ctx.save();ctx.clip(new Path2D(mask.getAttribute("d")));
 const x=pointer.x,y=pointer.y;
 const radius=mode==="a"?68:mode==="b"?124:102;
 ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.clip();
 ctx.globalAlpha=.23*force;ctx.translate(x,y);ctx.rotate(phase*(mode==="c"?.75:1.25));ctx.translate(-x,-y);
 if(src)paintFrame(src);ctx.restore();
}
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
  origin=g;sample(t);
 }
 const intensity=Number(slider?.value||75)/75;
 const src=source();
 ctx.clearRect(0,0,W,H);
 drawVortex(src);
 let sum=0,velocity=0;
 for(const d of drops){
  if(!origin)continue;
  const a=origin;
  const distance=(mode==="a"?112:mode==="b"?210:172)*d.stretch*intensity;
  const outward=inside?a.side*distance:0;
  const spread=mode==="a"?18:mode==="b"?88:110;
  const targetX=a.x+outward;
  const targetY=clamp(a.y+d.offset+ (inside?Math.sin(phase*2+d.phase)*spread*.32:0),5,H-5);
  const springiness=mode==="a"?.14:mode==="b"?.18:.12;
  const friction=mode==="a"?.78:mode==="b"?.75:.81;
  d.vx=(d.vx+(targetX-d.x)*springiness*dt)*Math.pow(friction,dt);
  d.vy=(d.vy+(targetY-d.y)*(springiness*.72)*dt)*Math.pow(friction,dt);
  d.x+=d.vx*dt;d.y+=d.vy*dt;
  velocity+=Math.abs(d.vx)+Math.abs(d.vy);
  sum+=drawLiquid(d,force,src);
 }
 canvas.dataset.liquidActive=String(inside);
 canvas.dataset.liquidExtent=String(Math.round(sum));
 canvas.dataset.sampleSource=videoSample;
 canvas.dataset.sampleRgb=rgba.map(Math.round).join(",");
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