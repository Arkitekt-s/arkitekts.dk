/* SOHEIL Portfolio: every JavaScript action has a real user purpose.
   1. Accessible responsive site menu.
   2. Filter six published projects by category or technology/title.
   3. Reset/clear search, update live count, and support shared links.
   All case studies are native <details>: readable even without JavaScript. */
(() => {
  "use strict";
  const menu=document.getElementById("menu-button");
  const nav=document.getElementById("navigation");
  const search=document.getElementById("portfolio-search");
  const clear=document.getElementById("portfolio-clear");
  const reset=document.getElementById("portfolio-reset");
  const count=document.getElementById("portfolio-count");
  const empty=document.getElementById("portfolio-empty");
  const cards=[...document.querySelectorAll(".project-card[data-project-category]")];
  const filters=[...document.querySelectorAll(".portfolio-filters button[data-filter]")];
  if(!menu||!nav||!search||cards.length!==6)return;

  function closeMenu(){
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
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",closeMenu));
  document.addEventListener("pointerdown",event=>{
    if(!menu.contains(event.target)&&!nav.contains(event.target))closeMenu();
  },{passive:true});
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&menu.getAttribute("aria-expanded")==="true"){
      closeMenu();menu.focus();
    }else if(event.key==="Escape"&&document.activeElement===search&&search.value){
      search.value="";update();search.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change",event=>{
    if(event.matches)closeMenu();
  });

  let selected="all";
  const lower=value=>value.trim().toLocaleLowerCase();
  function update(){
    const query=lower(search.value);
    let visible=0;
    cards.forEach(card=>{
      const category=selected==="all"||card.dataset.projectCategory===selected;
      const text=!query||lower(card.dataset.search||"").includes(query);
      const show=category&&text;
      card.hidden=!show;
      if(show)visible++;
    });
    filters.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.filter===selected)));
    if(count)count.textContent=visible+" "+(visible===1?"PROJECT":"PROJECTS");
    if(empty)empty.hidden=visible!==0;
    if(clear)clear.hidden=!query;
    document.body.dataset.portfolioFilter=selected;
    document.body.dataset.portfolioVisible=String(visible);
  }
  function select(category){
    selected=filters.some(button=>button.dataset.filter===category)?category:"all";
    update();
  }
  filters.forEach(button=>button.addEventListener("click",()=>select(button.dataset.filter)));
  search.addEventListener("input",update);
  clear?.addEventListener("click",()=>{
    search.value="";
    update();
    search.focus();
  });
  reset?.addEventListener("click",()=>{
    search.value="";
    select("all");
    search.focus();
  });

  // Clicking any non-interactive space on a card opens that project.
  // Native image/title/action links remain the accessible keyboard path.
  cards.forEach(card=>{
    const destination=card.querySelector("a.project-open")?.href;
    if(!destination)return;
    card.addEventListener("click",event=>{
      if(event.defaultPrevented||event.button!==0)return;
      if(event.target.closest("a,button,summary,details,input"))return;
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      location.assign(destination);
    });
  });

  // Bookmarkable filters, e.g. /portfolio/?category=integration&q=Slack.
  const params=new URLSearchParams(location.search);
  const q=params.get("q");
  if(q)search.value=q.slice(0,120);
  const category=params.get("category");
  if(category)selected=category;
  select(selected);

  // An anchored project is always shown, even if a saved filter hides it.
  const initial=location.hash.slice(1);
  if(initial&&cards.some(card=>card.id===initial)){
    search.value="";
    select("all");
  }
  document.body.dataset.portfolioReady="true";
})();