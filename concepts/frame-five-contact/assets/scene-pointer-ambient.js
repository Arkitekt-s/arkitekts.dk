/* Soft purple SMOKE follows the mouse, inspired by the user's recording.
 * Homepage scenes 01–03 only; all other sections use the normal cursor.
 * Individual vapor plumes curl, spread and fade to transparent.
 * Mouse press / hold never changes the effect or the website layout.
 */
(() => {
  "use strict";
  const canvas=document.getElementById("pointer-pattern");
  if(!canvas || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;

  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const dot=document.createElement("span");
  dot.className="paint-cursor";
  dot.setAttribute("aria-hidden","true");
  // Separate shell and core so the position follows the mouse instantly,
  // while only the white core enlarges smoothly as text comes close.
  const dotCore=document.createElement("span");
  dotCore.className="paint-cursor-core";
  dot.append(dotCore);
  document.body.append(dot);

  const MAX_LENGTH=285;       // Compact smoke behind the cursor.
  const MAX_NODES=78;
  const FADE_MS=1280;         // Smoke dissipates in just over one second.
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  let width=0,height=0,scale=1;
  let nodes=[],pending=0,lastMove=-Infinity,lastPoint=null;
  let enabled=false,inside=false,sequence=0;
  let textRects=[],lastTextScan=-Infinity,scanScene="";

  // Triptych-like white cursor: a small point over empty space, expanding
  // around actual readable content. Only inspect visible text in 01–03.
  function updateTextRects(now){
    const scene=document.body.dataset.currentFrame || "1";
    if(scene===scanScene && now-lastTextScan<130)return;
    scanScene=scene;
    lastTextScan=now;
    const shared=".site-header .site-name, .navigation a, .site-header .brand-icon";
    const sceneText=scene==="1"
      ?".hero-text span, .hero-text em, .scene-eyebrow span"
      :scene==="2"
        ?".chapter-title span, .chapter-description, .chapter-link"
        :"#chapter-three .side-statement span, #twenty-hotspot";
    textRects=[...document.querySelectorAll(shared+", "+sceneText)]
      .filter(element=>element.getClientRects().length)
      .map(element=>element.getBoundingClientRect())
      .filter(rect=>rect.width>0 && rect.height>0);
  }
  function textProximity(x,y,now){
    updateTextRects(now);
    let nearest=Infinity;
    for(const rect of textRects){
      const dx=Math.max(rect.left-x,0,x-rect.right);
      const dy=Math.max(rect.top-y,0,y-rect.bottom);
      nearest=Math.min(nearest,Math.hypot(dx,dy));
    }
    // Growth is subtle: 9px at rest and only about 15.8px near text.
    return clamp(1-nearest/44,0,1);
  }

  function active(){
    const scene=document.body.dataset.currentFrame;
    return (!scene||scene==="1"||scene==="2"||scene==="3") &&
      !reduced.matches;
  }
  function resize(){
    width=innerWidth;height=innerHeight;
    scale=Math.min(devicePixelRatio||1,1.2);
    canvas.width=Math.round(width*scale);
    canvas.height=Math.round(height*scale);
    ctx.setTransform(scale,0,0,scale,0,0);
    ctx.clearRect(0,0,width,height);
  }
  function clear(){
    if(pending)cancelAnimationFrame(pending);
    pending=0;
    nodes=[];
    lastPoint=null;
    lastMove=-Infinity;
    canvas.dataset.ambientActive="false";
    ctx.clearRect(0,0,width,height);
  }
  function sync(){
    const next=active();
    if(next!==enabled){
      enabled=next;
      document.body.classList.toggle("paint-cursor-active",enabled);
      lastTextScan=-Infinity;
      if(!enabled)clear();
      else dotCore.style.setProperty("--cursor-scale","1");
    }
    dot.classList.toggle("is-visible",enabled&&inside);
  }
  function queue(){
    if(!pending)pending=requestAnimationFrame(draw);
  }
  function addNode(x,y,time){
    nodes.push({x,y,time,id:sequence++});
    if(nodes.length>MAX_NODES)nodes.splice(0,nodes.length-MAX_NODES);
    // Keep the visible stroke compact even after many fast mouse events.
    let length=0;
    for(let i=nodes.length-1;i>0;i--){
      length+=Math.hypot(nodes[i].x-nodes[i-1].x,nodes[i].y-nodes[i-1].y);
      if(length>MAX_LENGTH){
        nodes.splice(0,i);
        break;
      }
    }
  }
  function record(x,y,now){
    if(!lastPoint || now-lastMove>310 ||
       Math.hypot(x-lastPoint.x,y-lastPoint.y)>Math.max(230,width*.46)){
      nodes=[];
      addNode(x,y,now);
    }else{
      const dx=x-lastPoint.x,dy=y-lastPoint.y;
      const steps=Math.min(28,Math.max(1,Math.ceil(Math.hypot(dx,dy)/8)));
      for(let i=1;i<=steps;i++){
        const v=i/steps;
        addNode(lastPoint.x+dx*v,lastPoint.y+dy*v,now);
      }
    }
    lastPoint={x,y};
    lastMove=now;
    queue();
  }
  // Smoke isn't a flat paint stroke. Each deposited point has its own
  // lifespan: old vapor drifts, gets wider, becomes translucent and breaks
  // apart, while the newest smoke near the white cursor stays vivid.
  function displaced(p,now){
    const age=clamp((now-p.time)/FADE_MS,0,1);
    const drift=age*age;
    return {
      x:p.x+Math.sin(p.id*.19+age*4.6)*drift*10,
      y:p.y-drift*12+Math.cos(p.id*.14+age*3.2)*drift*3,
      age,id:p.id
    };
  }
  function cloud(x,y,radius,alpha){
    if(alpha<.003)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,radius);
    g.addColorStop(0,"rgba(205,42,246,"+(.44*alpha).toFixed(3)+")");
    g.addColorStop(.26,"rgba(174,25,236,"+(.32*alpha).toFixed(3)+")");
    g.addColorStop(.58,"rgba(134,13,215,"+(.12*alpha).toFixed(3)+")");
    g.addColorStop(.83,"rgba(103,9,181,"+(.025*alpha).toFixed(3)+")");
    g.addColorStop(1,"rgba(103,9,181,0)");
    ctx.fillStyle=g;
    ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  function smoke(points,now){
    if(!points.length)return;
    const ageSinceMove=now-lastMove;
    // Fade after the user stops, rather than leaving a solid static worm.
    const still=clamp(1-ageSinceMove/FADE_MS,0,1);
    if(still<=0)return;
    const placed=points.map(p=>displaced(p,now));
    const count=placed.length;
    // Vapor body: hazy lobes where the trail bends, like the recording.
    // Radius expands as smoke cools; alpha drops toward its outer edges.
    for(let i=0;i<count;i+=3){
      const p=placed[i];
      const life=1-p.age;
      const along=i/Math.max(1,count-1);
      const opacity=Math.pow(life,1.25)*(.29+.71*along)*still;
      const radius=21+21*p.age+9*Math.pow(along,.7);
      cloud(p.x,p.y,radius,opacity);
    }
    // Soft continuous center, variable thickness and slight smoky wiggle.
    // Small gaps open in older vapor, so pieces detach and dissolve.
    ctx.lineCap="round";
    ctx.lineJoin="round";
    for(let i=1;i<count;i++){
      const a=placed[i-1],b=placed[i];
      const age=b.age;
      const life=Math.pow(1-age,1.6)*still;
      if(life<.025)continue;
      const along=i/(count-1);
      const wobble=1+.16*Math.sin(b.id*.39+age*5.4);
      const thickness=(2.3+18.2*Math.pow(along,.83))*life*wobble;
      // Aged pieces taper away, leaving translucent detached wisps.
      const breakup=age>.56 && (Math.floor(b.id/6)%4===0);
      if(breakup)continue;
      const vx=b.x-a.x,vy=b.y-a.y;
      if(Math.hypot(vx,vy)>48)continue;
      ctx.beginPath();ctx.moveTo(a.x,a.y);
      ctx.quadraticCurveTo((a.x+b.x)/2- Math.sin(b.id*.28)*age*3,
                           (a.y+b.y)/2- Math.cos(b.id*.23)*age*3,b.x,b.y);
      ctx.save();
      ctx.shadowColor="rgba(156,12,221,"+(.56*life).toFixed(3)+")";
      ctx.shadowBlur=14+9*age;
      ctx.lineWidth=thickness+3;
      ctx.strokeStyle="rgba(103,0,171,"+(.45*life).toFixed(3)+")";
      ctx.stroke();
      ctx.restore();
      // Velvet-magenta core, strongest near the mouse and diffused at tail.
      ctx.lineWidth=thickness*.76;
      ctx.strokeStyle="rgba(170,13,231,"+(.66*life).toFixed(3)+")";
      ctx.stroke();
      if(along>.5 && life>.22){
        ctx.lineWidth=thickness*.36;
        ctx.strokeStyle="rgba(217,54,251,"+(.43*life).toFixed(3)+")";
        ctx.stroke();
      }
    }
    const tip=placed[count-1];
    // Small bright smoky bead under the WHITE cursor, not a hard ring.
    cloud(tip.x,tip.y,33,.66*still);
    cloud(tip.x,tip.y,15,.83*still);
  }
  function draw(now){
    pending=0;
    if(!active()||document.hidden){clear();return;}
    ctx.clearRect(0,0,width,height);
    const life=now-lastMove;
    if(life>FADE_MS){clear();return;}
    nodes=nodes.filter(p=>now-p.time<FADE_MS);
    if(nodes.length){
      smoke(nodes,now);
      canvas.dataset.ambientActive="true";
      queue();
    }else canvas.dataset.ambientActive="false";
  }
  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse" && event.pointerType!=="pen")return;
    const x=event.clientX,y=event.clientY;
    inside=true;
    // Track without drawing in scenes 04–05, where the normal cursor
    // returns. The custom core is always bright white, never magenta.
    dot.style.transform="translate3d("+x.toFixed(1)+"px,"+
      y.toFixed(1)+"px,0)";
    if(!active()){
      dot.classList.remove("is-visible");
      return;
    }
    const now=performance.now();
    const near=textProximity(x,y,now);
    const size=1+.75*near*near*(3-2*near);
    dotCore.style.setProperty("--cursor-scale",size.toFixed(3));
    dot.classList.add("is-visible");
    record(x,y,now);
  },{passive:true});
  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget){
      inside=false;dot.classList.remove("is-visible");
    }
  },{passive:true});
  addEventListener("blur",()=>{
    inside=false;dot.classList.remove("is-visible");clear();
  });
  addEventListener("resize",()=>{
    resize();clear();lastTextScan=-Infinity;
  },{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)clear();
  });
  reduced.addEventListener("change",sync);
  new MutationObserver(sync).observe(document.body,{
    attributes:true,attributeFilter:["data-current-frame"]
  });
  canvas.dataset.ambientActive="false";
  resize();
  sync();
})();
