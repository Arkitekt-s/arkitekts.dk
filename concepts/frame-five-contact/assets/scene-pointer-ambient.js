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
  document.body.append(dot);

  const MAX_LENGTH=310;       // A short flexible ribbon, not a painted screen.
  const MAX_NODES=72;
  const FADE_MS=970;          // Trail melts away after the cursor pauses.
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  let width=0,height=0,scale=1;
  let nodes=[],pending=0,lastMove=-Infinity,lastPoint=null;
  let enabled=false,inside=false,sequence=0;

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
      if(!enabled)clear();
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
  function ribbon(points,now){
    const last=points[points.length-1];
    const alive=clamp((FADE_MS-(now-lastMove))/FADE_MS,0,1);
    if(alive<=0)return;
    if(points.length<2 || Math.hypot(last.x-points[0].x,last.y-points[0].y)<2){
      // Single illuminated head, growing into a ribbon as the cursor moves.
      head(last,alive);
      return;
    }
    const smoothed=smoothPoints(points);
    const outline=[];
    let total=0;
    const distances=[0];
    for(let i=1;i<smoothed.length;i++){
      total+=Math.hypot(smoothed[i].x-smoothed[i-1].x,smoothed[i].y-smoothed[i-1].y);
      distances.push(total);
    }
    const cap=points.length-1;
    for(let i=0;i<smoothed.length;i++){
      const t=total>0?distances[i]/total:i/cap;
      const before=smoothed[Math.max(0,i-1)];
      const after=smoothed[Math.min(cap,i+1)];
      const dx=after.x-before.x,dy=after.y-before.y;
      const mag=Math.max(1,Math.hypot(dx,dy));
      const nx=-dy/mag,ny=dx/mag;
      // The front is a broad luminous purple head; tail narrows to a tip.
      const radius=(1.2+19.2*Math.pow(t,.82))*alive;
      outline.push({x:smoothed[i].x,y:smoothed[i].y,
        leftX:smoothed[i].x+nx*radius,leftY:smoothed[i].y+ny*radius,
        rightX:smoothed[i].x-nx*radius,rightY:smoothed[i].y-ny*radius});
    }
    ctx.beginPath();
    ctx.moveTo(outline[0].leftX,outline[0].leftY);
    for(let i=1;i<outline.length;i++)ctx.lineTo(outline[i].leftX,outline[i].leftY);
    // Rounded leading cap, keeping the liquid shape organic.
    ctx.arc(last.x,last.y,19.2*alive,
      Math.atan2(outline[cap].leftY-last.y,outline[cap].leftX-last.x),
      Math.atan2(outline[cap].rightY-last.y,outline[cap].rightX-last.x),true);
    for(let i=outline.length-1;i>=0;i--)ctx.lineTo(outline[i].rightX,outline[i].rightY);
    ctx.closePath();

    const gradient=ctx.createLinearGradient(
      smoothed[0].x,smoothed[0].y,last.x,last.y);
    gradient.addColorStop(0,"rgba(92,0,153,0.08)");
    gradient.addColorStop(.18,"rgba(119,0,177,"+(.73*alive).toFixed(3)+")");
    gradient.addColorStop(.68,"rgba(175,0,222,"+(.90*alive).toFixed(3)+")");
    gradient.addColorStop(1,"rgba(235,23,241,"+(.94*alive).toFixed(3)+")");

    ctx.save();
    ctx.shadowColor="rgba(199,0,249,"+(.64*alive).toFixed(3)+")";
    ctx.shadowBlur=30;
    ctx.fillStyle=gradient;
    ctx.fill();
    ctx.restore();
    // A bright liquid core gives the ribbon form, unlike a blurred paint stroke.
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.beginPath();
    for(let i=0;i<smoothed.length;i++){
      const p=smoothed[i];
      if(i===0)ctx.moveTo(p.x,p.y);
      else ctx.lineTo(p.x,p.y);
    }
    ctx.strokeStyle="rgba(222,56,249,"+(.18*alive).toFixed(3)+")";
    ctx.lineWidth=7.5*alive;
    ctx.stroke();

    // Tiny detached splashes appear near the narrowing tail.
    if(outline.length>18 && alive>.20){
      const k=Math.max(2,Math.floor(outline.length*.12));
      const a=smoothed[k],b=smoothed[Math.min(k+3,cap)];
      const dx=b.x-a.x,dy=b.y-a.y,mag=Math.max(1,Math.hypot(dx,dy));
      const nx=-dy/mag,ny=dx/mag;
      // The outer fleck is slightly detached, like the recorded purple splash.
      ctx.beginPath();
      ctx.moveTo(a.x+nx*17,a.y+ny*17);
      ctx.lineTo(b.x+nx*20,b.y+ny*20);
      ctx.strokeStyle="rgba(195,35,245,"+(.37*alive).toFixed(3)+")";
      ctx.lineWidth=4*alive;
      ctx.stroke();
    }
    head(last,alive);
  }
  function head(last,alive){
    const glow=ctx.createRadialGradient(last.x,last.y,0,last.x,last.y,36);
    glow.addColorStop(0,"rgba(255,93,255,"+(.77*alive).toFixed(3)+")");
    glow.addColorStop(.48,"rgba(198,18,242,"+(.57*alive).toFixed(3)+")");
    glow.addColorStop(1,"rgba(198,18,242,0)");
    ctx.fillStyle=glow;
    ctx.beginPath();ctx.arc(last.x,last.y,36,0,Math.PI*2);ctx.fill();
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
    // Track the pointer without painting in scenes 04–05. This also keeps
    // its position correct when the visitor scrolls back into scene 03.
    dot.style.transform="translate3d("+(x-5.5).toFixed(1)+"px,"+
      (y-5.5).toFixed(1)+"px,0)";
    if(!active()){
      dot.classList.remove("is-visible");
      return;
    }
    dot.classList.add("is-visible");
    record(x,y,performance.now());
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
    resize();clear();
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
