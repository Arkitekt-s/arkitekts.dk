/* SOHEIL header: a quick, independent upward flip on each hovered letter.
   No magnetic movement, neighbouring-letter reaction, or layout changes. */
(() => {
  "use strict";
  const wordmark=document.querySelector("body.frame-one .site-header .site-name");
  if(!wordmark || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;

  const fragment=document.createDocumentFragment();
  const label=wordmark.getAttribute("aria-label")||"Soheil Fattahieh";
  for(const letter of wordmark.textContent.trim()){
    if(letter===" "){
      fragment.appendChild(document.createTextNode(" "));
      continue;
    }
    const glyph=document.createElement("span");
    glyph.className="name-hover-glyph";
    glyph.setAttribute("aria-hidden","true");

    const outgoing=document.createElement("span");
    outgoing.className="name-hover-face name-hover-out";
    outgoing.textContent=letter;

    const incoming=document.createElement("span");
    incoming.className="name-hover-face name-hover-in";
    incoming.textContent=letter;

    glyph.append(outgoing,incoming);
    glyph.addEventListener("pointerenter",event=>{
      if(event.pointerType!=="mouse" && event.pointerType!=="pen")return;
      glyph.classList.add("is-flipping");
    });
    incoming.addEventListener("animationend",()=>{
      glyph.classList.remove("is-flipping");
    });
    fragment.appendChild(glyph);
  }
  wordmark.replaceChildren(fragment);
  wordmark.setAttribute("role","img");
  wordmark.setAttribute("aria-label",label);
  wordmark.classList.add("name-hover-ready");
})();
