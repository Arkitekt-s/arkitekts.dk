/* English/Danish translation for the ISOLATED 5-scene homepage preview. */
(()=>{
"use strict";
const toggle=document.getElementById("language-switch"),label=document.getElementById("language-switch-code");
if(!toggle||!label)return;
let language=new URLSearchParams(location.search).get("lang")==="da"?"da":"en";
const baselineTitle=document.title;
const baselineDescription=document.querySelector('meta[name="description"]')?.content||"";
const entries=[
 [".skip","text","Spring direkte til forsiden"],
 [".navigation a:nth-child(1)","text","OM MIG"],
 [".navigation a:nth-child(2)","text","PROJEKTER"],
 [".navigation a:nth-child(3)","text","KOMPETENCER"],
 [".navigation a:nth-child(4)","text","VEJLEDNINGER"],
 [".navigation a:nth-child(5)","text","Kontakt mig"],
 [".scene-eyebrow .eyebrow-role","text","IT- OG PLATFORMINGENIØR"],
 [".hero-text > span:first-child","text","Jeg får komplekse"],
 [".hero-text > span:last-child","html","systemer til at <em>virke</em><b>.</b>"],
 ["#chapter-two .chapter-title > span:nth-child(1)","text","Nysgerrighed."],
 ["#chapter-two .chapter-title > span:nth-child(2)","text","Kode."],
 ["#chapter-two .chapter-title > span:nth-child(3)","html","<em>Leverancer.</em>"],
 ["#chapter-two .chapter-description","text","Jeg hedder Soheil. Jeg bygger og automatiserer IT-platforme, der fungerer i praksis. Jeg arbejder med Linux, Ansible, Kafka og Elasticsearch."],
 ["#chapter-two .chapter-link","first","Se mine projekter "],
 ["#chapter-three .side-left span:nth-child(1)","text","JEG BYGGER"],
 ["#chapter-three .side-left span:nth-child(2)","text","STABILE"],
 ["#chapter-three .side-right span:nth-child(1)","text","SYSTEMER"],
 ["#chapter-three .side-right span:nth-child(2)","text","DER HOLDER"],
 [".gallery-mobile-intro > span","text","04 / LIVET UDEN FOR SKÆRMEN"],
 [".gallery-mobile-intro > strong","html","Mere end kode<span>.</span>"],
 [".gallery-mobile-intro > p","text","Mennesker, udvikling og et liv i bevægelse."],
 [".gallery-photo[data-photo='0'] figcaption strong","text","Løbsdag"],
 [".gallery-photo[data-photo='1'] figcaption strong","text","Møder nye mennesker"],
 [".gallery-photo[data-photo='3'] figcaption strong","text","Deler viden"],
 [".gallery-photo[data-photo='4'] figcaption strong","text","Udforsker AI"],
 [".gallery-photo[data-photo='5'] figcaption strong","text","Bag skærmene"],
 [".gallery-photo[data-photo='6'] figcaption strong","text","Tid med kolleger"],
 [".frame-five-contact .contact-heading","html","Komplekse udfordringer.<br><em>Konkrete resultater.</em>"],
 [".frame-five-contact .contact-lead","first","Jeg bygger, automatiserer og forbedrer systemer. Har du en teknisk udfordring, så "],
 [".frame-five-contact .contact-lead-link","text","lad os tage en snak"],
 [".contact-email > span:first-child","text","SEND EN MAIL"],
 [".contact-github","first","SE MIN GITHUB "],
 [".globe-location span","text","KØBENHAVN"],
 [".site-footer .footer-location","text","KØBENHAVN · DANMARK"],
 [".danish-search-summary h2","text","IT-drift og Linux-serverdrift i København"]
];
const attributes=[
 [".site-header","aria-label","Fast topmenu"],
 [".brand-icon","aria-label","Soheils forside"],
 [".navigation","aria-label","Hovedmenu"],
 ["#frame","aria-label","Interaktiv rejse gennem fem afsnit med kontakt til sidst"],
 ["#panorama","aria-label","Tre buede vinduer med en animeret video om kunstig intelligens"],
 ["#chapter-two","aria-label","Afsnit to: Mit arbejde"],
 ["#chapter-three","aria-label","Afsnit tre: Interaktiv typografi"],
 ["#twenty-hotspot","aria-label","Interaktivt tal 10. Hold musen over for at samle delene. Flyt den væk for at sprede dem."],
 ["#twenty-svg","aria-label","Tallet 10 bygget af ni interaktive dele"],
 ["#frame-four-gallery","aria-label","Afsnit fire: Billedgalleri"],
 [".gallery-viewport","aria-label","Træk eller brug pilene for at se billeder. Rul videre til kontakt."],
 ["#gallery-prev","aria-label","Forrige billede"],
 ["#gallery-next","aria-label","Næste billede"],
 ["#frame-five-contact","aria-label","Afsnit fem: Kontakt og globus"],
 ["#copenhagen-globe","aria-label","Interaktiv globus med København markeret. Træk for at dreje."],
 ["#globe-shell","aria-label","Interaktiv globus. Brug piletasterne til at dreje. København er markeret."],
 [".portal-steps .portal-track","aria-label","Aktuelt afsnit"],
 ["#journey-scrollbar","aria-label","Rul gennem de fem afsnit"],
 [".danish-search-summary","aria-label","Dansk beskrivelse af mit IT-arbejde"],
 [".gallery-photo[data-photo='0'] img","alt","Løbere ved starten af et løb"],
 [".gallery-photo[data-photo='1'] img","alt","Folk mødes til et fagligt arrangement"],
 [".gallery-photo[data-photo='3'] img","alt","Foredragsholdere til en konference"],
 [".gallery-photo[data-photo='4'] img","alt","Oplæg om udfordringer med AI-projekter"],
 [".gallery-photo[data-photo='5'] img","alt","Arbejdsplads med tre skærme"],
 [".gallery-photo[data-photo='6'] img","alt","Kolleger samlet til et gruppebillede"]
];
for(const [num,title] of ["Løbsdag","Møder nye mennesker","Soheil","Deler viden","Udforsker AI","Bag skærmene","Tid med kolleger"].entries())attributes.push([".gallery-photo[data-photo='"+num+"']","aria-label",title]);
const translations=[...entries,...attributes].map(([selector,type,da])=>{
 const el=document.querySelector(selector);if(!el)return null;
 const en=type==="html"?el.innerHTML:type==="text"?el.textContent:type==="first"?el.firstChild?.nodeValue:el.getAttribute(type);
 return {el,type,en:en||"",da};
}).filter(Boolean);
function set(el,type,value){
 if(!el)return;
 if(type==="html"){if(el.innerHTML!==value)el.innerHTML=value;}
 else if(type==="text"){if(el.textContent!==value)el.textContent=value;}
 else if(type==="first"){if(el.firstChild?.nodeType===3&&el.firstChild.nodeValue!==value)el.firstChild.nodeValue=value;}
 else if(el.getAttribute(type)!==value)el.setAttribute(type,value);
}
const sum=document.querySelector(".danish-search-summary p");
const sumDa=sum?.innerHTML||"";
const sumEn='I work with IT operations, Linux servers and infrastructure in test and production. With Ansible and GitHub, I automate changes so they can be repeated, tested and documented. I also work with Elasticsearch, Logstash, Apache Kafka, logging and troubleshooting. My focus is stable systems and practical delivery. Read my <a href="/it-drift/">Danish IT operations guide</a>. Learn more about my <a href="/profile/">experience</a>, <a href="/software-skills/">technical skills</a> and <a href="/technical-guides/">guides</a>, or <a href="/contact/">contact me</a>.';
let lock=false;
function updateControls(){
 const da=language==="da",frame=Math.max(1,Math.min(5,Number(document.body.dataset.currentFrame||1)));
 const byId=id=>document.getElementById(id);
 const paused=document.body.classList.contains("motion-off");
 set(byId("motion-button"),"text",da?(paused?"START ANIMATION":"SÆT ANIMATION PÅ PAUSE"):(paused?"RESUME MOTION":"PAUSE MOTION"));
 const menu=byId("menu-button");
 set(menu,"aria-label",da?(menu?.getAttribute("aria-expanded")==="true"?"Luk menu":"Åbn menu"):(menu?.getAttribute("aria-expanded")==="true"?"Close menu":"Open menu"));
 const hold=byId("hold-scene-control");
 if(hold){
   const number=hold.textContent.match(/(\d{2})\s*\/\s*03/)?.[1]||String(Number(document.body.dataset.frameOneArt||0)+1).padStart(2,"0");
   set(hold,"text",(da?"HOLD INDE":"PRESS & HOLD")+"  ·  "+number+" / 03");
   set(hold,"aria-label",da?"Hold nede for at skifte video.":"Press and hold to change to the next video.");
 }
 set(byId("hold-scene-hint"),"text",da?"HOLD MUSEN NEDE FOR AT SKIFTE VIDEO":"HOLD ANYWHERE TO CHANGE THE SCENE");
 set(document.querySelector(".portal-navigation"),"aria-label",(da?"Afsnit ":"Section ")+frame+(da?" af 5":" of 5"));
 set(byId("next-chapter"),"aria-label",da?(frame===1?"Rul ned for at se mere":"Gå til næste afsnit"):(frame===1?"Scroll down to explore the website":"Go to the next section"));
 set(byId("previous-chapter"),"aria-label",da?"Gå til forrige afsnit":"Go to the previous section");
 set(byId("journey-scrollbar"),"aria-valuetext",(da?"Afsnit ":"Section ")+frame+(da?" af 5":" of 5"));
 set(byId("globe-shell"),"aria-label",da?"Interaktiv 3D-globus. Brug piletasterne til at dreje. København er markeret.":"Interactive 3D globe. Use arrow keys to rotate; Copenhagen is highlighted.");
 const hint=byId("wheel-hint");
 if(hint){const back=/SCROLL UP|RUL OP/.test(hint.textContent);
 set(hint,"html",da?(back?"RUL OP FOR AT GÅ TILBAGE <span>↑</span>":"RUL VIDERE FOR AT FORTSÆTTE <span>↓</span>"):(back?"SCROLL UP TO RETURN <span>↑</span>":"KEEP SCROLLING TO ENTER <span>↓</span>"));}
}
function apply(next,remember=true){
 language=next==="da"?"da":"en";
 const da=language==="da";
 document.documentElement.lang=language;
 document.documentElement.dataset.previewLanguage=language;
 for(const entry of translations)set(entry.el,entry.type,da?entry.da:entry.en);
 if(sum)set(sum,"html",da?sumDa:sumEn);
 const sumTitle=document.querySelector(".danish-search-summary h2");
 if(sumTitle)set(sumTitle,"text",da?"IT-drift og Linux-serverdrift i København":"IT operations and Linux server management in Copenhagen");
 const summaryLang=document.querySelector(".danish-search-summary");
 if(summaryLang)summaryLang.lang=language;
 const schema=document.querySelector('script[type="application/ld+json"]');
 if(schema){
  try{const data=JSON.parse(schema.textContent);data.inLanguage=da?"da-DK":"en";schema.textContent=JSON.stringify(data)}catch{}
 }
 document.title=da?baselineTitle:"IT Operations, Linux and DevOps in Copenhagen | Soheil Fattahieh";
 const description=document.querySelector('meta[name="description"]');
 if(description)description.content=da?baselineDescription:"IT operations and Linux server management in Copenhagen. Soheil works with Ansible automation, infrastructure, Elasticsearch and Kafka.";
 const locale=document.querySelector('meta[property="og:locale"]');
 if(locale)locale.content=da?"da_DK":"en_US";
 const ogTitle=document.querySelector('meta[property="og:title"]');
 if(ogTitle)ogTitle.content=document.title;
 const ogDescription=document.querySelector('meta[property="og:description"]');
 if(ogDescription&&description)ogDescription.content=description.content;
 label.textContent=da?"EN":"DA";
 toggle.lang=da?"en":"da";
 toggle.title=da?"Skift til engelsk":"Switch to Danish";
 toggle.setAttribute("aria-label",toggle.title);
 toggle.setAttribute("aria-pressed",String(da));
 updateControls();
 // Keep the preview URL unchanged while switching. The original animation
 // uses a document-URL-based SVG clip-path, so replacing the URL mid-session
 // could invalidate its mask in some browsers.
}
toggle.addEventListener("click",()=>apply(language==="en"?"da":"en"));
let pending=false;
const observer=new MutationObserver(()=>{
 if(pending)return;
 pending=true;
 queueMicrotask(()=>{pending=false;updateControls();});
});
for(const id of ["motion-button","menu-button","hold-scene-control","hold-scene-hint","next-chapter","previous-chapter","journey-scrollbar","globe-shell"]){
 const el=document.getElementById(id);
 if(el)observer.observe(el,{attributes:true,attributeFilter:["aria-label","aria-valuetext"],childList:true,characterData:true,subtree:true});
}
const rail=document.querySelector(".portal-navigation");
if(rail)observer.observe(rail,{attributes:true,attributeFilter:["aria-label"]});
addEventListener("resize",updateControls,{passive:true});
apply(language,false);
})();
