/* SOHEIL / SIX INDIVIDUAL PROJECT PAGES
   Every JavaScript action solves a user task:
   - open/close accessible mobile navigation
   - copy a direct, shareable link to a particular project
   - keep chapter navigation in sync with the section being read
   All project descriptions and links work without JavaScript. */
(() => {
  "use strict";
  const menu=document.getElementById("menu-button");
  const nav=document.getElementById("navigation");
  if(!menu||!nav)return;
  function closeMenu(){
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded","false");
    menu.setAttribute("aria-label","Open menu");
  }
  menu.addEventListener("click",()=>{
    const open=menu.getAttribute("aria-expanded")!=="true";
    nav.classList.toggle("open",open);
    menu.setAttribute("aria-expanded",String(open));
    menu.setAttribute("aria-label",open?"Close menu":"Open menu");
  });
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",closeMenu));
  document.addEventListener("pointerdown",event=>{
    if(!nav.contains(event.target)&&!menu.contains(event.target))closeMenu();
  },{passive:true});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&menu.getAttribute("aria-expanded")==="true"){
      closeMenu();
      menu.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change",event=>{
    if(event.matches)closeMenu();
  });

  const links=[...document.querySelectorAll(".case-chapters a[href^='#']")];
  const sections=links.map(link=>document.querySelector(link.getAttribute("href"))).filter(Boolean);
  let lockedUntil=0;
  function setChapter(id){
    for(const link of links){
      if(link.getAttribute("href")==="#"+id)link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    }
    document.body.dataset.activeChapter=id;
  }
  links.forEach(link=>{
    link.addEventListener("click",()=>{
      const section=document.querySelector(link.getAttribute("href"));
      if(!section)return;
      lockedUntil=performance.now()+1400;
      setChapter(section.id);
      requestAnimationFrame(()=>section.focus({preventScroll:true}));
    });
  });
  let pending=false;
  function updateChapter(){
    pending=false;
    if(performance.now()<lockedUntil)return;
    let chapter=sections[0]?.id;
    for(const section of sections){
      if(section.getBoundingClientRect().top<innerHeight*.48)chapter=section.id;
    }
    if(chapter)setChapter(chapter);
  }
  window.addEventListener("scroll",()=>{
    if(!pending){pending=true;requestAnimationFrame(updateChapter);}
  },{passive:true});
  window.addEventListener("resize",updateChapter,{passive:true});
  const hash=location.hash.slice(1);
  if(sections.some(s=>s.id===hash))setChapter(hash);
  else updateChapter();

  // Write the actual page address to clipboard.
  const copy=document.getElementById("case-copy");
  const status=document.getElementById("case-copy-status");
  const originalText=copy?.innerHTML;
  let resetHandle=0;
  copy?.addEventListener("click",async()=>{
    const link=location.origin+location.pathname;
    if(resetHandle)clearTimeout(resetHandle);
    try{
      if(navigator.clipboard&&window.isSecureContext){
        await navigator.clipboard.writeText(link);
      }else{
        const temp=document.createElement("textarea");
        temp.value=link;
        temp.setAttribute("readonly","");
        temp.style.cssText="position:fixed;top:-1000px;left:-1000px;opacity:0";
        document.body.appendChild(temp);
        temp.select();
        const worked=document.execCommand("copy");
        temp.remove();
        if(!worked)throw Error("clipboard unavailable");
      }
      copy.innerHTML="LINK COPIED <span aria-hidden='true'>✓</span>";
      copy.dataset.copied="true";
      if(status)status.textContent="Project link copied.";
    }catch{
      copy.textContent="COPY UNAVAILABLE";
      copy.dataset.copied="false";
      if(status)status.textContent="Copy unavailable. Select the address in your browser.";
    }
    resetHandle=setTimeout(()=>{
      copy.innerHTML=originalText;
      copy.removeAttribute("data-copied");
      if(status)status.textContent="";
    },2300);
  });
  document.body.dataset.caseReady="true";
})();