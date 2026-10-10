/* SOHEIL — independent animated 3D geographic point globe.
 * Self-hosted Natural Earth land-dot data. No third-party rendering service.
 * Accurate Copenhagen marker: 55.6761 N, 12.5683 E.
 *
 * Each dot is represented on a unit sphere in 3D, yaw and pitch are applied,
 * with both hemispheres projected into a transparent HTML canvas.
 * Dim far-side points establish depth with no opaque sphere, glow or shadow.
 */
(() => {
  "use strict";
  const shell=document.querySelector("#globe-shell");
  const canvas=document.querySelector("#copenhagen-globe");
  const label=document.querySelector("#globe-location");
  const recenter=document.querySelector("#globe-recenter");
  if(!shell||!canvas||!label)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  const rad=Math.PI/180;
  const PI=Math.PI;
  const COPENHAGEN={lat:55.6761,lon:12.5683};
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const initialYaw=-COPENHAGEN.lon*rad;
  const initialPitch=26*rad;
  let yaw=initialYaw,pitch=initialPitch;
  let dots=[],dragging=false,lastX=0,lastY=0,wasMoved=false;
  let width=0,height=0,cx=0,cy=0,radius=0,dpr=1;
  let loaded=false,active=false,frameCount=0,last=0,idleResume=0;
  let frames=0;

  const toXYZ=(lon,lat)=>{
    const xlat=lat*rad,xlon=lon*rad,c=Math.cos(xlat);
    return {x:c*Math.sin(xlon),y:Math.sin(xlat),z:c*Math.cos(xlon)};
  };
  const projection=(p)=>{
    const a=Math.cos(yaw),b=Math.sin(yaw);
    const x=p.x*a+p.z*b;
    const z=p.z*a-p.x*b;
    const c=Math.cos(pitch),d=Math.sin(pitch);
    const y=p.y*c-z*d;
    const front=p.y*d+z*c;
    return {x:cx+radius*x,y:cy-radius*y,front};
  };
  const landFallback=()=>{
    // Small, graceful fallback only if the local Natural Earth asset fails.
    // The normal experience uses precise 3517 geographic land points.
    for(let lat=-70;lat<78;lat+=3.6){
      for(let lon=-174;lon<180;lon+=3.6){
        const eu=(lon>-14&&lon<142&&lat>2&&lat<75);
        const af=(lon>-17&&lon<51&&lat>-35&&lat<36);
        const am=(lon>-166&&lon<-33&&lat>-55&&lat<71);
        const au=(lon>112&&lon<156&&lat>-46&&lat<-9);
        if(eu||af||am||au)dots.push(toXYZ(lon,lat));
      }
    }
  };
  fetch("assets/land-points.json")
    .then(r=>{if(!r.ok)throw Error("world points missing");return r.json();})
    .then(data=>{
      if(!Array.isArray(data.points)||data.points.length<1000)throw Error("invalid geography");
      for(let i=0;i<data.points.length;i+=2)dots.push(toXYZ(data.points[i],data.points[i+1]));
      loaded=true;
      shell.dataset.geography="natural-earth";
      document.body.dataset.globeReady="true";
    })
    .catch(()=>{landFallback();loaded=true;shell.dataset.geography="fallback";document.body.dataset.globeReady="true";});

  function size(){
    const rect=shell.getBoundingClientRect();
    width=Math.max(180,rect.width);
    height=Math.max(180,rect.height);
    const nextDpr=Math.min(devicePixelRatio||1,1.7);
    if(canvas.width!==Math.round(width*nextDpr)||canvas.height!==Math.round(height*nextDpr)){
      dpr=nextDpr;
      canvas.width=Math.round(width*dpr);
      canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    cx=width/2;cy=height/2;radius=Math.min(width,height)*.385;
    shell.dataset.radius=radius.toFixed(1);
  }
  function line(latlon,constant,opacity,hemisphere="front"){
    ctx.beginPath();
    let started=false;
    for(let n=0;n<=240;n++){
      const value=-180+n*1.5;
      const p=latlon==="lat"?toXYZ(value,constant):toXYZ(constant,-90+n*.75);
      const q=projection(p);
      if((hemisphere==="front"&&q.front<.01)||(hemisphere==="back"&&q.front>-.01)){
        started=false;continue;
      }
      if(!started){ctx.moveTo(q.x,q.y);started=true;}
      else ctx.lineTo(q.x,q.y);
    }
    ctx.strokeStyle="rgba(182,107,212,"+opacity+")";
    ctx.lineWidth=hemisphere==="back"?.34:.48;
    ctx.stroke();
  }
  function draw(now){
    if(!loaded || !active)return;
    size();
    frameCount++;
    document.body.dataset.globeFrames=String(frameCount);
    document.body.dataset.globeYaw=yaw.toFixed(5);
    document.body.dataset.globePitch=pitch.toFixed(5);
    ctx.clearRect(0,0,width,height);

    // True transparent sphere: never paint a disc or any external glow.
    // Draw the far hemisphere first in a whisper of color. The page remains
    // visible through the globe, while orientation is clear in 3D.
    const scale=Math.max(.62,radius/230);
    for(let lat=-75;lat<=75;lat+=15)line("lat",lat,.035,"back");
    for(let lon=-180;lon<180;lon+=20)line("lon",lon,.03,"back");
    for(let k=0;k<dots.length;k++){
      const p=projection(dots[k]);
      if(p.front>=0)continue;
      const depth=Math.abs(p.front);
      ctx.fillStyle="rgba(176,126,200,"+(.055+depth*.075).toFixed(3)+")";
      ctx.beginPath();
      ctx.arc(p.x,p.y,(.35+.18*depth)*scale,0,PI*2);
      ctx.fill();
    }

    // The visible surface uses only fine map points and 3D gridlines.
    // Without a painted globe interior, the background shows between dots.
    for(let lat=-75;lat<=75;lat+=15)line("lat",lat,.105);
    for(let lon=-180;lon<180;lon+=20)line("lon",lon,.085);
    for(let k=0;k<dots.length;k++){
      const point=dots[k];
      const p=projection(point);
      if(p.front<.001)continue;
      const rim=.23+.77*p.front;
      const nearEurope=Math.abs(point.x)<.55&&point.y>.2;
      const rr=(.57+Math.sqrt(p.front)*.53)*scale;
      const alpha=nearEurope ? .30+rim*.66 : Math.max(.16,rim*.77);
      ctx.fillStyle=nearEurope
        ? "rgba(214,117,255,"+alpha.toFixed(3)+")"
        : "rgba(183,99,237,"+alpha.toFixed(3)+")";
      ctx.beginPath();ctx.arc(p.x,p.y,rr,0,PI*2);ctx.fill();
    }

    // No radial shading, opaque circle, rim halo or perimeter shadow.
    // This also leaves completely transparent pixels outside the map.
    
    // Copenhagen is a real projected geolocation, not a hard-coded pixel.
    const city=projection(toXYZ(COPENHAGEN.lon,COPENHAGEN.lat));
    const visible=city.front>.075;
    label.style.opacity=visible?"1":"0";
    label.style.left=city.x.toFixed(2)+"px";
    label.style.top=city.y.toFixed(2)+"px";
    document.body.dataset.copenhagenVisible=String(visible);
    if(visible){
      ctx.beginPath();ctx.arc(city.x,city.y,13*scale,0,PI*2);
      ctx.fillStyle="rgba(243,186,255,.15)";ctx.fill();
      ctx.beginPath();ctx.arc(city.x,city.y,6.3*scale,0,PI*2);
      ctx.strokeStyle="rgba(250,225,255,.85)";ctx.lineWidth=1.4*scale;ctx.stroke();
      ctx.beginPath();ctx.arc(city.x,city.y,2.9*scale,0,PI*2);
      ctx.fillStyle="#fff";ctx.fill();
    }
  }
  function update(t){
    let elapsed=Math.min(90,Math.max(0,(t-last)||16));
    last=t;
    active=document.body.classList.contains("frame-five-active")&&!document.hidden;
    if(active){
      if(!dragging && !reduced.matches && t>idleResume)
        yaw+=elapsed*.000014; // one slow revolution in ~7.5 minutes
      if(frames%2===0 || dragging)draw(t);
    }
    frames++;
    requestAnimationFrame(update);
  }
  function release(e){
    dragging=false;
    shell.classList.remove("is-dragging");
    idleResume=performance.now()+3500;
    if(e&&e.pointerId!=null){try{shell.releasePointerCapture(e.pointerId);}catch{}}
    shell.dataset.dragging="false";
  }
  shell.addEventListener("pointerdown",e=>{
    if(e.button!==0||!active)return;
    e.preventDefault();e.stopPropagation();
    dragging=true;wasMoved=false;
    lastX=e.clientX;lastY=e.clientY;
    idleResume=Number.POSITIVE_INFINITY;
    shell.classList.add("is-dragging");
    shell.dataset.dragging="true";
    try{shell.setPointerCapture(e.pointerId);}catch{}
  });
  shell.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    lastX=e.clientX;lastY=e.clientY;
    if(Math.abs(dx)+Math.abs(dy)>.2)wasMoved=true;
    yaw+=dx*.0062;
    pitch=clamp(pitch-dy*.005,-1.22,1.22);
    document.body.dataset.globeYaw=yaw.toFixed(5);
    e.stopPropagation();
  });
  shell.addEventListener("pointerup",release);
  shell.addEventListener("pointercancel",release);
  addEventListener("blur",()=>{if(dragging)release();});
  shell.tabIndex=0;
  shell.setAttribute("role","group");
  shell.setAttribute("aria-label","Interactive 3D globe. Use arrow keys to rotate; Copenhagen is highlighted.");
  shell.addEventListener("keydown",e=>{
    if(!active)return;
    const horizontal=e.key==="ArrowLeft"?-.16:e.key==="ArrowRight"?.16:0;
    const vertical=e.key==="ArrowUp"?.12:e.key==="ArrowDown"?-.12:0;
    if(!horizontal&&!vertical)return;
    e.stopPropagation();e.preventDefault();
    yaw+=horizontal;pitch=clamp(pitch+vertical,-1.22,1.22);
    idleResume=performance.now()+4500;
  });
  recenter?.addEventListener("click",()=>{
    yaw=initialYaw;pitch=initialPitch;
    idleResume=performance.now()+3800;
    document.body.dataset.globeYaw=yaw.toFixed(5);
  });
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(size):null;
  observer?.observe(shell);
  addEventListener("resize",size,{passive:true});
  size();
  requestAnimationFrame(update);
  window.soheilGlobe={
    center:(startSpinning=false)=>{yaw=initialYaw;pitch=initialPitch;idleResume=performance.now()+(startSpinning?0:3800);},
    getYaw:()=>yaw,
    getPitch:()=>pitch,
    isReady:()=>loaded,
    dotCount:()=>dots.length,
  };
})();
