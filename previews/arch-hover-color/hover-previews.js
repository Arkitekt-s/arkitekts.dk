(()=>{
"use strict";
const selected=new URLSearchParams(location.search).get("option");
const mode=["a","b","c"].includes(selected)?selected:"a";
document.body.classList.add("hover-study-mode");
document.body.dataset.hoverMode=mode;
const labels={
 a:"A · SILVER TWIST — subtle rotating edges with cool silver-blue color",
 b:"B · AURORA ORBIT — stronger arch rotation with moving violet/cyan hues",
 c:"C · PRISM GLOW — gentle clockwise tilt with warm-to-cool color waves"
};
document.getElementById("hover-study-caption").textContent=labels[mode]+" · Move your mouse over an arch.";
document.querySelector('[data-choice="'+mode+'"]')?.setAttribute("aria-current","page");
const stage=document.getElementById("frame");
const media=document.getElementById("arch-morph-media");
const mask=document.getElementById("live-arch-morph-path");
const edge=document.getElementById("arch-morph-outline-path");
const lens=document.getElementById("arch-morph-lens");
if(!stage||!media||!mask||!edge)return;
const glow=document.createElement("div");
glow.className="hover-study-glow";
glow.setAttribute("aria-hidden","true");
media.append(glow);
let x=-1e4,y=-1e4,inside=false,angle=0,hue=0,tilt=0,last=0,frame=0;
const reduced=matchMedia("(prefers-reduced-motion:reduce)");
function eachFrame(t){
 frame=0;
 const rect=stage.getBoundingClientRect();
 const progress=Number(document.body.dataset.journeyProgress||0);
 let archHit=false,center=rect.width/2;
 if(progress<.28&&!reduced.matches){
  const pathEl=document.getElementById("live-arch-morph-path");
  // The actual video mask is also the arch hit-test; no invisible rectangle.
  const svg=document.querySelector(".arch-morph-mask-defs");
  if(svg&&svg.createSVGPoint){
   const p=svg.createSVGPoint();p.x=x-rect.left;p.y=y-rect.top;
   try{archHit=pathEl.isPointInFill(p)}catch{}
  }
  if(!archHit){
   const arches=[...document.querySelectorAll("#panorama .arch")];
   archHit=arches.some(a=>{
    const b=a.getBoundingClientRect();
    return x>b.left&&x<b.right&&y>b.top&&y<b.bottom;
   });
  }
 }
 inside=archHit;
 const elapsed=last?Math.min(40,t-last):16;last=t;
 const ease=1-Math.exp(-elapsed/115);
 const goal=inside?(mode==="a"?1.25:mode==="b"?3.1:1.8):0;
 angle+=(goal-angle)*ease;
 const cycle=inside?t/1000:0;
 const wanted=mode==="a"?205:mode==="b"?(265+55*Math.sin(cycle*1.4)):(18+150*Math.sin(cycle*.9));
 hue+=(wanted-hue)*ease;
 const px=x-rect.left,py=y-rect.top;
 // Rotate the arch-shaped SVG aperture, not the entire scene or page.
 // Keep the rotation subtle so there is no abrupt cut when scrolling.
 const rotate=angle*Math.sin(mode==="b"?cycle*.8:cycle*.5||.4);
 const cx=rect.width*.5,cy=rect.height*.54;
 const transform="rotate("+rotate.toFixed(2)+" "+cx.toFixed(1)+" "+cy.toFixed(1)+")";
 mask.setAttribute("transform",transform);
 edge.setAttribute("transform",transform);
 media.style.setProperty("--hover-x",px+"px");
 media.style.setProperty("--hover-y",py+"px");
 const opts={
  a:["rgba(210,247,255,.44)","#cef5ff",.08],
  b:["rgba(160,68,255,.52)","#c66aff",.24],
  c:["rgba(255,144,117,.47)","#ffa778",.13]
 };
 const color=opts[mode];glow.style.setProperty("--hover-highlight",color[0]);
 document.body.style.setProperty("--hover-glow",color[1]);
 media.style.filter=inside?"hue-rotate("+((hue-200)*(mode==="a"?.13:mode==="b"?.82:.5)).toFixed(1)+"deg) saturate("+(1+color[2]).toFixed(2)+")":"none";
 document.body.dataset.hovered=String(inside);
 if(inside){glow.style.opacity="1";}else glow.style.opacity="0";
 if(inside||Math.abs(angle)>.03||media.style.filter!=="none")frame=requestAnimationFrame(eachFrame);
 else{mask.removeAttribute("transform");edge.removeAttribute("transform");last=0;}
}
function schedule(){if(!frame)frame=requestAnimationFrame(eachFrame)}
window.addEventListener("pointermove",e=>{
 if(e.pointerType!=="mouse"&&e.pointerType!=="pen")return;
 x=e.clientX;y=e.clientY;schedule();
},{passive:true});
document.addEventListener("mouseout",e=>{if(!e.relatedTarget){x=-1e4;y=-1e4;schedule()}});
window.addEventListener("blur",()=>{x=-1e4;y=-1e4;schedule()});
window.addEventListener("resize",schedule,{passive:true});
document.querySelectorAll("#hover-study-controls a[data-choice]").forEach(a=>a.addEventListener("click",()=>{document.body.dataset.hovered="false"}));
})();
