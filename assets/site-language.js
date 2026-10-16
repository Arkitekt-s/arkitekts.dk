/* EN ↔ DA on arkitekts.dk.
 * Only text, accessibility labels, and one small language switch change.
 * Existing HTML sections, SVG clips, videos, animations and links remain intact.
 */
(()=>{
 "use strict";
 const dictionary=window.__siteDa||{};
 const key=s=>String(s).replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
 const protectedSelector="script,style,noscript,template,code,pre,kbd,samp,svg,canvas,textarea,iframe,math,[contenteditable],[data-no-translate]";
 const textHistory=new WeakMap(),attrHistory=new WeakMap();
 let lang="da",working=false,queued=false;
 function lookup(input){
   const normalized=key(input);
   if(!normalized)return null;
   if(Object.prototype.hasOwnProperty.call(dictionary,normalized))return dictionary[normalized];
   // Dynamic navigation labels: keep section numbers, translate only the words.
   let match=normalized.match(/^Section (\d+) of 5$/i);
   if(match)return "Afsnit "+match[1]+" af 5";
   match=normalized.match(/^(\d{2})\s*\/\s*(\d{2})\s*·?\s*PRESS & HOLD$/i);
   if(match)return match[1]+" / "+match[2]+" · HOLD INDE";
   match=normalized.match(/^(\d+)\s+(PROJECT|PROJECTS|GUIDE|GUIDES|SKILL|SKILLS)$/);
   if(match)return match[1]+" "+({
     PROJECT:"PROJEKT",PROJECTS:"PROJEKTER",GUIDE:"GUIDE",GUIDES:"VEJLEDNINGER",
     SKILL:"KOMPETENCE",SKILLS:"KOMPETENCER"
   })[match[2]];
   match=normalized.match(/^(\d+)\s+TOOLS & SKILLS$/);
   if(match)return match[1]+" VÆRKTØJER OG KOMPETENCER";
   match=normalized.match(/^PRESS & HOLD\s*·\s*(\d{2}) \/ 03$/);
   if(match)return "HOLD INDE · "+match[1]+" / 03";
   match=normalized.match(/^(.+)\s+copied to clipboard$/i);
   if(match)return match[1]+" kopieret til udklipsholderen";
   match=normalized.match(/^Copied\s+(.+)$/);
   if(match)return "Kopieret: "+match[1];
   match=normalized.match(/^GUIDE (\d{2}) \/ 11$/);
   if(match)return "GUIDE "+match[1]+" / 11";
   match=normalized.match(/^(\d{2}) \/ TECHNICAL GUIDE$/);
   if(match)return match[1]+" / TEKNISK GUIDE";
   match=normalized.match(/^PAGE (\d{2})$/);
   if(match)return "SIDE "+match[1];
   return null;
 }
 function isProtected(el){
   return !el||!el.closest || !!el.closest(protectedSelector);
 }
 function transformText(node){
   if(!node||node.nodeType!==3||isProtected(node.parentElement))return;
   const existing=node.nodeValue,trimmed=key(existing);
   if(!trimmed)return;
   let record=textHistory.get(node);
   if(!record || (existing!==record.en&&existing!==record.da)){
     // Existing interactive scripts may update a label after initialization.
     const reverse=(window.__siteEn||{})[key(existing)];
     if(reverse!==undefined){
       record={en:existing.replace(/^(\s*)[\s\S]*?(\s*)$/,(_,a,b)=>a+reverse+b),da:existing};
     }else{
       const da=lookup(existing);
       record={en:existing,da:da===null?existing:existing.replace(/^(\s*)[\s\S]*?(\s*)$/,(_,a,b)=>a+da+b)};
     }
     textHistory.set(node,record);
   }
   const chosen=lang==="da"?record.da:record.en;
   if(node.nodeValue!==chosen)node.nodeValue=chosen;
 }
 const attrs=["aria-label","title","alt","placeholder","aria-valuetext"];
 function translateAttr(el,name){
   const value=el.getAttribute(name);
   if(value===null)return;
   let records=attrHistory.get(el);
   if(!records){records={};attrHistory.set(el,records);}
   let record=records[name];
   if(!record||(value!==record.en&&value!==record.da)){
     const reverse=(window.__siteEn||{})[key(value)];
     record=reverse!==undefined?{en:reverse,da:value}:{en:value,da:lookup(value)??value};
     records[name]=record;
   }
   const wanted=lang==="da"?record.da:record.en;
   if(value!==wanted)el.setAttribute(name,wanted);
 }
 function translateElement(root){
   if(!root||root.nodeType!==1)return;
   if(isProtected(root))return;
   for(const a of attrs)if(root.hasAttribute(a))translateAttr(root,a);
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
   let n;
   while((n=walker.nextNode())){
     if(n.nodeType===3){transformText(n);continue;}
     if(n.nodeType===1&&!isProtected(n))for(const a of attrs)if(n.hasAttribute(a))translateAttr(n,a);
   }
 }
 function updateDynamicStatus(){
   const da=lang==="da",pause=document.getElementById("motion-button");
   if(pause){
     const off=document.body.classList.contains("motion-off");
     const wanted=da?(off?"START ANIMATION":"SÆT ANIMATION PÅ PAUSE"):(off?"RESUME MOTION":"PAUSE MOTION");
     if(pause.textContent!==wanted)pause.textContent=wanted;
   }
   const menu=document.getElementById("menu-button");
   if(menu){
     const opened=menu.getAttribute("aria-expanded")==="true";
     const label=da?(opened?"Luk menu":"Åbn menu"):(opened?"Close menu":"Open menu");
     if(menu.getAttribute("aria-label")!==label)menu.setAttribute("aria-label",label);
   }
 }
 function applyLanguage(next,persist=true){
   lang=next==="da"?"da":"en";
   working=true;
   document.documentElement.lang=lang;
   document.documentElement.dataset.siteLanguage=lang;
   translateElement(document.body);
   // Existing page titles and SEO summaries are already Danish. Keep them and
   // preserve their canonical URLs; never rewrite page identity or links.
   if(switcher){
     switcher.textContent=lang==="da"?"EN":"DA";
     switcher.lang=lang==="da"?"en":"da";
     switcher.title=lang==="da"?"Skift til engelsk":"Switch to Danish";
     switcher.setAttribute("aria-label",switcher.title);
     switcher.setAttribute("aria-pressed",String(lang==="da"));
   }
   updateDynamicStatus();
   working=false;
   if(persist)try{localStorage.setItem("arkitekts-language-v2",lang)}catch{}
 }
 const header=document.querySelector(".site-header");
 if(!header)return;
 const switcher=document.createElement("button");
 switcher.id="site-language-switch";
 switcher.type="button";
 switcher.className="site-language-switch";
 switcher.setAttribute("data-no-translate","");
 switcher.setAttribute("aria-label","Switch to Danish");
 switcher.textContent="DA";
 header.appendChild(switcher);
 let initial=null;
 // A new preference key makes Danish the default at rollout, even for
 // visitors who saved English under the previous English-first release.
 try{initial=localStorage.getItem("arkitekts-language-v2")}catch{}
 const requested=new URLSearchParams(location.search).get("lang");
 if(requested==="en"||requested==="da")initial=requested;
 switcher.addEventListener("click",()=>applyLanguage(lang==="en"?"da":"en"));
 applyLanguage(initial==="en"?"en":"da",true);
 const observer=new MutationObserver(changes=>{
   if(working||queued)return;
   queued=true;
   requestAnimationFrame(()=>{
     queued=false;
     if(working)return;
     working=true;
     // Re-translate text inserted or updated by existing navigation,
     // projects filtering, gallery, and media controls.
     for(const change of changes){
       if(change.type==="characterData")transformText(change.target);
       else if(change.type==="attributes"){
         if(change.target.nodeType===1&&!isProtected(change.target))
           translateAttr(change.target,change.attributeName);
       }else if(change.type==="childList"){
         for(const node of change.addedNodes){
           if(node.nodeType===3)transformText(node);
           else if(node.nodeType===1)translateElement(node);
         }
       }
     }
     updateDynamicStatus();
     working=false;
   });
 });
 observer.observe(document.body,{subtree:true,characterData:true,childList:true,attributes:true,
  attributeFilter:["aria-label","title","alt","placeholder","aria-valuetext"]});
 window.__siteSetLanguage=applyLanguage;
})();
