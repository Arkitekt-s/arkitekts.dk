/* Live homepage: scroll-controlled professional experience.
   One original full-bleed film, one fixed mirrored layout, bilingual EN/DA.
   Do not initialize separate media or intercept unrelated scenes. */
(()=>{
"use strict";
const section=document.getElementById("experience-section");
if(!section)return;
section.dataset.layout="a";
const firms=[...section.querySelectorAll(".experience-employer")];
const logos=[
 ["sit","https://www.google.com/s2/favicons?domain=statens-it.dk&sz=128"],
 ["skat","https://commons.wikimedia.org/wiki/Special:FilePath/Skattestyrelsen%20Logo.svg"],
 ["ku","https://designguide.ku.dk/download/co-branding/ku_logo_dk_hh.png"]
];
// External marks are optional. Typography remains visible if any source fails.
for(const [company,src] of logos){
 const symbol=section.querySelector('[data-company="'+company+'"] .experience-symbol');
 if(!symbol)continue;
 const image=document.createElement("img");
 image.className="experience-logo-img";image.src=src;image.alt="";
 image.decoding="async";image.referrerPolicy="no-referrer";
 image.addEventListener("load",()=>{if(image.naturalWidth>5)symbol.classList.add("has-logo")});
 image.addEventListener("error",()=>{symbol.classList.remove("has-logo");image.remove()});
 symbol.appendChild(image);
}
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const u=clamp(x);return u*u*(3-2*u)};
let reveal=0,completedAt=0,wasVisible=false;
const finalReadTime=1000; // A full second with the fourth organisation on screen.
const canAdvance=()=>reveal>=.999&&completedAt>0&&performance.now()-completedAt>=finalReadTime;
function setReveal(value){
 reveal=clamp(value);
 if(reveal<.999)completedAt=0;
 else if(!completedAt)completedAt=performance.now();
 section.style.setProperty("--experience-reveal",reveal.toFixed(4));
 section.style.setProperty("--puzzle-complete",smooth((reveal-.04)/.92).toFixed(4));
 firms.forEach((firm,i)=>{
  // Current employer is visible on entry. Others arrive by scroll.
  const entry=i===0?1:smooth((reveal-(i-1)*.245-.12)/.20);
  firm.style.setProperty("--entry",entry.toFixed(4));
  const spotlight=i===0?1-smooth((reveal-.205)/.10):
    i===3?smooth((reveal-.68)/.13):
    smooth((reveal-(i*.205+.025))/.12)*
       (1-smooth((reveal-(i*.205+.225))/.095));
  firm.style.setProperty("--spotlight",spotlight.toFixed(4));
  const hidden=entry<.02;
  firm.setAttribute("aria-hidden",String(hidden));
  firm.inert=hidden;
 });
}
 const translated=[
   [".experience-topline span:first-child","03 / ERFARING","03 / EXPERIENCE"],
   [".experience-topline span:last-child","ARBEJDSPLADSER & FAGLIGE PROJEKTER","WORKPLACES & PROFESSIONAL PROJECTS"],
   [".experience-eyebrow","FRA KODE TIL PRAKSIS","FROM CODE TO PRACTICE"],
   [".experience-headline h2","Erfaring i<br><em>praksis.</em>","Experience<br><em>in practice.</em>"],
   [".experience-headline p","Jeg arbejder i dag med platformdrift hos Statens It. Min erfaring omfatter også andre arbejdspladser og projekter.","I currently work with platform operations at Statens It. My experience also includes other workplaces and projects."],
   ['[data-company="sit"] .experience-number',"01 / OFFENTLIG IT","01 / PUBLIC IT"],
   ['[data-company="sit"] .experience-current',"HER ARBEJDER JEG NU","MY CURRENT WORKPLACE"],
   ['[data-company="skat"] .experience-number',"02 / OFFENTLIG IT","02 / PUBLIC IT"],
   ['[data-company="ku"] .experience-number',"03 / FAGLIGT PROJEKT","03 / RESEARCH PROJECT"],
   ['[data-company="twentyfour"] .experience-number',"04 / SOFTWAREVIRKSOMHED","04 / SOFTWARE COMPANY"],
   ['[data-company="sit"] .experience-company-detail',"Platformdrift og infrastruktur","Platform operations & infrastructure"],
   ['[data-company="skat"] .experience-company-detail',"IT-platforme og tekniske løsninger","IT platforms & technical solutions"],
   ['[data-company="ku"] .experience-company-detail',"Forskningsprojekt og software","Research project & software"],
   ['[data-company="twentyfour"] .experience-company-detail',"Webudvikling og integration","Web development & integration"],
   [".experience-bottomline span:first-child","INFRASTRUKTUR <i>·</i> UDVIKLING <i>·</i> SAMARBEJDE","INFRASTRUCTURE <i>·</i> DEVELOPMENT <i>·</i> COLLABORATION"],
   [".experience-bottomline span:last-child","SEKTION 03 / 06","SECTION 03 / 06"]
 ];
function refreshLanguage(){
 const danish=document.documentElement.lang!=="en";
 const markup=new Set([".experience-headline h2",".experience-bottomline span:first-child"]);
 for(const [selector,da,en] of translated){
  const el=section.querySelector(selector);
  if(!el)continue;
  const desired=danish?da:en;
  if(markup.has(selector)){
   if(el.innerHTML!==desired)el.innerHTML=desired;
  }else if(el.textContent!==desired)el.textContent=desired;
 }
 section.setAttribute("aria-label",danish?"Afsnit tre: Erfaring fra arbejdspladser og projekter":"Section three: Workplaces and professional projects");
 section.querySelector(".experience-organisations")?.setAttribute("aria-label",danish?"Organisationer fra min erfaring":"Organisations from my experience");
}
new MutationObserver(refreshLanguage).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
function inExperience(){
 const progress=Number(document.body.dataset.experienceTimeline||0);
 return progress>=1.78&&progress<=2.19&&
   document.body.dataset.currentFrame==="3"&&section.classList.contains("is-visible");
}
function intercept(delta,event){
 if(!inExperience()||!Number.isFinite(delta)||Math.abs(delta)<.2)return false;
 // Reverse motion must always reach the previous chapter immediately.
 // The reveal gate applies ONLY when travelling forward. In the old version
 // upward wheel/swipe/keyboard input was eaten while rewinding each company,
 // so visitors appeared trapped in this section.
 if(delta<0)return false;
 if(reveal>=.999&&canAdvance())return false;
 // In the forward direction, keep the visitor here until all four
 // organisations have appeared and the last has been readable.
 if(reveal<.999)setReveal(reveal+delta/720);
 event.preventDefault();
 event.stopImmediatePropagation();
 return true;
}
addEventListener("wheel",event=>{
 if(event.ctrlKey)return; // Do not interfere with pinch zoom.
 if(event.target instanceof Element &&
  event.target.closest(".site-header,.site-footer,.navigation,input,select,textarea"))return;
 const delta=event.deltaMode===1?event.deltaY*18:
  event.deltaMode===2?event.deltaY*innerHeight:event.deltaY;
 intercept(Math.max(-165,Math.min(165,delta)),event);
},{capture:true,passive:false});
let touchY=null;
section.addEventListener("touchstart",event=>{
 if(event.touches.length===1)touchY=event.touches[0].clientY;
},{capture:true,passive:true});
section.addEventListener("touchmove",event=>{
 if(touchY===null||event.touches.length!==1)return;
 const y=event.touches[0].clientY,delta=touchY-y;
 touchY=y;
 intercept(delta*1.6,event);
},{capture:true,passive:false});
section.addEventListener("touchend",()=>{touchY=null},{passive:true});
section.addEventListener("touchcancel",()=>{touchY=null},{passive:true});
addEventListener("keydown",event=>{
 if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
 if(event.target instanceof Element && event.target.closest("input,textarea,button,a,select"))return;
 let delta=0;
 if(["ArrowDown","PageDown"," "].includes(event.key))delta=140;
 if(["ArrowUp","PageUp"].includes(event.key))delta=-140;
 if(delta)intercept(delta,event);
},{capture:true});
section.addEventListener("pointermove",event=>{
 if(event.pointerType==="touch")return;
 const rect=section.getBoundingClientRect();
 section.style.setProperty("--experience-mx",((event.clientX-rect.left)/rect.width*100).toFixed(1)+"%");
 section.style.setProperty("--experience-my",((event.clientY-rect.top)/rect.height*100).toFixed(1)+"%");
},{passive:true});
// A public, keyboard-safe next arrow can reveal one organisation per press.
const next=document.getElementById("next-chapter");
next?.addEventListener("click",event=>{
 if(!inExperience()||canAdvance())return;
 event.preventDefault();event.stopImmediatePropagation();
 if(reveal<.999)setReveal(Math.min(1,reveal+.28));
},{capture:true});
const observed=new MutationObserver(()=>{
 const visible=section.classList.contains("is-visible");
 if(visible&&!wasVisible){
  // Entering from the previous chapter should always start with SIT.
  const position=Number(document.body.dataset.experienceTimeline||0);
  if(position<=2.01)setReveal(0);
 }
 wasVisible=visible;
});
observed.observe(section,{attributes:true,attributeFilter:["class"]});
window.__experienceMotion={setReveal,canAdvance,get reveal(){return reveal;},get waitRemaining(){return completedAt?Math.max(0,finalReadTime-(performance.now()-completedAt)):null;}};
refreshLanguage();setReveal(0);
})();
