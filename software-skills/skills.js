/* Skills page: useful JavaScript only.
 * Mobile navigation, real category filtering, live search and reset.
 * All skills remain fully readable without JavaScript. */
(() => {
  "use strict";
  const menu=document.getElementById("menu-button");
  const nav=document.getElementById("navigation");
  const search=document.getElementById("skill-search");
  const clear=document.getElementById("clear-search");
  const count=document.getElementById("result-count");
  const noResults=document.getElementById("no-results");
  const reset=document.getElementById("reset-filters");
  const filters=[...document.querySelectorAll(".skill-filters button[data-filter]")];
  const groups=[...document.querySelectorAll(".stack-group[data-group]")];
  const sections=[...document.querySelectorAll(".stack-section[data-section]")];
  const executionHeading=document.querySelector(".execution-intro");
  if(!menu||!nav||!search||!groups.length)return;

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
    if(event.key==="Escape"&&document.activeElement===search&&search.value){
      search.value="";
      filterSkills();
      search.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change",event=>{if(event.matches)closeMenu();});

  let active="all";
  const normalise=s=>s.trim().toLocaleLowerCase();
  function filterSkills(){
    const query=normalise(search.value);
    let visible=0;
    for(const group of groups){
      const matchesCategory=active==="all"||group.dataset.group===active;
      let hits=0;
      for(const tag of group.querySelectorAll(".skill")){
        const matchesText=!query||normalise(tag.textContent).includes(query);
        const show=matchesCategory&&matchesText;
        tag.hidden=!show;
        if(show){hits++;visible++;}
      }
      group.hidden=hits===0;
      const total=group.querySelector(".stack-total");
      if(total)total.textContent=String(hits).padStart(2,"0")+" TOOLS & SKILLS";
    }
    for(const section of sections){
      section.hidden=![...section.querySelectorAll(".stack-group")].some(g=>!g.hidden);
    }
    if(executionHeading){
      const execution=sections.find(s=>s.dataset.section==="execution");
      executionHeading.hidden=Boolean(execution?.hidden);
    }
    if(count)count.textContent=visible+" "+(visible===1?"SKILL":"SKILLS");
    if(noResults)noResults.hidden=visible>0;
    if(clear)clear.hidden=!query;
    document.body.dataset.visibleSkills=String(visible);
    document.body.dataset.skillsFilter=active;
  }
  function setCategory(category){
    active=filters.some(b=>b.dataset.filter===category)?category:"all";
    filters.forEach(button=>{
      button.setAttribute("aria-pressed",String(button.dataset.filter===active));
    });
    filterSkills();
  }
  filters.forEach(button=>{
    button.addEventListener("click",()=>setCategory(button.dataset.filter));
  });
  search.addEventListener("input",filterSkills);
  clear?.addEventListener("click",()=>{
    search.value="";
    filterSkills();
    search.focus();
  });
  reset?.addEventListener("click",()=>{
    search.value="";
    setCategory("all");
    search.focus();
  });

  // Support direct linking to a specific skill, e.g. ?q=Kafka.
  // No tracking and no browser history changes.
  const query=new URLSearchParams(location.search).get("q");
  if(query)search.value=query.slice(0,100);
  filterSkills();
  document.body.dataset.skillsReady="true";
})();