/* Live Option A: physically unfold three cinematic arch windows into one
 * continuously moving film. No crossfade, second film, or video-resize cut.
 * Uses the original five-chapter scroll engine and existing random clip
 * selection / press-and-hold video chooser.
 */
(()=>{
"use strict";
const stage=document.getElementById("frame");
const panorama=document.getElementById("panorama");
const arches=[...document.querySelectorAll("#panorama .arch")];
if(!stage||!panorama||arches.length!==3)return;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const clips=[
  {url:"https://videos.pexels.com/video-files/18069232/18069232-uhd_2560_1440_24fps.mp4",
   poster:"https://images.pexels.com/videos/18069232/ai-ai-tool-artificial-intelligence-assistive-technology-18069232.jpeg?auto=compress&w=1600"},
  {url:"https://videos.pexels.com/video-files/25744122/11904079_1920_1080_30fps.mp4",
   poster:"https://images.pexels.com/videos/25744122/pexels-photo-25744122.jpeg?auto=compress&w=1600"},
  {url:"https://videos.pexels.com/video-files/18069165/18069165-uhd_2160_2160_24fps.mp4",
   poster:"https://images.pexels.com/videos/18069165/ai-ai-art-artificial-intelligence-computer-18069165.jpeg?auto=compress&w=1600"}
];
const ns="http://www.w3.org/2000/svg",svgEl=name=>document.createElementNS(ns,name);
const defs=svgEl("svg");
defs.classList.add("arch-morph-mask-defs");
defs.setAttribute("aria-hidden","true");
const clip=svgEl("clipPath");
clip.setAttribute("id","live-arch-morph-mask");
clip.setAttribute("clipPathUnits","userSpaceOnUse");
const path=svgEl("path");
path.setAttribute("id","live-arch-morph-path");
clip.append(path);defs.append(clip);
const layer=document.createElement("div");
layer.className="arch-morph-media";
layer.id="arch-morph-media";
layer.setAttribute("aria-hidden","true");
const poster=document.createElement("img");
poster.id="arch-morph-poster";poster.alt="";poster.decoding="async";
const film=document.createElement("video");
film.id="arch-morph-video";
film.muted=true;film.loop=true;film.playsInline=true;
film.setAttribute("playsinline","");
film.setAttribute("webkit-playsinline","");
film.setAttribute("disablepictureinpicture","");
film.preload="metadata";film.setAttribute("aria-hidden","true");
film.playbackRate=.50;
const lens=document.createElement("span");
lens.className="arch-morph-lens";
lens.id="arch-morph-lens";
lens.setAttribute("aria-hidden","true");
layer.append(poster,film,lens);
const edges=svgEl("svg");edges.classList.add("arch-morph-outline");
edges.setAttribute("aria-hidden","true");
edges.setAttribute("preserveAspectRatio","none");
const outline=svgEl("path");outline.id="arch-morph-outline-path";
edges.append(outline);
stage.insertBefore(defs,panorama);
stage.insertBefore(layer,panorama.nextSibling);
stage.insertBefore(edges,layer.nextSibling);
// <base> points to legacy assets. Resolve the SVG mask against the actual
// document URL (not the <base> path) to work in Safari and GitHub Pages.
const localMask=location.href.split("#")[0]+"#live-arch-morph-mask";
layer.style.clipPath='url("'+localMask+'")';
layer.style.webkitClipPath='url("'+localMask+'")';

const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const lerp=(a,b,t)=>a+(b-a)*t;
const n=x=>Math.round(x*100)/100;
// Restore the original elastic-arch spring physics on the actual visible
// SVG video mask. Unlike the retired (hidden) panorama, this deforms the
// real video openings rather than an invisible copy.
const hoverFine=matchMedia("(hover: hover) and (pointer: fine)");
const clampV=(v,min,max)=>Math.max(min,Math.min(max,v));
const CURVE_STEPS=48,SIDE_STEPS=18;
const springs=[[],[],[]];
let pointerX=-10000,pointerY=-10000,tracking=false;
let pointerFrame=0,lastPointerTick=0,positionNow=0;
let glassOpacity=0,glassX=-10000,glassY=-10000;
let morphRects=[];
function active(){
 return hoverFine.matches && !reduced.matches &&
  !document.body.classList.contains("motion-off") &&
  !document.hidden && positionNow<.30 &&
  Number(document.body.dataset.currentFrame||1)===1;
}
function pointsFor(x,y,w,bottom,curve){
 const points=[];
 const left=x,right=x+w,radius=Math.max(0,curve);
 for(let j=0;j<=CURVE_STEPS;j++){
  const u=j/CURVE_STEPS,z=u*2-1;
  const arcY=y+radius*(1-Math.sqrt(Math.max(0,1-z*z)));
  const slope=z/Math.sqrt(Math.max(.001,1-z*z));
  const sx=slope*radius*2/Math.max(1,w);
  const inv=1/Math.hypot(sx,1);
  points.push({x:left+w*u,y:arcY,nx:sx*inv,ny:-inv});
 }
 for(let j=1;j<=SIDE_STEPS;j++){
  const u=j/SIDE_STEPS;
  points.push({x:right,y:y+radius+(bottom-y-radius)*u,nx:1,ny:0});
 }
 points.push({x:left,y:bottom,nx:-1,ny:0});
 for(let j=SIDE_STEPS-1;j>=0;j--){
  const u=j/SIDE_STEPS;
  points.push({x:left,y:y+radius+(bottom-y-radius)*u,nx:-1,ny:0});
 }
 return points;
}
function distorted(points,index,strength){
 const state=springs[index];
 return points.map((v,k)=>{
  if(!state[k])state[k]={d:0,velocity:0};
  const movement=state[k].d*strength;
  return {x:v.x+v.nx*movement,y:v.y+v.ny*movement};
 });
}
function shape(points){
 return points.map((v,i)=>(i?" L":"M")+n(v.x)+","+n(v.y)).join("")+" Z";
}
function insideShape(points,x,y){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const p=points[i],q=points[j];
  if((p.y>y)!==(q.y>y) &&
    x<(q.x-p.x)*(y-p.y)/(q.y-p.y)+p.x)inside=!inside;
 }
 return inside;
}
function requestMouseFrame(){
 if(!pointerFrame)pointerFrame=requestAnimationFrame(tickMouse);
}
function tickMouse(now){
 pointerFrame=0;
 const dt=lastPointerTick?clampV((now-lastPointerTick)/16.67,.55,1.8):1;
 lastPointerTick=now;
 const allow=active();
 const box=stage.getBoundingClientRect();
 const x=pointerX-box.left,y=pointerY-box.top;
 const strength=allow?1-smooth((positionNow-.075)/.24):0;
 let alive=false,hit=false;
 const sections=morphRects;
 for(let i=0;i<3;i++){
  const data=sections[i];
  if(!data)continue;
  for(let k=0;k<data.points.length;k++){
   const v=data.points[k],state=springs[i][k]||(springs[i][k]={d:0,velocity:0});
   const dx=x-v.x,dy=y-v.y;
   const reach=133;
   const influence=Math.exp(-Math.pow(Math.hypot(dx,dy)/reach,2));
   const signed=dx*v.nx+dy*v.ny;
   const amplitude=clampV(signed*.93,-43,43);
   const target=tracking&&allow?amplitude*influence*strength:0;
   state.velocity=(state.velocity+(target-state.d)*.14*dt)*Math.pow(.74,dt);
   state.d+=state.velocity*dt;
   if(Math.abs(target-state.d)>.07||Math.abs(state.velocity)>.055)alive=true;
   else{state.d=target;state.velocity=0}
  }
  if(allow && tracking && insideShape(distorted(data.points,i,strength),x,y))hit=true;
 }
 const glassTarget=hit?1:0;
 const ease=1-Math.exp(-dt*16.67/(hit?110:220));
 const previous=glassOpacity;
 glassOpacity+=(glassTarget-glassOpacity)*ease;
 if(Math.abs(glassTarget-glassOpacity)<.003)glassOpacity=glassTarget;
 if(hit){
  if(glassX<0||glassY<0){glassX=x;glassY=y}
  else{
   const smoothFollow=1-Math.exp(-dt*16.67/42);
   glassX+=(x-glassX)*smoothFollow;
   glassY+=(y-glassY)*smoothFollow;
  }
  if(Math.hypot(glassX-x,glassY-y)>.09)alive=true;
 }
 lens.style.opacity=glassOpacity.toFixed(3);
 lens.style.visibility=glassOpacity>.003?"visible":"hidden";
 if(glassOpacity>.003){
  lens.style.setProperty("--lens-x",n(glassX)+"px");
  lens.style.setProperty("--lens-y",n(glassY)+"px");
 }else{glassX=glassY=-10000}
 document.body.dataset.archGlassInside=hit?"true":"false";
 // Request a redraw directly from the morph's current progress. The
 // scroll controller still owns the 01–02 expansion; no CSS transitions.
 if(window.__arkitektsMorph)paint(positionNow);
 if(alive||Math.abs(glassTarget-glassOpacity)>.003||
    Math.abs(previous-glassOpacity)>.003)requestMouseFrame();
 else lastPointerTick=0;
}
if(hoverFine.matches){
 addEventListener("pointermove",event=>{
  if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
  tracking=!(event.target instanceof Element && event.target.closest(
   ".site-header,.site-footer,.portal-navigation,#twenty-hotspot,.gallery-viewport,#globe-shell,#journey-scrollbar"));
  pointerX=event.clientX;pointerY=event.clientY;
  requestMouseFrame();
 },{passive:true});
 document.addEventListener("mouseout",event=>{
  if(!event.relatedTarget){tracking=false;requestMouseFrame();}
 },{passive:true});
 addEventListener("blur",()=>{tracking=false;requestMouseFrame()});
 addEventListener("resize",()=>{tracking=false;requestMouseFrame()},{passive:true});
 reduced.addEventListener("change",()=>{tracking=false;requestMouseFrame()});
 document.addEventListener("visibilitychange",()=>{tracking=false;requestMouseFrame()});
 document.getElementById("motion-button")?.addEventListener("click",()=>{
  tracking=false;queueMicrotask(requestMouseFrame);
 });
}

let initialRects=[],viewWidth=innerWidth,viewHeight=innerHeight;
function measure(){
 // The entry silhouettes are actual visible arch rectangles. The mask opens
 // from those precise pixel positions, not from a second guessed layout.
 initialRects=arches.map(a=>{
  const r=a.getBoundingClientRect();
  return {x:r.left,y:r.top,w:r.width,bottom:r.bottom};
 });
 viewWidth=innerWidth;viewHeight=innerHeight;
}
let chosen=-1,failedVersion=0,lastPlay=false;
function pauseLegacy(){
 for(const v of [...document.querySelectorAll("#panorama .arch-video"),
  document.getElementById("portal-film"),document.getElementById("hold-scene-film")]){
   if(v) v.pause();
 }
}
function playback(){
 const progress=Number(document.body.dataset.journeyProgress||0);
 const shouldPlay=!document.hidden&&!reduced.matches&&
  !document.body.classList.contains("motion-off")&&progress<2.82;
 if(shouldPlay!==lastPlay){
   lastPlay=shouldPlay;
   if(shouldPlay){film.play().catch(()=>{});}
   else film.pause();
 }
}
function choose(id){
 id=Math.max(0,Math.min(clips.length-1,Number(id)||0));
 if(id===chosen)return;
 chosen=id;
 const version=++failedVersion;
 const source=clips[id];
 film.classList.remove("is-ready");
 poster.src=source.poster;
 film.pause();lastPlay=false;
 film.poster=source.poster;
 film.src=source.url;film.load();
 film.playbackRate=.50;
 document.body.dataset.archMorphScene=String(id);
 playback();pauseLegacy();
 // If video delivery is blocked, poster is still clipped and visible.
 film.addEventListener("error",()=>{if(version===failedVersion)film.classList.remove("is-ready")},{once:true});
}
film.addEventListener("loadeddata",()=>{
 film.playbackRate=.50;film.classList.add("is-ready");playback();
});
film.addEventListener("playing",()=>{film.playbackRate=.50});
document.addEventListener("homepage-film-changed",e=>choose(e.detail?.scene));
document.addEventListener("visibilitychange",playback);
reduced.addEventListener("change",playback);
document.getElementById("motion-button")?.addEventListener("click",()=>{
 // The normal pause controller runs in the same click event. Read the updated
 // motion-off class on the next microtask.
 queueMicrotask(playback);
});
const id=Number(document.documentElement.dataset.initialHomepageFilm);
measure();
document.body.dataset.archMorphEnabled="true";
choose(Number.isInteger(id)&&id>=0&&id<=2?id:0);
let lastW=innerWidth,lastH=innerHeight;
function paint(position){
 if(!initialRects.length)return;
 if(innerWidth!==lastW||innerHeight!==lastH){
   // On a resized initial chapter, read the new natural silhouette.
   // Mid-journey resizes scale the cached opening coordinates.
   if(position<.025)measure();
   lastW=innerWidth;lastH=innerHeight;
 }
 const box=stage.getBoundingClientRect();
 const W=box.width,H=box.height;
 if(W<1||H<1)return;
 positionNow=position;
 const t=smooth((Math.min(1,position)-.045)/.91);
 const distortStrength=active()?1-smooth((positionNow-.075)/.24):0;
 const d=initialRects.map((r,i)=>{
   const sx=innerWidth/viewWidth,sy=innerHeight/viewHeight;
   const x0=r.x*sx-box.left,y0=r.y*sy-box.top,
     w0=r.w*sx,b0=r.bottom*sy-box.top;
   const center=lerp(x0+w0/2,W*(i+.5)/3,t);
   const width=lerp(w0,W/3+6,t);
   const top=lerp(y0,-12,t);
   const bottom=lerp(b0,H+12,t);
   const curve=lerp(w0*.42,0,smooth((t-.67)/.33));
   const vertices=pointsFor(center-width/2,top,width,bottom,curve);
   morphRects[i]={points:vertices};
   return shape(distorted(vertices,i,distortStrength));
 }).join(" ");
 path.setAttribute("d",d);
 outline.setAttribute("d",d);
 edges.setAttribute("viewBox","0 0 "+W+" "+H);
 edges.style.opacity=String(1-smooth((t-.58)/.37));
 layer.dataset.morphProgress=t.toFixed(3);
 playback();
}
window.__arkitektsMorph={paint,choose,get selected(){return chosen}};
paint(0);
})();