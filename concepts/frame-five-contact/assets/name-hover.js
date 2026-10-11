/* SOHEIL wordmark: independent, cursor-reactive letters.
   Self-contained enhancement; the original header remains legible without JS. */
(() => {
  "use strict";
  const wordmark=document.querySelector("body.frame-one .site-header .site-name");
  if(!wordmark || !matchMedia("(hover:hover) and (pointer:fine)").matches)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  if(reduced.matches)return;

  const text=wordmark.textContent.trim();
  const glyphs=[];
  const fragment=document.createDocumentFragment();
  for(const character of text){
    if(character===" "){
      fragment.appendChild(document.createTextNode(" "));
      continue;
    }
    const span=document.createElement("span");
    span.className="name-hover-glyph";
    span.textContent=character;
    span.setAttribute("aria-hidden","true");
    fragment.appendChild(span);
    glyphs.push({element:span,center:0,x:0,y:0,rotation:0,scale:1,tint:0,
                 tx:0,ty:0,tr:0,ts:1,tt:0});
  }
  wordmark.replaceChildren(fragment);
  wordmark.setAttribute("role","img");
  wordmark.setAttribute("aria-label","Soheil Fattahieh");
  wordmark.classList.add("name-hover-ready");

  let active=false,frame=0,previous=0;
  function measure(){
    // Only read layout when entering or resizing, never on animation frames.
    // Transforms do not influence the original line layout.
    glyphs.forEach(g=>{
      const rect=g.element.getBoundingClientRect();
      g.center=rect.left+rect.width/2-g.x;
    });
  }
  function schedule(){
    if(!frame)frame=requestAnimationFrame(animate);
  }
  function setRest(){
    glyphs.forEach(g=>{
      g.tx=0;g.ty=0;g.tr=0;g.ts=1;g.tt=0;
    });
    schedule();
  }
  function react(clientX,clientY){
    const bounds=wordmark.getBoundingClientRect();
    const vertical=Math.max(0,1-Math.abs(clientY-(bounds.top+bounds.height/2))/48);
    glyphs.forEach((g,index)=>{
      const dx=clientX-g.center;
      const closeness=Math.max(0,1-Math.abs(dx)/77);
      const energy=closeness*closeness*(3-2*closeness)*vertical;
      // Neighbouring letters rise and turn differently as the cursor moves.
      g.tx=-dx/77*5.5*energy;
      g.ty=-12.5*energy;
      g.tr=-dx/77*17*energy+(index%2===0?-1:1)*2.8*energy;
      g.ts=1+.19*energy;
      g.tt=energy;
    });
    schedule();
  }
  function animate(now){
    frame=0;
    const dt=previous?Math.min(45,Math.max(1,now-previous)):16.67;
    previous=now;
    const easing=1-Math.exp(-dt/(active?61:125));
    let unsettled=false;
    glyphs.forEach(g=>{
      g.x+=(g.tx-g.x)*easing;
      g.y+=(g.ty-g.y)*easing;
      g.rotation+=(g.tr-g.rotation)*easing;
      g.scale+=(g.ts-g.scale)*easing;
      g.tint+=(g.tt-g.tint)*easing;
      g.element.style.transform="translate3d("+g.x.toFixed(2)+"px,"+
        g.y.toFixed(2)+"px,0) rotate("+g.rotation.toFixed(2)+"deg) scale("+
        g.scale.toFixed(3)+")";
      g.element.style.color=g.tint>.12
        ?"rgb("+Math.round(245-15*g.tint)+","+
                 Math.round(236-64*g.tint)+","+
                 Math.round(250+5*g.tint)+")":"";
      if(Math.abs(g.tx-g.x)>.03 || Math.abs(g.ty-g.y)>.03 ||
         Math.abs(g.tr-g.rotation)>.04 || Math.abs(g.ts-g.scale)>.001 ||
         Math.abs(g.tt-g.tint)>.01)unsettled=true;
    });
    if(unsettled)frame=requestAnimationFrame(animate);
    else previous=0;
  }
  wordmark.addEventListener("pointerenter",event=>{
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    active=true;
    measure();
    react(event.clientX,event.clientY);
  });
  wordmark.addEventListener("pointermove",event=>{
    if(!active)return;
    react(event.clientX,event.clientY);
  });
  wordmark.addEventListener("pointerleave",()=>{
    active=false;
    setRest();
  });
  window.addEventListener("blur",()=>{
    active=false;
    setRest();
  },{passive:true});
  window.addEventListener("resize",()=>{
    if(!active)return;
    measure();
  },{passive:true});
})();
