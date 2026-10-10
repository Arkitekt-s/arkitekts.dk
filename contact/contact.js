/* Contact page: light-side motion uses the same unobtrusive, responsive approach
   as the approved five-frame journey. All content works without JavaScript. */
(() => {
  "use strict";
  const body=document.body;
  const nav=document.getElementById("site-nav");
  const toggle=document.getElementById("menu-toggle");
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  if(!body||!nav||!toggle)return;
  body.classList.add("has-js");

  const closeMenu=()=>{
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded","false");
    toggle.setAttribute("aria-label","Open navigation");
  };
  toggle.addEventListener("click",()=>{
    const open=toggle.getAttribute("aria-expanded")!=="true";
    nav.classList.toggle("is-open",open);
    toggle.setAttribute("aria-expanded",String(open));
    toggle.setAttribute("aria-label",open?"Close navigation":"Open navigation");
  });
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",closeMenu));
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){closeMenu();toggle.blur();}
  });
  document.addEventListener("pointerdown",event=>{
    if(!nav.contains(event.target)&&!toggle.contains(event.target))closeMenu();
  },{passive:true});
  matchMedia("(min-width: 711px)").addEventListener("change",event=>{if(event.matches)closeMenu();});

  // Content reveals in reading order, but never stays hidden for reduced motion.
  const reveals=[...document.querySelectorAll("[data-reveal]")];
  if(reduce.matches||!("IntersectionObserver" in window)){
    reveals.forEach(item=>item.classList.add("is-visible"));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.055,rootMargin:"0px 0px 30px 0px"});
    reveals.forEach(item=>observer.observe(item));
  }

  const atmosphere=document.querySelector(".contact-atmosphere");
  const finePointer=matchMedia("(hover:hover) and (pointer:fine)");
  let nextX=0,nextY=0,currentX=0,currentY=0,raf=0;
  function animate(){
    raf=0;
    currentX+=(nextX-currentX)*.1;
    currentY+=(nextY-currentY)*.1;
    atmosphere?.style.setProperty("--pointer-x",currentX.toFixed(3));
    atmosphere?.style.setProperty("--pointer-y",currentY.toFixed(3));
    if(Math.abs(currentX-nextX)+Math.abs(currentY-nextY)>.015)raf=requestAnimationFrame(animate);
  }
  if(finePointer.matches&&!reduce.matches){
    window.addEventListener("pointermove",event=>{
      nextX=Math.max(-1,Math.min(1,(event.clientX/innerWidth)*2-1));
      nextY=Math.max(-1,Math.min(1,(event.clientY/innerHeight)*2-1));
      if(!raf)raf=requestAnimationFrame(animate);
    },{passive:true});
    window.addEventListener("blur",()=>{nextX=nextY=0;if(!raf)raf=requestAnimationFrame(animate);});
  }

  // Fade softly back into the dark cinematic journey, without page flash.
  document.querySelectorAll('a[href="../concepts/frame-five-contact/"]').forEach(link=>{
    link.addEventListener("click",event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||reduce.matches)return;
      event.preventDefault();
      if(body.classList.contains("is-leaving"))return;
      body.classList.add("is-leaving");
      const veil=document.createElement("div");
      veil.setAttribute("aria-hidden","true");
      Object.assign(veil.style,{
        position:"fixed",inset:"0",zIndex:"1000",pointerEvents:"none",
        background:"#0a0711",opacity:"0",transition:"opacity .46s ease"
      });
      document.body.appendChild(veil);
      requestAnimationFrame(()=>{veil.style.opacity="1";});
      setTimeout(()=>{location.assign(link.href);},470);
    });
  });
})();
