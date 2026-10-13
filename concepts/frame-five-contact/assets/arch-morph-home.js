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
layer.append(poster,film);
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
const shape=(x,y,w,bottom,curve)=>{
 const c=x+w/2;
 return "M"+n(x)+","+n(bottom)+
  " L"+n(x)+","+n(y+curve)+
  " C"+n(x)+","+n(y+curve*.25)+" "+n(x+w*.16)+","+n(y)+
  " "+n(c)+","+n(y)+
  " C"+n(x+w*.84)+","+n(y)+" "+n(x+w)+","+n(y+curve*.25)+
  " "+n(x+w)+","+n(y+curve)+" L"+n(x+w)+","+n(bottom)+" Z";
};
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
 const t=smooth((Math.min(1,position)-.045)/.91);
 const d=initialRects.map((r,i)=>{
   const sx=innerWidth/viewWidth,sy=innerHeight/viewHeight;
   const x0=r.x*sx-box.left,y0=r.y*sy-box.top,
     w0=r.w*sx,b0=r.bottom*sy-box.top;
   const center=lerp(x0+w0/2,W*(i+.5)/3,t);
   const width=lerp(w0,W/3+6,t);
   const top=lerp(y0,-12,t);
   const bottom=lerp(b0,H+12,t);
   const curve=lerp(w0*.42,0,smooth((t-.67)/.33));
   return shape(center-width/2,top,width,bottom,curve);
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