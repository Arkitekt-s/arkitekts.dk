/* Cinematic purple liquid cursor, based on the user's recorded reference.
 * Homepage scenes 01–03 only. The native cursor returns in scenes 04–05.
 * Mouse position paints a single elastic neon ribbon; pressing/holding does
 * nothing. Do not transform the film, windows, text, gallery or globe.
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

  const MAX_LENGTH=310;       // A short flexible ribbon, not a painted screen.
  const MAX_NODES=72;
  const FADE_MS=1120;         // Color melts away just after the cursor pauses.
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
    scale=Math.min(devicePixelRatio||1,1.25);
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
  function smoothPoints(points){
    // Smooth out sharp tracking noise, retaining direction changes.
    return points.map((p,i)=>{
      if(i===0 || i===points.length-1)return p;
      const a=points[i-1],b=points[i+1];
      return {x:p.x*.56+(a.x+b.x)*.22,
              y:p.y*.56+(a.y+b.y)*.22,time:p.time,id:p.id};
    });
  }
  // A softly translucent water wash: saturated beneath the white cursor,
  // dissolving outwards to clear alpha with no hard painted edges.
  function watercolorGlow(x,y,radius,life,phase=0){
    if(life<=.004)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,radius);
    g.addColorStop(0,"rgba(239,47,255,"+(.46*life).toFixed(3)+")");
    g.addColorStop(.23,"rgba(187,31,244,"+(.30*life).toFixed(3)+")");
    g.addColorStop(.50,"rgba(145,30,220,"+(.15*life).toFixed(3)+")");
    g.addColorStop(.78,"rgba(106,32,198,"+(.043*life).toFixed(3)+")");
    g.addColorStop(1,"rgba(106,32,198,0)");
    ctx.fillStyle=g;
    ctx.fillRect(x-radius,y-radius,2*radius,2*radius);
    // Moving, faint water rings emerge and vanish around the pointer.
    if(phase>0){
      const rippleRadius=24+46*phase;
      ctx.beginPath();
      ctx.arc(x,y,rippleRadius,0,Math.PI*2);
      ctx.strokeStyle="rgba(227,139,255,"+
        (.12*life*(1-phase)*(1-phase)).toFixed(3)+")";
      ctx.lineWidth=1.6;
      ctx.stroke();
    }
  }
  function ribbon(points,now){
    const last=points[points.length-1];
    const idle=now-lastMove;
    const alive=clamp((FADE_MS-idle)/FADE_MS,0,1);
    if(alive<=0)return;
    const travelFade=Math.pow(alive,.85);
    if(points.length<2 || Math.hypot(last.x-points[0].x,last.y-points[0].y)<2){
      head(last,travelFade,now);
      return;
    }
    const smoothed=smoothPoints(points);
    const cap=smoothed.length-1;
    let total=0;
    const distances=[0];
    for(let i=1;i<smoothed.length;i++){
      total+=Math.hypot(smoothed[i].x-smoothed[i-1].x,smoothed[i].y-smoothed[i-1].y);
      distances.push(total);
    }
    const outline=[];
    for(let i=0;i<smoothed.length;i++){
      const p=smoothed[i];
      const t=total>0?distances[i]/total:i/cap;
      const before=smoothed[Math.max(0,i-1)];
      const after=smoothed[Math.min(cap,i+1)];
      const dx=after.x-before.x,dy=after.y-before.y;
      const mag=Math.max(1,Math.hypot(dx,dy));
      const nx=-dy/mag,ny=dx/mag;
      // Narrow tail and rounded elastic front, without a solid-color edge.
      const radius=(.7+15.5*Math.pow(t,.9))*travelFade;
      outline.push({x:p.x,y:p.y,
        leftX:p.x+nx*radius,leftY:p.y+ny*radius,
        rightX:p.x-nx*radius,rightY:p.y-ny*radius});
    }
    // Soft watercolor clouds extend outside the ribbon, with alpha fading
    // entirely to zero at their edges. Draw sparingly to remain fast.
    const sampleStep=Math.max(1,Math.floor(smoothed.length/11));
    for(let i=0;i<smoothed.length;i+=sampleStep){
      const t=total>0?distances[i]/total:i/cap;
      const age=clamp(1-(now-smoothed[i].time)/FADE_MS,0,1);
      watercolorGlow(smoothed[i].x,smoothed[i].y,
        43+29*t,travelFade*age*(.24+.53*t));
    }

    // Feathered liquid volume; the center is stronger than the outside.
    ctx.beginPath();
    ctx.moveTo(outline[0].leftX,outline[0].leftY);
    for(let i=1;i<outline.length;i++)ctx.lineTo(outline[i].leftX,outline[i].leftY);
    ctx.arc(last.x,last.y,16.2*travelFade,
      Math.atan2(outline[cap].leftY-last.y,outline[cap].leftX-last.x),
      Math.atan2(outline[cap].rightY-last.y,outline[cap].rightX-last.x),true);
    for(let i=outline.length-1;i>=0;i--)ctx.lineTo(outline[i].rightX,outline[i].rightY);
    ctx.closePath();
    const water=ctx.createLinearGradient(smoothed[0].x,smoothed[0].y,last.x,last.y);
    water.addColorStop(0,"rgba(87,14,149,0)");
    water.addColorStop(.28,"rgba(116,12,183,"+(.15*travelFade).toFixed(3)+")");
    water.addColorStop(.72,"rgba(160,9,217,"+(.35*travelFade).toFixed(3)+")");
    water.addColorStop(1,"rgba(217,20,249,"+(.62*travelFade).toFixed(3)+")");
    ctx.save();
    ctx.shadowColor="rgba(175,33,239,"+(.34*travelFade).toFixed(3)+")";
    ctx.shadowBlur=40;
    ctx.fillStyle=water;
    ctx.fill();
    ctx.restore();

    // Transparent edge, vivid center, lighter at the tail.
    ctx.beginPath();
    for(let i=0;i<smoothed.length;i++){
      if(i===0)ctx.moveTo(smoothed[i].x,smoothed[i].y);
      else ctx.lineTo(smoothed[i].x,smoothed[i].y);
    }
    ctx.lineCap="round";
    ctx.lineJoin="round";
    const inner=ctx.createLinearGradient(smoothed[0].x,smoothed[0].y,last.x,last.y);
    inner.addColorStop(0,"rgba(164,44,216,0)");
    inner.addColorStop(.48,"rgba(187,36,235,"+(.12*travelFade).toFixed(3)+")");
    inner.addColorStop(1,"rgba(237,65,255,"+(.48*travelFade).toFixed(3)+")");
    ctx.lineWidth=5.5*travelFade;
    ctx.strokeStyle=inner;
    ctx.stroke();

    // Light water ripples are strongest under the pointer and transparent
    // on the outside. They do not alter the images or page geometry.
    head(last,travelFade,now);
  }
  function head(last,alive,now){
    watercolorGlow(last.x,last.y,112,alive,
      ((now-last.time)%900)/900);
    const glow=ctx.createRadialGradient(last.x,last.y,0,last.x,last.y,31);
    glow.addColorStop(0,"rgba(253,105,255,"+(.88*alive).toFixed(3)+")");
    glow.addColorStop(.34,"rgba(218,52,253,"+(.66*alive).toFixed(3)+")");
    glow.addColorStop(.75,"rgba(173,25,229,"+(.19*alive).toFixed(3)+")");
    glow.addColorStop(1,"rgba(173,25,229,0)");
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.arc(last.x,last.y,31,0,Math.PI*2);
    ctx.fill();
  }
  function draw(now){
    pending=0;
    if(!active()||document.hidden){clear();return;}
    ctx.clearRect(0,0,width,height);
    const life=now-lastMove;
    if(life>FADE_MS){clear();return;}
    if(nodes.length){
      ribbon(nodes,now);
      canvas.dataset.ambientActive="true";
    }
    queue();
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
