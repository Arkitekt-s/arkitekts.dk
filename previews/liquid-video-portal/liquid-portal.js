/* LIQUID PORTAL CONCEPT — preview only, never loaded by the public homepage.
 * Every fluid ribbon is a clipped part of the SAME playing video.
 * The moving video's actual pixels supply the fluid texture and color.
 * Spring forces pull each tendril back into the original arch.
 */
(() => {
"use strict";
const stage=document.getElementById("frame");
const mask=document.getElementById("live-arch-morph-path");
const video=document.getElementById("arch-morph-video");
const poster=document.getElementById("arch-morph-poster");
const demo=document.getElementById("liquid-demo");
const strengthControl=document.getElementById("liquid-strength");
const strengthValue=document.getElementById("liquid-strength-value");
const status=document.getElementById("liquid-preview-status");
if(!stage || !mask || !video || !poster)return;
document.body.classList.add("liquid-portal-preview");
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const canvas=document.createElement("canvas");
canvas.id="liquid-splash-canvas";
canvas.className="liquid-splash-canvas";
canvas.setAttribute("aria-hidden","true");
stage.append(canvas);
const ctx=canvas.getContext("2d",{alpha:true,desynchronized:true});
if(!ctx)return;
const probe=document.createElement("canvas");probe.width=48;probe.height=32;
const probeCtx=probe.getContext("2d",{willReadFrequently:true});
let w=0,h=0,dpr=1;
let pointer={x:-1e4,y:-1e4},hasPointer=false;
let demoStart=0,demoActive=false,started=0,raf=0,last=0;
let active=false,energy=0,color=[145,180,255],sourceName="poster";
let lastProbe=0,swirlPhase=0;
let anchor={x:0,y:0,side:1,cx:0,cy:0,w:100,h:100},anchorValid=false;
let ribbons=[];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const spring=(s,target,dt,force=.14,drag=.76)=>{
  s.v=(s.v+(target-s.p)*force*dt)*Math.pow(drag,dt);
  s.p+=s.v*dt;return s.p;
};
function newSpring(v){return {p:v,v:0}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function rgba(rgb,a,boost=0){
 const c=rgb.map(v=>clamp(Math.round(v+boost),0,255));
 return "rgba("+c.join(",")+","+a+")";
}
function resize(){
 const r=stage.getBoundingClientRect();
 w=r.width;h=r.height;
 dpr=Math.min(devicePixelRatio||1,1.6);
 canvas.width=Math.max(1,Math.round(w*dpr));
 canvas.height=Math.max(1,Math.round(h*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
new ResizeObserver(resize).observe(stage);
resize();
function archGeometry(px,py){
 const sr=stage.getBoundingClientRect();
 const a=[...document.querySelectorAll("#panorama .arch")];
 // Source arch edges are exactly the same boxes used to create the live mask.
 let selected=null;
 for(const el of a){
   const b=el.getBoundingClientRect();
   const bx=b.left-sr.left,by=b.top-sr.top;
   if(px<bx-18||px>bx+b.width+18||py<by-12||py>by+b.height+12)continue;
   if(!selected || Math.abs(px-(bx+b.width/2))<Math.abs(px-selected.cx))
     selected={left:bx,right:bx+b.width,top:by,bottom:by+b.height,cx:bx+b.width/2,cy:by+b.height/2,width:b.width,height:b.height};
 }
 if(!selected)return null;
 const side=px<selected.cx?-1:1;
 const ax=side<0?selected.left:selected.right;
 const ay=clamp(py,selected.top+selected.height*.19,selected.bottom-selected.height*.14);
 return {x:ax,y:ay,side,cx:selected.cx,cy:selected.cy,w:selected.width,h:selected.height};
}
function getShape(){
 try{return new Path2D(mask.getAttribute("d")||"")}catch{return null}
}
function insideArch(shape,x,y){
 return !!shape && ctx.isPointInPath(shape,x,y);
}
function sampleLiveColor(time){
 if(!probeCtx||time-lastProbe<135)return;
 lastProbe=time;
 const src=video.readyState>=2&&video.videoWidth?video:poster;
 if(!src || (src===poster && !poster.naturalWidth))return;
 try{
   probeCtx.clearRect(0,0,48,32);
   probeCtx.drawImage(src,0,0,48,32);
   const u=clamp(pointer.x/w,0,1),v=clamp(pointer.y/h,0,1);
   const px=clamp(Math.floor(u*47),0,47),py=clamp(Math.floor(v*31),0,31);
   const raw=probeCtx.getImageData(Math.max(0,px-1),Math.max(0,py-1),3,3).data;
   let rr=0,gg=0,bb=0,k=0;
   for(let i=0;i<raw.length;i+=4){rr+=raw[i];gg+=raw[i+1];bb+=raw[i+2];k++}
   // Tone-map only the shine; ribbon texture remains 100% original film.
   color=[rr/k,gg/k,bb/k];
   sourceName=src===video?"playing-video":"poster";
 }catch{sourceName="unreadable-video";} // if another cross-origin clip is selected
}
function buildRibbons(a){
 const variations=[{offset:-37,length:1.05,thick:32,phase:.1},
   {offset:3,length:1.26,thick:42,phase:1.4},
   {offset:44,length:.87,thick:27,phase:2.6},
   {offset:82,length:.59,thick:19,phase:4}];
 ribbons=variations.map((v,i)=>{
  const rootX=a.x,rootY=clamp(a.y+v.offset,0,h);
  return {...v,index:i,rootX:newSpring(rootX),rootY:newSpring(rootY),
   tipX:newSpring(rootX),tipY:newSpring(rootY),thickness:newSpring(0)};
 });
 anchorValid=true;
}
function liquidOutline(ax,ay,tx,ty,width,phase){
 const dx=tx-ax,dy=ty-ay,len=Math.hypot(dx,dy)||1;
 const nx=-dy/len,ny=dx/len;
 const wobble=Math.sin(swirlPhase*1.9+phase)*Math.min(24,len*.20);
 const cx=lerp(ax,tx,.43)+nx*wobble,cy=lerp(ay,ty,.43)+ny*wobble;
 const startWidth=width*.8,midWidth=width*1.02,headWidth=Math.min(width*.83,Math.max(5,len*.25));
 const p=new Path2D();
 p.moveTo(ax+nx*startWidth,ay+ny*startWidth);
 p.bezierCurveTo(lerp(ax,cx,.65)+nx*midWidth,lerp(ay,cy,.65)+ny*midWidth,
  lerp(cx,tx,.54)+nx*(headWidth*.95),lerp(cy,ty,.54)+ny*(headWidth*.95),
  tx+nx*headWidth,ty+ny*headWidth);
 p.bezierCurveTo(tx+nx*headWidth*.75+dx*.12,ty+ny*headWidth*.75+dy*.12,
  tx-nx*headWidth*.75+dx*.12,ty-ny*headWidth*.75+dy*.12,
  tx-nx*headWidth,ty-ny*headWidth);
 p.bezierCurveTo(lerp(cx,tx,.55)-nx*(headWidth*.95),lerp(cy,ty,.55)-ny*(headWidth*.95),
  lerp(ax,cx,.65)-nx*midWidth,lerp(ay,cy,.65)-ny*midWidth,
  ax-nx*startWidth,ay-ny*startWidth);
 p.closePath();
 return {p,cx,cy,nx,ny,len,width};
}
function coverImage(src){
 const sw=src.videoWidth||src.naturalWidth,sh=src.videoHeight||src.naturalHeight;
 if(!sw||!sh)return false;
 const scale=Math.max(w/sw,h/sh);
 const cropW=w/scale,cropH=h/scale;
 // Same object-fit:cover as the original hero video; never a substitute image.
 ctx.drawImage(src,(sw-cropW)/2,(sh-cropH)/2,cropW,cropH,0,0,w,h);
 return true;
}
function drawRibbons(source){
 let widthTotal=0;
 for(const r of ribbons){
  const ax=r.rootX.p,ay=r.rootY.p,tx=r.tipX.p,ty=r.tipY.p;
  const length=Math.hypot(tx-ax,ty-ay);
  if(length<2.2||r.thickness.p<1.4)continue;
  widthTotal+=length;
  const o=liquidOutline(ax,ay,tx,ty,r.thickness.p,r.phase);
  ctx.save();
  ctx.clip(o.p);
  ctx.globalAlpha=.96;
  if(source)coverImage(source);
  // Color is lifted from the current film frame near the cursor.
  const bright=[clamp(color[0]*1.5+45,0,255),clamp(color[1]*1.55+36,0,255),clamp(color[2]*1.55+48,0,255)];
  const g=ctx.createLinearGradient(ax,ay,tx,ty);
  g.addColorStop(0,rgba(color,.38,40));
  g.addColorStop(.48,rgba(bright,.47));
  g.addColorStop(1,rgba(bright,.55));
  ctx.globalCompositeOperation="screen";
  ctx.fillStyle=g;ctx.fill(o.p);
  ctx.restore();
  // Cartoon-liquid specular highlight, attached to the same actual paint flow.
  ctx.save();
  const rim=ctx.createLinearGradient(ax,ay,tx,ty);
  rim.addColorStop(0,"rgba(255,255,255,.06)");
  rim.addColorStop(.35,rgba(bright,.68));
  rim.addColorStop(1,"rgba(255,255,255,.83)");
  ctx.strokeStyle=rim;
  ctx.lineWidth=1.5+(r.thickness.p*.024);
  ctx.lineJoin="round";
  ctx.shadowColor=rgba(bright,.52);ctx.shadowBlur=12;
  ctx.stroke(o.p);
  ctx.restore();
  // Shiny tip is still connected to its ribbon, not a decorative particle.
  const radius=clamp(r.thickness.p*.52,3,27);
  const gloss=ctx.createRadialGradient(tx-radius*.25,ty-radius*.35,0,tx,ty,radius);
  gloss.addColorStop(0,"rgba(255,255,255,.77)");
  gloss.addColorStop(.34,rgba(bright,.86));
  gloss.addColorStop(.77,rgba(color,.57,55));
  gloss.addColorStop(1,"rgba(255,255,255,.0)");
  ctx.beginPath();ctx.arc(tx,ty,radius,0,Math.PI*2);
  ctx.fillStyle=gloss;ctx.fill();
 }
 return widthTotal;
}
function drawSwirl(source,shape){
 if(energy<.015||!source||!insideArch(shape,pointer.x,pointer.y))return;
 const mx=pointer.x,my=pointer.y,radius=84+energy*34;
 ctx.save();
 ctx.clip(shape);
 ctx.beginPath();ctx.arc(mx,my,radius,0,Math.PI*2);ctx.clip();
 ctx.globalAlpha=.24+energy*.30;
 ctx.translate(mx,my);
 ctx.rotate(swirlPhase*.52);
 ctx.translate(-mx,-my);
 coverImage(source);
 ctx.restore();
 const rgbBright=[clamp(color[0]*1.5+55,0,255),clamp(color[1]*1.5+55,0,255),clamp(color[2]*1.5+55,0,255)];
 ctx.save();ctx.clip(shape);
 for(let i=0;i<3;i++){
   const a=swirlPhase*(i%2?-.72:.86)+(i*Math.PI*2/3);
   ctx.beginPath();
   ctx.arc(mx,my,30+i*23,a,a+(1.6+Math.sin(swirlPhase)*.25));
   ctx.lineCap="round";
   ctx.strokeStyle=rgba(rgbBright,(.29-i*.065)*energy);
   ctx.lineWidth=6-i;
   ctx.shadowColor=rgba(rgbBright,.5*energy);ctx.shadowBlur=11;
   ctx.stroke();
 }
 ctx.restore();
}
function currentSource(){
 if(video.readyState>=2&&video.videoWidth)return video;
 if(poster.complete&&poster.naturalWidth)return poster;
 return null;
}
function step(time){
 raf=0;
 if(!w||!h){schedule();return}
 const dt=last?clamp((time-last)/16.67,.4,2):1;last=time;
 const dtSeconds=dt/60;
 const shape=getShape();
 if(demoActive){
   const elapsed=(time-demoStart)/1000;
   const b=document.querySelector("#panorama .arch:nth-child(2)")?.getBoundingClientRect();
   if(b && elapsed<5.1){
     const sr=stage.getBoundingClientRect();
     pointer.x=b.left-sr.left+b.width*(.6+.25*Math.sin(elapsed*2.4));
     pointer.y=b.top-sr.top+b.height*(.39+.23*Math.sin(elapsed*3.1));
     hasPointer=true;
   }else {demoActive=false;hasPointer=false;}
 }
 const inWindow=hasPointer && Number(document.body.dataset.journeyProgress||0)<.22 &&
  insideArch(shape,pointer.x,pointer.y) && !reduced.matches;
 const oldActive=active;
 active=inWindow;
 let fresh=null;
 if(inWindow){
   fresh=archGeometry(pointer.x,pointer.y);
   if(!fresh)fresh=archGeometry(pointer.x+8,pointer.y);
   if(fresh){
     if(!anchorValid||fresh.side!==anchor.side||Math.abs(fresh.cx-anchor.cx)>fresh.w*.8){
       anchor=fresh;buildRibbons(fresh);
     }
     anchor=fresh;
   }
 }
 const targetEnergy=active?.99:0;
 energy=lerp(energy,targetEnergy,1-Math.exp(-dtSeconds/(active?.18:.36)));
 swirlPhase+=dtSeconds*(active?3.1:1.7);
 ctx.clearRect(0,0,w,h);
 const v=currentSource();
 if(active||energy>.03)sampleLiveColor(time);
 const strength=Number(strengthControl?.value||75)/75;
 let motion=0;
 for(const r of ribbons){
   const rootX=anchor.x,rootY=clamp(anchor.y+r.offset,10,h-10);
   spring(r.rootX,rootX,dt,.13,.82);spring(r.rootY,rootY,dt,.11,.79);
   const reach=(88+strength*77)*r.length;
   const tx=active?rootX+anchor.side*reach:rootX;
   const ty=active?rootY+Math.sin(swirlPhase*1.5+r.phase)*18+(pointer.y-anchor.y)*.13:rootY;
   spring(r.tipX,tx,dt,.12,.80);
   spring(r.tipY,ty,dt,.10,.80);
   spring(r.thickness,active?r.thick*strength:0,dt,.11,.79);
   motion+=Math.abs(r.tipX.p-rootX)+Math.abs(r.tipX.v)+Math.abs(r.thickness.p);
 }
 drawSwirl(v,shape);
 const ribbonExtent=drawRibbons(v);
 if(active!==oldActive){
   document.body.dataset.liquidActive=String(active);
   status.textContent=active?"VIDEO COLORS ESCAPING":"LIQUID RETURNING TO ARCH";
 }
 const stats={active,extent:Math.round(ribbonExtent),energy:+energy.toFixed(3),
   source:sourceName,color:color.map(x=>Math.round(x)).join(","),playing:!video.paused};
 canvas.dataset.liquidActive=String(stats.active);
 canvas.dataset.liquidExtent=String(stats.extent);
 canvas.dataset.sampleSource=stats.source;
 canvas.dataset.sampleRgb=stats.color;
 canvas.dataset.videoPlaying=String(stats.playing);
 if(!active && energy<.012 && motion<4){
   ctx.clearRect(0,0,w,h);
   canvas.dataset.liquidExtent="0";
   status.textContent="RESET · VIDEO KEEPS PLAYING";
   last=0;return;
 }
 schedule();
}
function schedule(){if(!raf)raf=requestAnimationFrame(step)}
function recordPointer(e){
 if(e.pointerType!=="mouse"&&e.pointerType!=="pen"&&e.pointerType!=="touch")return;
 if(demoActive){demoActive=false}
 const rect=stage.getBoundingClientRect();
 pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;
 hasPointer=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
 if(e.target instanceof Element&&e.target.closest(".liquid-preview-panel,.site-header,.portal-navigation,.site-footer"))hasPointer=false;
 schedule();
}
addEventListener("pointermove",recordPointer,{passive:true});
stage.addEventListener("pointerdown",e=>{if(e.pointerType==="touch"){recordPointer(e);schedule()}},{passive:true});
addEventListener("pointerup",e=>{if(e.pointerType==="touch"){hasPointer=false;schedule()}},{passive:true});
document.addEventListener("mouseout",e=>{if(!e.relatedTarget){hasPointer=false;schedule()}},{passive:true});
addEventListener("blur",()=>{hasPointer=false;schedule()});
document.addEventListener("visibilitychange",()=>{if(document.hidden){hasPointer=false;schedule()}});
strengthControl?.addEventListener("input",()=>{strengthValue.textContent=strengthControl.value+"%";schedule()});
demo?.addEventListener("click",()=>{
 demoActive=true;demoStart=performance.now();anchorValid=false;
 status.textContent="DEMO · VIDEO LIQUID COMING OUT";schedule();
});
reduced.addEventListener("change",()=>{hasPointer=false;schedule()});
video.addEventListener("playing",()=>{canvas.dataset.originalVideoPlaying="true"});
canvas.dataset.originalVideoPlaying=String(!video.paused);
canvas.dataset.sampleSource="waiting-for-video";
canvas.dataset.liquidActive="false";
canvas.dataset.liquidExtent="0";
})();
