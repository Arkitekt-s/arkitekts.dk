/* Three design alternatives on a REAL sixth scene. Preview only. */
(()=>{
 "use strict";
 const section=document.getElementById("experience-section");
 if(!section)return;
 const selector=document.createElement("div");
 selector.className="experience-select";
 selector.setAttribute("role","group");
 selector.setAttribute("aria-label","Vælg design til den nye erfaringssektion");
 selector.innerHTML=[
  '<span class="experience-select-note">NY SEKTION 03</span>',
  '<button type="button" data-exp-option="a" aria-pressed="true">01 · Tekst</button>',
  '<button type="button" data-exp-option="b" aria-pressed="false">02 · Buer</button>',
  '<button type="button" data-exp-option="c" aria-pressed="false">03 · Fokus</button>',
  '<button type="button" class="experience-jump" data-exp-replay>Se animation ↻</button>',
  '<button type="button" class="experience-jump" data-exp-start>Fra start ↖</button>',
  '<button type="button" class="experience-jump" data-exp-show="3">Sektion 03 ↘</button>'
 ].join("");
 document.body.appendChild(selector);
 const buttons=[...selector.querySelectorAll("[data-exp-option]")];
 let chosen=new URLSearchParams(location.search).get("option");
 if(!["a","b","c"].includes(chosen))chosen="a";
 function select(next){
  if(!["a","b","c"].includes(next))return;
  chosen=next;
  section.dataset.layout=next;
  buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.expOption===next)));
  document.body.dataset.previewExperienceOption=next;
  if(section.classList.contains("is-visible"))replay();
 }
 buttons.forEach(b=>b.addEventListener("click",()=>select(b.dataset.expOption)));
 selector.querySelector("[data-exp-show]").addEventListener("click",()=>{
   window.__experiencePreviewGo?.(3,true);replay();
 });
 selector.querySelector("[data-exp-replay]").addEventListener("click",()=>{
   window.__experiencePreviewGo?.(3,true);replay();
 });
 selector.querySelector("[data-exp-start]").addEventListener("click",()=>{
   stopAuto();window.__experiencePreviewGo?.(1,true);setReveal(0);
 });
 // Keep original company names, but translate the new chapter when English is chosen.
 const translated=[
   [".experience-topline span:first-child","03 / ERFARING","03 / EXPERIENCE"],
   [".experience-topline span:last-child","ARBEJDSPLADSER & FAGLIGE PROJEKTER","WORKPLACES & PROFESSIONAL PROJECTS"],
   [".experience-eyebrow","FRA IDÉ TIL DRIFT","FROM IDEAS TO OPERATIONS"],
   [".experience-headline h2","Erfaring, der<br><em>skaber værdi.</em>","Experience<br><em>that delivers.</em>"],
   [".experience-headline p","Jeg har arbejdet med IT-drift og udvikling i både offentlige organisationer og private virksomheder.","I've worked on IT operations and software development across the public and private sectors."],
   ['[data-company="sit"] .experience-number',"01 / OFFENTLIG IT","01 / PUBLIC IT"],
   ['[data-company="skat"] .experience-number',"02 / OFFENTLIG IT","02 / PUBLIC IT"],
   ['[data-company="ku"] .experience-number',"03 / FAGLIGT PROJEKT","03 / RESEARCH PROJECT"],
   ['[data-company="twentyfour"] .experience-number',"04 / SOFTWAREVIRKSOMHED","04 / SOFTWARE COMPANY"],
   ['[data-company="sit"] .experience-company-detail',"Platformdrift og infrastruktur","Platform operations & infrastructure"],
   ['[data-company="skat"] .experience-company-detail',"IT-platforme og tekniske løsninger","IT platforms & technical solutions"],
   ['[data-company="ku"] .experience-company-detail',"Forskningsprojekt og software","Research project & software"],
   ['[data-company="twentyfour"] .experience-company-detail',"Webudvikling og integration","Web development & integration"],
   [".experience-bottomline span:first-child","INFRASTRUKTUR <i>·</i> UDVIKLING <i>·</i> SAMARBEJDE","INFRASTRUCTURE <i>·</i> DEVELOPMENT <i>·</i> COLLABORATION"],
   [".experience-bottomline span:last-child","04 ORGANISATIONER","04 ORGANISATIONS"]
 ];
 function refreshLanguage(){
  const da=document.documentElement.lang!=="en";
  const htmlSel=new Set([".experience-headline h2",".experience-bottomline span:first-child"]);
  for(const [selector,danish,english] of translated){
   const el=section.querySelector(selector);if(!el)continue;
   const text=da?danish:english;
   if(htmlSel.has(selector))el.innerHTML=text;
   else el.textContent=text;
  }
  section.setAttribute("aria-label",da?"Afsnit tre: Erfaring fra arbejdspladser og projekter":"Section three: Workplaces and professional projects");
  const texts=da?["NY SEKTION 03","01 · Tekst","02 · Buer","03 · Fokus","Sektion 03 ↘"]:["NEW SECTION 03","01 · Type","02 · Arches","03 · Focus","Section 03 ↘"];
  selector.querySelector(".experience-select-note").textContent=texts[0];
  buttons.forEach((b,i)=>{b.textContent=texts[i+1]});
  selector.querySelector("[data-exp-show]").textContent=texts[4];
  selector.querySelector("[data-exp-replay]").textContent=da?"Se animation ↻":"Replay reveal ↻";
  selector.querySelector("[data-exp-start]").textContent=da?"Fra start ↖":"From start ↖";
  if(hint)hint.querySelector(".experience-progress-label").textContent=da?"RUL NED FOR AT SE ERFARING":"SCROLL TO REVEAL EXPERIENCE";
 }
 new MutationObserver(refreshLanguage).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 const logos=[
  ['sit',"https://www.google.com/s2/favicons?domain=statens-it.dk&sz=128"],
  ['skat',"https://commons.wikimedia.org/wiki/Special:FilePath/Skattestyrelsen%20Logo.svg"],
  ['ku',"https://designguide.ku.dk/download/co-branding/ku_logo_dk_hh.png"],
  ['twentyfour',"https://www.google.com/s2/favicons?domain=twentyfour.dk&sz=128"]
 ];
 // Public logo/icon references are optional in the PREVIEW. Every company
 // retains its name and typographic mark if an image fails or is blocked.
 for(const [company,src] of logos){
  const host=section.querySelector('[data-company="'+company+'"] .experience-symbol');
  if(!host)continue;
  const img=document.createElement("img");
  img.className="experience-logo-img";
  img.src=src;
  img.alt="";
  img.referrerPolicy="no-referrer";
  img.decoding="async";
  img.loading="eager";
  img.addEventListener("load",()=>{if(img.naturalWidth>5)host.classList.add("has-logo")});
  img.addEventListener("error",()=>{host.classList.remove("has-logo");img.remove()});
  host.appendChild(img);
 }
 // Scroll gesture controls the four organisation reveals while Section 03
 // remains a standalone stop. Scenes 1, 2, 4, 5 and 6 are unaffected.
 const firms=[...section.querySelectorAll(".experience-employer")];
 const hint=document.createElement("div");
 hint.className="experience-progress";
 hint.setAttribute("aria-live","off");
 hint.innerHTML='<span class="experience-progress-label">RUL NED FOR AT SE ERFARING</span>'+
  '<span class="experience-progress-track" aria-hidden="true"><span></span></span>'+
  '<span class="experience-progress-count">00 / 04</span>';
 section.appendChild(hint);
 const clamp=x=>Math.max(0,Math.min(1,x));
 const smooth=x=>{const u=clamp(x);return u*u*(3-2*u)};
 let reveal=0,animation=0,animationStart=0,started=false,manuallyPaused=false;
 function stopAuto(){if(animation)cancelAnimationFrame(animation);animation=0;}
 function setReveal(value){
   reveal=clamp(value);
   section.style.setProperty("--experience-reveal",reveal.toFixed(4));
   let fullyVisible=0;
   firms.forEach((firm,i)=>{
     const entry=smooth((reveal-i*.20-.025)/.175);
     firm.style.setProperty("--entry",entry.toFixed(4));
     let spot;
     if(i===3)spot=smooth((reveal-.68)/.13);
     else spot=smooth((reveal-(i*.205+.025))/.12)*
          (1-smooth((reveal-(i*.205+.225))/.095));
     firm.style.setProperty("--spotlight",spot.toFixed(4));
     if(entry>.78)fullyVisible++;
     firm.setAttribute("aria-hidden",String(section.dataset.layout==="c"?spot<.02:entry<.02));
   });
   hint.querySelector(".experience-progress-count").textContent=
     String(fullyVisible).padStart(2,"0")+" / 04";
   const da=document.documentElement.lang!=="en";
   hint.querySelector(".experience-progress-label").textContent=reveal>.98?
     (da?"FORTSÆT TIL NÆSTE SEKTION":"CONTINUE TO NEXT SECTION"):
     (da?"RUL NED FOR AT SE ERFARING":"SCROLL TO REVEAL EXPERIENCE");
 }
 function replay(){
   stopAuto();
   setReveal(0);
   manuallyPaused=false;
   const duration=5200;
   const step=now=>{
     if(!animationStart)animationStart=now;
     const elapsed=now-animationStart;
     setReveal(smooth(elapsed/duration));
     if(elapsed<duration)animation=requestAnimationFrame(step);
     else {animation=0;animationStart=0;}
   };
   animationStart=0;
   animation=requestAnimationFrame(step);
 }
 const currentlyHere=()=>{
   const position=Number(document.body.dataset.experienceTimeline||0);
   return position>=1.88&&position<=2.13&&
      document.body.dataset.currentFrame==="3"&&section.classList.contains("is-visible");
 };
 function gesture(delta,event){
   if(!currentlyHere()||!Number.isFinite(delta)||Math.abs(delta)<.2)return false;
   const backwards=delta<0;
   if((backwards&&reveal<=.001)||(!backwards&&reveal>=.999))return false;
   stopAuto();manuallyPaused=true;
   setReveal(reveal+delta/660);
   event.preventDefault();
   event.stopImmediatePropagation();
   return true;
 }
 addEventListener("wheel",event=>{
   if(event.ctrlKey)return;
   if(event.target instanceof Element && event.target.closest(".experience-select,.site-header,.site-footer"))return;
   const delta=event.deltaMode===1?event.deltaY*18:
               event.deltaMode===2?event.deltaY*innerHeight:event.deltaY;
   gesture(Math.max(-165,Math.min(165,delta)),event);
 },{capture:true,passive:false});
 let previousTouch=null;
 section.addEventListener("touchstart",event=>{
   if(event.touches.length===1)previousTouch=event.touches[0].clientY;
 },{capture:true,passive:true});
 section.addEventListener("touchmove",event=>{
   if(previousTouch===null||event.touches.length!==1)return;
   const y=event.touches[0].clientY;
   const delta=previousTouch-y;previousTouch=y;
   gesture(delta*1.6,event);
 },{capture:true,passive:false});
 section.addEventListener("touchend",()=>{previousTouch=null;},{capture:true,passive:true});
 addEventListener("keydown",event=>{
   if(event.altKey||event.ctrlKey||event.metaKey||
     (event.target instanceof Element&&event.target.closest("input,textarea,button,a,select")))return;
   let delta=0;
   if(["ArrowDown","PageDown"," "].includes(event.key))delta=140;
   if(["ArrowUp","PageUp"].includes(event.key))delta=-140;
   if(delta)gesture(delta,event);
 },{capture:true});
 // A soft highlight responds to the pointer but never changes video
 // or captures the site's own cursor events.
 section.addEventListener("pointermove",event=>{
   if(event.pointerType==="touch")return;
   const r=section.getBoundingClientRect();
   section.style.setProperty("--experience-mx",((event.clientX-r.left)/r.width*100).toFixed(1)+"%");
   section.style.setProperty("--experience-my",((event.clientY-r.top)/r.height*100).toFixed(1)+"%");
 },{passive:true});
 const entryObserver=new MutationObserver(()=>{
   const visible=section.classList.contains("is-visible");
   if(visible&&!started&&!manuallyPaused){started=true;replay();}
   if(!visible){started=false;stopAuto();manuallyPaused=false;}
 });
 entryObserver.observe(section,{attributes:true,attributeFilter:["class"]});
 select(chosen);
 refreshLanguage();
 setReveal(.03);
 let attempts=0;
 function goToSection(){
  if(typeof window.__experiencePreviewGo==="function"){
    if(new URLSearchParams(location.search).get("start")==="1")return;
    window.__experiencePreviewGo(3,true);
    // The first open shows the reveal automatically. Scrolling takes over.
    if(!started){started=true;replay();}
  }else if(attempts++<30)setTimeout(goToSection,100);
 }
 // Defer one frame to let the original movie and arch geometry initialize.
 requestAnimationFrame(goToSection);
})();
