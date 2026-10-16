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
  '<button type="button" data-exp-option="a" aria-pressed="true">01 · Kort</button>',
  '<button type="button" data-exp-option="b" aria-pressed="false">02 · Logoer</button>',
  '<button type="button" data-exp-option="c" aria-pressed="false">03 · Liste</button>',
  '<button type="button" class="experience-jump" data-exp-show="3">Se sektion ↘</button>'
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
 }
 buttons.forEach(b=>b.addEventListener("click",()=>select(b.dataset.expOption)));
 selector.querySelector("[data-exp-show]").addEventListener("click",()=>window.__experiencePreviewGo?.(3));
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
  const texts=da?["NY SEKTION 03","01 · Kort","02 · Logoer","03 · Liste","Se sektion ↘"]:["NEW SECTION 03","01 · Cards","02 · Logos","03 · List","Show section ↘"];
  selector.querySelector(".experience-select-note").textContent=texts[0];
  buttons.forEach((b,i)=>{b.textContent=texts[i+1]});
  selector.querySelector("[data-exp-show]").textContent=texts[4];
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
 select(chosen);
 refreshLanguage();
 let attempts=0;
 function goToSection(){
  if(typeof window.__experiencePreviewGo==="function"){
    if(new URLSearchParams(location.search).get("start")==="1")return;
    window.__experiencePreviewGo(3,true);
  }else if(attempts++<30)setTimeout(goToSection,100);
 }
 // Defer one frame to let the original movie and arch geometry initialize.
 requestAnimationFrame(goToSection);
})();
