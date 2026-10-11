/* Silver Glass cursor on Frame 01; violet ribbon kept in Frames 02–03.
 * Opening scene has a clear white pointer with eased movement, no purple. 
 * No button press. Nothing changes the layout or interrupts wheel navigation.
 */
(() => {
  "use strict";
  const canvas=document.getElementById("pointer-pattern");
  if(!canvas || !matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  const ctx=canvas.getContext("2d",{alpha:true,desynchronized:true});
  if(!ctx)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const smooth=n=>n*n*(3-2*n);
  const dot=document.createElement("span");
  dot.className="paint-cursor";
  dot.setAttribute("aria-hidden","true");
  const dotCore=document.createElement("span");
  dotCore.className="paint-cursor-core";
  dot.append(dotCore);
  document.body.append(dot);

  // Short, substantial liquid tail; pigment evaporates rather than leaving
  // an opaque fixed paint mark or a large full-screen purple halo.
  const LIFE=1050,MAX_LENGTH=335,MAX_NODES=105;
  let width=0,height=0,ratio=1;
  let trail=[],seq=0,frame=0,lastPoint=null,lastMove=0;
  let enabled=false,inside=false;
  let textRects=[],textScan=-Infinity,lastScene="";
  let tip={x:-2000,y:-2000};
  let cursorFrame=0,cursorX=-2000,cursorY=-2000;
  let targetX=-2000,targetY=-2000,cursorInitialized=false;
  let observedScene="";

  function cancelSilverCursor(){
    if(cursorFrame)cancelAnimationFrame(cursorFrame);
    cursorFrame=0;cursorInitialized=false;
  }
  function animateSilverCursor(){
    cursorFrame=0;
    if(!active()||(document.body.dataset.currentFrame||"1")!=="1")return;
    const dx=targetX-cursorX,dy=targetY-cursorY;
    cursorX+=dx*.33;cursorY+=dy*.33;
    dot.style.transform="translate3d("+cursorX.toFixed(1)+"px,"+
      cursorY.toFixed(1)+"px,0)";
    if(Math.hypot(dx,dy)>.35)cursorFrame=requestAnimationFrame(animateSilverCursor);
  }
  function positionSilverCursor(x,y){
    targetX=x;targetY=y;
    if(!cursorInitialized||Math.hypot(x-cursorX,y-cursorY)>350){
      cursorX=x;cursorY=y;cursorInitialized=true;
    }
    if(!cursorFrame)cursorFrame=requestAnimationFrame(animateSilverCursor);
  }

  function active(){
    const scene=document.body.dataset.currentFrame||"1";
    return (scene==="1"||scene==="2"||scene==="3") &&
      !reduced.matches && !document.body.classList.contains("motion-off");
  }
  function resize(){
    width=window.innerWidth;height=window.innerHeight;
    ratio=Math.min(devicePixelRatio||1,1.65);
    canvas.width=Math.ceil(width*ratio);
    canvas.height=Math.ceil(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
  }
  function clear(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;trail=[];lastPoint=null;lastMove=0;
    ctx.clearRect(0,0,width,height);
    canvas.dataset.ambientActive="false";
  }
  function sync(){
    const scene=document.body.dataset.currentFrame||"1";
    if(scene!==observedScene){
      observedScene=scene;
      if(scene==="1")clear(); // clear remaining purple when returning home
      else cancelSilverCursor();
    }
    const next=active();
    if(next!==enabled){
      enabled=next;
      document.body.classList.toggle("paint-cursor-active",enabled);
      textScan=-Infinity;
      if(!enabled){clear();cancelSilverCursor();}
      else dotCore.style.setProperty("--cursor-scale","1");
    }
    dot.classList.toggle("is-visible",enabled&&inside);
  }
  function inspectText(now){
    const scene=document.body.dataset.currentFrame||"1";
    if(scene===lastScene&&now-textScan<150)return;
    textScan=now;lastScene=scene;
    const common=".site-header .site-name, .navigation a, .site-header .brand-icon";
    const selector=scene==="1"
      ?".hero-text span, .hero-text em, .scene-eyebrow span"
      :scene==="2"
        ?".chapter-title span, .chapter-description, .chapter-link"
        :"#chapter-three .side-statement span, #twenty-hotspot";
    textRects=[...document.querySelectorAll(common+", "+selector)]
      .filter(el=>el.getClientRects().length)
      .map(el=>el.getBoundingClientRect())
      .filter(r=>r.width>0&&r.height>0);
  }
  function textNear(x,y,now){
    inspectText(now);
    let distance=Infinity;
    for(const r of textRects){
      const dx=Math.max(r.left-x,0,x-r.right);
      const dy=Math.max(r.top-y,0,y-r.bottom);
      distance=Math.min(distance,Math.hypot(dx,dy));
    }
    return smooth(clamp(1-distance/40,0,1));
  }
  function queue(){if(!frame)frame=requestAnimationFrame(draw);}
  function deposit(x,y,t,speed){
    trail.push({x,y,t,speed,id:seq++});
    if(trail.length>MAX_NODES)trail.splice(0,trail.length-MAX_NODES);
  }
  function record(x,y,now){
    const previous=lastPoint;
    const gap=previous?Math.hypot(x-previous.x,y-previous.y):Infinity;
    if(!previous||now-lastMove>260||gap>Math.max(235,width*.42)){
      trail=[];
      deposit(x,y,now,0);
    }else if(gap>=.75){
      const steps=Math.min(42,Math.max(1,Math.ceil(gap/6)));
      const velocity=clamp(gap/Math.max(8,now-lastMove),0,5);
      for(let i=1;i<=steps;i++){
        const f=i/steps;
        deposit(previous.x+(x-previous.x)*f,
                previous.y+(y-previous.y)*f,
                now-(steps-i)*.45,velocity);
      }
    }else if(trail.length){
      trail[trail.length-1].t=now;
    }
    lastPoint={x,y};
    lastMove=now;
    tip={x,y};
    // Enforce a spatial length cap, independently of event rate.
    let length=0,keepFrom=0;
    for(let i=trail.length-1;i>0;i--){
      length+=Math.hypot(trail[i].x-trail[i-1].x,trail[i].y-trail[i-1].y);
      if(length>MAX_LENGTH){keepFrom=i;break;}
    }
    if(keepFrom)trail.splice(0,keepFrom);
    queue();
  }
  function point(p,now){
    const age=clamp((now-p.t)/LIFE,0,1);
    const fade=Math.pow(1-smooth(age),1.15);
    // The wet front stays on the mouse. Only older dye curls, floats up,
    // and becomes transparent, like the reference's viscous wisps.
    const drift=smooth(clamp((age-.13)/.87,0,1));
    return {
      x:p.x+Math.sin(p.id*.24+age*6.2)*drift*(3+age*4),
      y:p.y-drift*(3+age*10)+Math.cos(p.id*.17)*drift*3,
      id:p.id,age,fade,speed:p.speed
    };
  }
  function glow(x,y,r,opacity){
    if(opacity<=.005)return;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"rgba(239,70,255,"+(.24*opacity).toFixed(3)+")");
    g.addColorStop(.21,"rgba(190,28,242,"+(.20*opacity).toFixed(3)+")");
    g.addColorStop(.54,"rgba(138,18,217,"+(.085*opacity).toFixed(3)+")");
    g.addColorStop(1,"rgba(109,0,167,0)");
    ctx.fillStyle=g;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function stroke(a,b,size,color){
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.lineWidth=size;
    ctx.strokeStyle=color;
    ctx.stroke();
  }
  function render(now){
    const points=trail.map(p=>point(p,now));
    if(!points.length)return;
    // Background bloom has a short radius and fades at the same speed
    // as the ribbon. There is no wide purple "radiation" across the page.
    for(let i=0;i<points.length;i+=4){
      const p=points[i];
      const f=p.fade*(.42+.58*i/Math.max(1,points.length-1));
      glow(p.x,p.y,26+12*p.age,f*.8);
    }

    // Paint each tiny interpolated section in layered, rounded passes.
    // The width/shine variations form one liquid ribbon, not round smoke
    // particles or separate stiff strokes.
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];
      if(Math.hypot(b.x-a.x,b.y-a.y)>26)continue;
      const along=i/(points.length-1);
      const f=Math.min(a.fade,b.fade)*Math.pow(.20+.80*along,.40);
      if(f<.015)continue;
      const pressure=clamp(.34+.66*Math.pow(along,.36),.2,1);
      const wobble=1+.14*Math.sin(b.id*.23+b.age*3);
      const thickness=(7.8+16*pressure+2.4*b.speed)*wobble;
      const body=thickness*(.55+.45*f);
      // Dark violet edge gives definition over both white scenery and
      // the deep purple background; violet center is luminous.
      stroke(a,b,body+9*f,"rgba(100,2,157,"+(.20*f).toFixed(3)+")");
      stroke(a,b,body+4*f,"rgba(135,7,206,"+(.50*f).toFixed(3)+")");
      stroke(a,b,body*.82,"rgba(176,21,231,"+(.75*f).toFixed(3)+")");
      stroke(a,b,body*.43,"rgba(223,60,253,"+(.47*f).toFixed(3)+")");
      // Iridescent specular streak sliding beside the ribbon's center.
      if(f>.22 && i%2===0){
        const dx=b.x-a.x,dy=b.y-a.y;
        const len=Math.max(1,Math.hypot(dx,dy));
        const normal={x:-dy/len,y:dx/len};
        const off=body*.20;
        stroke({x:a.x+normal.x*off,y:a.y+normal.y*off},
               {x:b.x+normal.x*off,y:b.y+normal.y*off},
               1.15+1.65*f,"rgba(255,176,255,"+(.33*f).toFixed(3)+")");
      }
    }

    // A few irregular droplets tear away when the stroke turns sharply.
    // They float out and disappear, without drawing a whole particle cloud.
    for(let i=5;i<points.length-4;i+=9){
      const p=points[i],a=points[i-3],b=points[i+3];
      if(p.age<.26||p.age>.77||p.fade<.08)continue;
      const v1=Math.atan2(p.y-a.y,p.x-a.x);
      const v2=Math.atan2(b.y-p.y,b.x-p.x);
      const turn=Math.abs(Math.atan2(Math.sin(v2-v1),Math.cos(v2-v1)));
      if(turn<.39)continue;
      const ox=Math.sin(p.id*1.6)*14*p.age,oy=Math.cos(p.id*1.1)*12*p.age;
      ctx.beginPath();
      ctx.ellipse(p.x+ox,p.y+oy,2.1+2.2*p.fade,3.5+3*p.fade,v2,0,Math.PI*2);
      ctx.fillStyle="rgba(196,35,240,"+(.33*p.fade).toFixed(3)+")";
      ctx.fill();
    }

    // The vivid end of the worm remains attached to the white cursor.
    const idle=clamp(1-(now-lastMove)/LIFE,0,1);
    glow(tip.x,tip.y,23,.9*idle);
    glow(tip.x,tip.y,11,1.0*idle);
  }
  function draw(now){
    frame=0;
    if(!active()||document.hidden){clear();return;}
    ctx.clearRect(0,0,width,height);
    if((document.body.dataset.currentFrame||"1")==="1"){
      trail=[];canvas.dataset.ambientActive="false";return;
    }
    trail=trail.filter(p=>now-p.t<LIFE);
    if(trail.length){
      render(now);
      canvas.dataset.ambientActive="true";
      queue();
    }else canvas.dataset.ambientActive="false";
  }
  addEventListener("pointermove",event=>{
    if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
    inside=true;
    const x=event.clientX,y=event.clientY;
    if(!active()){dot.classList.remove("is-visible");return;}
    const now=performance.now();
    const scene=document.body.dataset.currentFrame||"1";
    dotCore.style.setProperty("--cursor-scale",(1+.67*textNear(x,y,now)).toFixed(3));
    dot.classList.add("is-visible");
    if(scene==="1"){
      if(trail.length||frame)clear();
      positionSilverCursor(x,y);
    }else{
      dot.style.transform="translate3d("+x.toFixed(1)+"px,"+y.toFixed(1)+"px,0)";
      record(x,y,now);
    }
  },{passive:true});
  document.addEventListener("mouseout",event=>{
    if(!event.relatedTarget){inside=false;dot.classList.remove("is-visible");cancelSilverCursor();}
  },{passive:true});
  addEventListener("blur",()=>{
    inside=false;dot.classList.remove("is-visible");clear();cancelSilverCursor();
  });
  addEventListener("resize",()=>{resize();clear();textScan=-Infinity;},{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)clear();
  });
  reduced.addEventListener("change",sync);
  new MutationObserver(sync).observe(document.body,{
    attributes:true,attributeFilter:["data-current-frame","class"]
  });
  resize();
  sync();
})();
