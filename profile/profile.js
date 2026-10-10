/* Profile interactions: accessible mobile menu and real section navigation.
 * Section index reflects the section in view. Portrait errors show a fallback.
 * All text and education links remain available without JavaScript. */
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
      closeMenu();menu.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change",event=>{
    if(event.matches)closeMenu();
  });

  let sectionNavigationLockedUntil=0;
  const links=[...document.querySelectorAll("[data-section-link]")];
  const targets=links.map(link=>document.getElementById(link.dataset.sectionLink)).filter(Boolean);
  function activate(id){
    links.forEach(link=>{
      if(link.dataset.sectionLink===id){
        link.setAttribute("aria-current","location");
      }else link.removeAttribute("aria-current");
    });
    document.body.dataset.profileSection=id;
  }
  // The index stays usable when JavaScript is disabled: real hash anchors.
  // Focus the destination after clicking for keyboard/screen reader navigation.
  links.forEach(link=>link.addEventListener("click",()=>{
    const target=document.getElementById(link.dataset.sectionLink);
    if(!target)return;
    // Keep the clicked item highlighted while native smooth scrolling runs.
    sectionNavigationLockedUntil=performance.now()+1500;
    activate(target.id);
    requestAnimationFrame(()=>target.focus({preventScroll:true}));
  }));
  let scheduled=false;
  function updateSection(){
    scheduled=false;
    if(performance.now()<sectionNavigationLockedUntil)return;
    const threshold=innerHeight*.38;
    let active=targets[0]?.id;
    for(const section of targets){
      if(section.getBoundingClientRect().top<=threshold)active=section.id;
    }
    if(active)activate(active);
  }
  window.addEventListener("scroll",()=>{
    if(!scheduled){
      scheduled=true;
      requestAnimationFrame(updateSection);
    }
  },{passive:true});
  window.addEventListener("resize",updateSection,{passive:true});
  if(location.hash&&targets.some(section=>"#"+section.id===location.hash)){
    activate(location.hash.slice(1));
  }else updateSection();

  // A meaningful fallback if the original hosted portrait becomes unavailable.
  const portrait=document.querySelector(".profile-portrait");
  const portraitImage=portrait?.querySelector("img");
  portraitImage?.addEventListener("error",()=>{
    portrait.classList.add("portrait-unavailable");
    portraitImage.hidden=true;
  });
  if(portraitImage?.complete&&!portraitImage.naturalWidth){
    portrait?.classList.add("portrait-unavailable");
    portraitImage.hidden=true;
  }

  document.body.dataset.profileReady="true";
})();