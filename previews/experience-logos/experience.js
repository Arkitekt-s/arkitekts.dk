/* Three isolated previews for professional experience, using the original homepage. */
(()=>{
"use strict";
const stage=document.querySelector(".frame-stage");
if(!stage||!document.querySelector("#chapter-two")||!document.querySelector("#chapter-three"))return;
const brands=[
 {name:"Statens It",da:"IT-drift og platforme",en:"IT operations & platforms",img:"https://www.entrust.com/sites/default/files/blog/Statens-IT-Logo.png",fallback:"STATENS IT"},
 {name:"Skatteforvaltningen",da:"Offentlige IT-systemer",en:"Public-sector systems",img:"https://commons.wikimedia.org/wiki/Special:FilePath/Skatteforvaltningen-logo.svg",fallback:"SKAT"},
 {name:"Københavns Universitet",da:"Forskningssamarbejde",en:"Research collaboration",img:"https://designguide.ku.dk/download/co-branding/ku_logo_dk_hh.png",fallback:"KU"},
 {name:"Twentyfour",da:"Softwareudvikling",en:"Software development",img:"https://www.google.com/s2/favicons?domain=twentyfour.dk&sz=128",fallback:"twentyfour"}
];
const node=(tag,cls,parent)=>{const n=document.createElement(tag);if(cls)n.className=cls;parent?.appendChild(n);return n};
const root=node("div","",stage);root.id="exp-layer";root.setAttribute("aria-hidden","true");
const panels={};
for(const mode of ["a","b","c"]){
 const panel=node("div","exp-panel exp-"+mode,root);panel.dataset.previewOption=mode;
 node("div","exp-kicker",panel).textContent="ERFARING FRA";
 const row=node("div","exp-logos",panel);
 for(const brand of brands){
   const item=node("div","exp-logo",row);item.title=brand.name;
   const art=node("div","exp-art",item);
   const image=node("img","",art);
   image.src=brand.img;image.alt=brand.name+" logo";image.loading="lazy";image.decoding="async";image.referrerPolicy="no-referrer";
   image.addEventListener("load",()=>{if(image.naturalWidth)art.classList.add("has-image")});
   image.addEventListener("error",()=>art.classList.remove("has-image"));
   node("span","exp-fallback"+(brand.name==="Twentyfour"?" is-24":""),art).textContent=brand.fallback;
   const label=node("small","exp-label",item);
   label.dataset.labelDa=brand.da;label.dataset.labelEn=brand.en;label.textContent=brand.da;
 }
 node("span","exp-note",panel).textContent="Arbejdspladser og faglige projekter";
 panels[mode]=panel;
}
const lab=node("aside","exp-lab",document.body);
lab.setAttribute("aria-label","Vælg placering af logoer på forsiden");
lab.innerHTML=[
 '<div class="exp-lab-title"><span id="exp-lab-heading">LOGO-PLACERING · DEMO</span><span class="exp-lab-tag">PREVIEW</span></div>',
 '<div class="exp-lab-options" role="group" aria-label="Tre layoutmuligheder">',
 '<button class="exp-lab-option" type="button" data-exp-choose="a" aria-pressed="true"><strong>01</strong><small>Enkel række</small></button>',
 '<button class="exp-lab-option" type="button" data-exp-choose="b" aria-pressed="false"><strong>02</strong><small>Glas-panel</small></button>',
 '<button class="exp-lab-option" type="button" data-exp-choose="c" aria-pressed="false"><strong>03</strong><small>Overgang</small></button>',
 '</div><div class="exp-lab-actions">',
 '<button class="exp-lab-jump" type="button" data-exp-jump="2">Se sektion 2 ↓</button>',
 '<button class="exp-lab-jump" type="button" data-exp-jump="3">Se sektion 3 ↓</button>',
 '</div><div class="exp-lab-hint">Brug også musehjulet til at se overgangen.</div>'
].join("");
const choices=[...lab.querySelectorAll("[data-exp-choose]")];
const jumps=[...lab.querySelectorAll("[data-exp-jump]")];
let mode=new URLSearchParams(location.search).get("option");
if(!["a","b","c"].includes(mode))mode="a";
function updateLanguage(){
 const danish=document.documentElement.lang!=="en";
 for(const panel of Object.values(panels)){
  panel.querySelector(".exp-kicker").textContent=danish?"ERFARING FRA":"EXPERIENCE WITH";
  panel.querySelector(".exp-note").textContent=danish?"Arbejdspladser og faglige projekter":"Workplaces and professional projects";
  panel.querySelectorAll(".exp-label").forEach(e=>{e.textContent=danish?e.dataset.labelDa:e.dataset.labelEn});
 }
 lab.querySelector("#exp-lab-heading").textContent=danish?"LOGO-PLACERING · DEMO":"LOGO PLACEMENT · DEMO";
 const titles=danish?["Enkel række","Glas-panel","Overgang"]:["Simple row","Glass panel","Transition"];
 choices.forEach((e,i)=>{e.querySelector("small").textContent=titles[i]});
 jumps.forEach((e,i)=>{e.textContent=(danish?"Se sektion ":"View section ")+(i+2)+" ↓"});
 lab.querySelector(".exp-lab-hint").textContent=danish?"Brug også musehjulet til at se overgangen.":"Scroll to see the transition.";
}
const smooth=x=>{const a=Math.max(0,Math.min(1,x));return a*a*(3-2*a)};
const visibility=(p,from,shown,closing,to)=>smooth((p-from)/(shown-from))*(1-smooth((p-closing)/(to-closing)));
const windows={a:[.87,1.00,1.33,1.50],b:[.93,1.09,1.52,1.83],c:[1.35,1.53,1.96,2.19]};
function render(){
 const p=Number(document.body.dataset.journeyProgress||0);
 for(const [variant,panel] of Object.entries(panels)){
  const a=variant===mode?visibility(p,...windows[variant]):0;
  panel.style.opacity=String(a);
  panel.style.filter=a>.014?"none":"blur(4px)";
  panel.classList.toggle("is-showing",a>.014);
  panel.dataset.visible=String(a>.25);
 }
}
function select(next){
 if(!["a","b","c"].includes(next))return;
 mode=next;document.body.dataset.experiencePreview=mode;
 choices.forEach(e=>e.setAttribute("aria-pressed",String(e.dataset.expChoose===mode)));
 // Changing URL after this site's SVG initialization may break its film mask.
 // Keep option in page state only and preserve the original movie behavior.
 render();
}
choices.forEach(e=>e.addEventListener("click",()=>select(e.dataset.expChoose)));
function moveTo(target){
 const current=Math.max(1,Math.min(5,Number(document.body.dataset.currentFrame||1)));
 if(current===target)return;
 const b=document.getElementById(target>current?"next-chapter":"previous-chapter");
 if(!b)return;
 const steps=Math.abs(target-current);
 for(let i=0;i<steps;i++)setTimeout(()=>b.click(),i*320);
}
jumps.forEach(b=>b.addEventListener("click",()=>moveTo(Number(b.dataset.expJump))));
const observer=new MutationObserver(updateLanguage);
observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
updateLanguage();select(mode);
let active=true,prev="";
function tick(){
 if(!active)return;
 const p=document.body.dataset.journeyProgress||"0";
 if(prev!==p){render();prev=p}
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener("pagehide",()=>{active=false},{once:true});
})();