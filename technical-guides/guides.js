/* The Guides page uses JavaScript only for real tasks:
   responsive navigation, live search and filters.
   All guide cards and direct article links are rendered as HTML. */
(() => {
  "use strict";
  const menu=document.getElementById("menu-button");
  const nav=document.getElementById("navigation");
  const search=document.getElementById("guides-search");
  const clear=document.getElementById("guides-clear");
  const reset=document.getElementById("guides-reset");
  const count=document.getElementById("guides-count");
  const empty=document.getElementById("guides-empty");
  const cards=[...document.querySelectorAll(".guide-card[data-category]")];
  const filters=[...document.querySelectorAll(".guides-filters button[data-category]")];
  if(!menu||!nav||!search||!cards.length)return;

  const close=()=>{
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded","false");
    menu.setAttribute("aria-label","Open menu");
  };
  menu.addEventListener("click",()=>{
    const open=menu.getAttribute("aria-expanded")!=="true";
    nav.classList.toggle("open",open);
    menu.setAttribute("aria-expanded",String(open));
    menu.setAttribute("aria-label",open?"Close menu":"Open menu");
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
  document.addEventListener("pointerdown",event=>{
    if(!nav.contains(event.target)&&!menu.contains(event.target))close();
  },{passive:true});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&menu.getAttribute("aria-expanded")==="true"){
      close();menu.focus();
    }else if(event.key==="Escape"&&document.activeElement===search&&search.value){
      search.value="";update();search.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change",event=>{if(event.matches)close();});

  let chosen="all";
  function update(){
    const needle=search.value.trim().toLocaleLowerCase();
    let found=0;
    for(const card of cards){
      const visible=(chosen==="all"||card.dataset.category===chosen)&&
        (!needle||(card.dataset.search||"").includes(needle));
      card.hidden=!visible;
      if(visible)found++;
    }
    filters.forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.category===chosen)));
    if(count)count.textContent=found+" "+(found===1?"GUIDE":"GUIDES");
    if(empty)empty.hidden=found!==0;
    if(clear)clear.hidden=!needle;
    document.body.dataset.guidesVisible=String(found);
    document.body.dataset.guidesCategory=chosen;
  }
  function choose(value){
    chosen=filters.some(btn=>btn.dataset.category===value)?value:"all";
    update();
  }
  filters.forEach(btn=>btn.addEventListener("click",()=>choose(btn.dataset.category)));
  search.addEventListener("input",update);
  clear?.addEventListener("click",()=>{search.value="";update();search.focus();});
  reset?.addEventListener("click",()=>{search.value="";choose("all");search.focus();});

  // Direct links like /technical-guides/?q=Kafka stay useful.
  const params=new URLSearchParams(location.search);
  if(params.get("q"))search.value=params.get("q").slice(0,100);
  if(params.get("category"))chosen=params.get("category");
  choose(chosen);
  document.body.dataset.guidesReady="true";
})();