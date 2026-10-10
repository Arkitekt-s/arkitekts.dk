/* Individual guide pages: menu, chapter navigation, share the real URL.
   Code, sections and article source links work without JavaScript. */
(() => {
  "use strict";
  const menu=document.getElementById("menu-button");
  const nav=document.getElementById("navigation");
  if(!menu||!nav)return;
  function close(){
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded","false");
    menu.setAttribute("aria-label","Open menu");
  }
  menu.addEventListener("click",()=>{
    const expanded=menu.getAttribute("aria-expanded")!=="true";
    nav.classList.toggle("open",expanded);
    menu.setAttribute("aria-expanded",String(expanded));
    menu.setAttribute("aria-label",expanded?"Close menu":"Open menu");
  });
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",close));
  document.addEventListener("pointerdown",event=>{
    if(!nav.contains(event.target)&&!menu.contains(event.target))close();
  },{passive:true});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&menu.getAttribute("aria-expanded")==="true"){
      close();menu.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change",event=>{if(event.matches)close();});

  const links=[...document.querySelectorAll('.guide-contents nav a[href^="#"]')];
  const sections=links.map(a=>document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  function mark(id){
    links.forEach(a=>{
      if(a.getAttribute("href")==="#"+id)a.setAttribute("aria-current","location");
      else a.removeAttribute("aria-current");
    });
  }
  let lockedUntil=0,pending=false;
  links.forEach(a=>a.addEventListener("click",()=>{
    const section=document.getElementById(a.getAttribute("href").slice(1));
    if(!section)return;
    lockedUntil=performance.now()+1500;
    mark(section.id);
    requestAnimationFrame(()=>section.focus({preventScroll:true}));
  }));
  function update(){
    pending=false;
    if(performance.now()<lockedUntil)return;
    let id=sections[0]?.id;
    sections.forEach(section=>{
      if(section.getBoundingClientRect().top<innerHeight*.45)id=section.id;
    });
    if(id)mark(id);
  }
  window.addEventListener("scroll",()=>{
    if(!pending){pending=true;requestAnimationFrame(update);}
  },{passive:true});
  if(location.hash)mark(location.hash.slice(1));
  else update();

  const button=document.getElementById("guide-copy");
  const status=document.getElementById("guide-copy-status");
  const original=button?.innerHTML;
  let revert=0;
  button?.addEventListener("click",async()=>{
    if(revert)clearTimeout(revert);
    const url=location.origin+location.pathname;
    try{
      if(navigator.clipboard&&isSecureContext){
        await navigator.clipboard.writeText(url);
      }else{
        const temp=document.createElement("textarea");
        temp.value=url;temp.setAttribute("readonly","");
        temp.style.cssText="position:fixed;left:-1000px;top:-1000px";
        document.body.appendChild(temp);temp.select();
        const ok=document.execCommand("copy");
        temp.remove();
        if(!ok)throw Error("clipboard failed");
      }
      button.innerHTML="COPIED <span aria-hidden='true'>✓</span>";
      button.dataset.copied="true";
      if(status)status.textContent="Guide link copied.";
    }catch{
      button.textContent="COPY UNAVAILABLE";
      button.dataset.copied="false";
      if(status)status.textContent="Copy unavailable. Use your browser address bar.";
    }
    revert=setTimeout(()=>{
      button.innerHTML=original;
      button.removeAttribute("data-copied");
      if(status)status.textContent="";
    },2400);
  });
  document.body.dataset.guideReady="true";
})();