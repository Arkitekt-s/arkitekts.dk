/* Approved dark homepage -> light contact companion page.
   Only intercept ordinary unmodified clicks; keep keyboard and browser
   behavior, reduced-motion preference, and open-in-new-tab intact. */
(() => {
  "use strict";
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll('a[data-contact-transition]').forEach(link=>{
    link.addEventListener("click",event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||reduce.matches)return;
      event.preventDefault();
      if(document.body.dataset.openingContact==="true")return;
      document.body.dataset.openingContact="true";
      const veil=document.createElement("div");
      veil.className="contact-transition-veil";
      veil.setAttribute("aria-hidden","true");
      Object.assign(veil.style,{
        position:"fixed",inset:"0",zIndex:"9999",pointerEvents:"none",
        background:"linear-gradient(135deg,#fcfbfd,#f3ebf6)",
        opacity:"0",transition:"opacity .54s cubic-bezier(.3,.7,.15,1)"
      });
      document.body.appendChild(veil);
      requestAnimationFrame(()=>{veil.style.opacity="1";});
      setTimeout(()=>{location.assign(link.href);},540);
    });
  });
})();
