/* Contact page: only user-driven behavior lives in JavaScript.
   The original fixed navigation works on mobile and with a keyboard.
   Copy actions copy real contact details and report their result.
   The return link transitions back to the approved dark homepage.
   Background effects and typography are CSS-only, without pointer tracking. */
(() => {
  "use strict";
  const nav=document.getElementById("navigation");
  const toggle=document.getElementById("menu-button");
  const content=document.getElementById("contact-methods");
  const status=document.getElementById("copy-status");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  if(!nav||!toggle)return;
  document.body.dataset.contactReady="true";

  function closeMenu(){
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded","false");
    toggle.setAttribute("aria-label","Open menu");
  }
  toggle.addEventListener("click",()=>{
    const open=toggle.getAttribute("aria-expanded")!=="true";
    nav.classList.toggle("open",open);
    toggle.setAttribute("aria-expanded",String(open));
    toggle.setAttribute("aria-label",open?"Close menu":"Open menu");
  });
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{
    closeMenu();
    if(link.getAttribute("href")==="#contact-methods"&&content){
      // Native anchor scrolling remains functional without JavaScript.
      // Focus the real contact methods for keyboard/screen reader visitors.
      requestAnimationFrame(()=>content.focus({preventScroll:true}));
    }
  }));
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&toggle.getAttribute("aria-expanded")==="true"){
      closeMenu();toggle.focus();
    }
  });
  document.addEventListener("pointerdown",event=>{
    if(!nav.contains(event.target)&&!toggle.contains(event.target))closeMenu();
  },{passive:true});
  matchMedia("(min-width:761px)").addEventListener("change",event=>{
    if(event.matches)closeMenu();
  });

  // A real task: users can copy the telephone number or email.
  // Clear feedback is shown only after copying actually succeeds.
  function fallbackCopy(value){
    const field=document.createElement("textarea");
    field.value=value;
    field.setAttribute("readonly","");
    field.style.cssText="position:fixed;top:-1000px;left:-1000px;opacity:0";
    document.body.appendChild(field);
    field.select();
    let ok=false;
    try{ok=document.execCommand("copy");}finally{field.remove();}
    if(!ok)throw Error("Clipboard unavailable");
  }
  const resetTimers=new WeakMap();
  document.querySelectorAll("[data-copy-contact]").forEach(button=>{
    const original=button.innerHTML;
    const originalLabel=button.getAttribute("aria-label");
    button.addEventListener("click",async()=>{
      const value=button.dataset.copyContact;
      if(!value)return;
      const lastTimer=resetTimers.get(button);
      if(lastTimer)clearTimeout(lastTimer);
      try{
        if(navigator.clipboard&&window.isSecureContext){
          await navigator.clipboard.writeText(value);
        }else fallbackCopy(value);
        button.dataset.copied="true";
        button.innerHTML='COPIED <span aria-hidden="true">✓</span>';
        if(status)status.textContent=value+" copied to clipboard";
      }catch{
        button.dataset.copied="false";
        button.textContent="COPY UNAVAILABLE";
        if(status)status.textContent="Copy unavailable. Use the direct phone or email link.";
      }
      button.setAttribute("aria-label",button.dataset.copied==="true"?"Copied "+value:"Copy unavailable");
      resetTimers.set(button,setTimeout(()=>{
        button.removeAttribute("data-copied");
        button.innerHTML=original;
        button.setAttribute("aria-label",originalLabel);
      },2200));
    });
  });

  // Moving from light to dark has an explicit purpose: route to home.
  // Regular browser controls, new-tab clicks and reduced-motion stay native.
  document.querySelectorAll('a[href="../concepts/frame-five-contact/"]').forEach(link=>{
    link.addEventListener("click",event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||reduced.matches)return;
      event.preventDefault();
      if(document.body.classList.contains("is-leaving"))return;
      document.body.classList.add("is-leaving");
      const veil=document.createElement("div");
      veil.className="return-transition-veil";
      veil.setAttribute("aria-hidden","true");
      Object.assign(veil.style,{
        position:"fixed",inset:"0",zIndex:"1000",pointerEvents:"none",
        background:"#0a0711",opacity:"0",
        transition:"opacity .46s cubic-bezier(.3,.7,.15,1)"
      });
      document.body.appendChild(veil);
      requestAnimationFrame(()=>{veil.style.opacity="1";});
      setTimeout(()=>location.assign(link.href),470);
    });
  });
  window.addEventListener("pageshow",()=>{
    document.body.classList.remove("is-leaving");
    document.querySelector(".return-transition-veil")?.remove();
  });
})();