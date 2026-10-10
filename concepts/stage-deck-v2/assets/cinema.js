/* SOHEIL — fixed frame director.
 * The browser page does not scroll; wheel, keyboard, swipe or frame controls
 * replace ONLY the stage. Header/footer/grid never leave the viewport.
 * The contact globe is a genuine 3D point projection in native Canvas.
 */
(() => {
  "use strict";
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const scenes=$$(".scene");
  const markers=$$(".episode-progress [data-jump]");
  const frameCount=$("#stage-count");
  const bar=$(".header-progress");
  const menu=$("#main-nav");
  const trigger=$("#menu-trigger");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const fine=matchMedia("(pointer: fine)");
  let active=0,frameLockedUntil=0,wheelAccum=0,lastWheelSign=0;
  let transitionToken=0, holding=false, reelDragging=false;
  const mobile=()=>matchMedia("(max-width: 760px)").matches;

  function menuOpen(open){
    menu?.classList.toggle("open",open);
    trigger?.setAttribute("aria-expanded",String(open));
    trigger?.setAttribute("aria-label",open?"Close navigation":"Open navigation");
  }
  trigger?.addEventListener("click",()=>menuOpen(trigger.getAttribute("aria-expanded")!=="true"));
  addEventListener("keydown",e=>{if(e.key==="Escape")menuOpen(false)});
  addEventListener("resize",()=>{if(!mobile())menuOpen(false)},{passive:true});

  function setFrame(next){
    const index=Math.max(0,Math.min(scenes.length-1,Math.round(next)));
    if(active===index&&scenes[index]?.classList.contains("is-current"))return;
    const old=active;
    const changing=index!==old;
    if(changing){
      document.body.dataset.travel=index<old?"back":"forward";
      const prev=scenes[old];
      prev?.classList.add("is-exiting");
      const portal=$("#transition-portal");
      if(portal&&!reduced.matches){portal.classList.remove("is-active");void portal.offsetWidth;portal.classList.add("is-active");}
      const token=++transitionToken;
      setTimeout(()=>{if(token===transitionToken){scenes.forEach(s=>s.classList.remove("is-exiting"));portal?.classList.remove("is-active");}},reduced.matches?25:1150);
    }
    active=index;
    document.body.dataset.episode=String(index);
    scenes.forEach((scene,i)=>{
      const on=i===index;
      scene.classList.toggle("is-current",on);
      scene.setAttribute("aria-hidden",String(!on));
      scene.inert=!on;
    });
    markers.forEach((button,i)=>{
      if(i===index)button.setAttribute("aria-current","step");
      else button.removeAttribute("aria-current");
    });
    if(frameCount)frameCount.textContent="FRAME "+String(index+1).padStart(2,"0")+" / 04";
    if(bar)bar.style.transform="scaleX("+((index+1)/scenes.length)+")";
    menuOpen(false);
    if(index===3) {
      startGlobe();
      requestAnimationFrame(resizeGlobe);
    }
  }
  setFrame(0);
  $$("[data-jump]").forEach(el=>el.addEventListener("click",e=>{
    e.preventDefault();
    setFrame(Number(el.dataset.jump));
  }));
  $("#next")?.addEventListener("click",()=>setFrame(active+1));
  $("#previous")?.addEventListener("click",()=>setFrame(active-1));

  // One mouse-wheel gesture produces ONE scene, not a long jump.
  addEventListener("wheel",e=>{
    if(e.ctrlKey)return; // preserve browser zoom
    if(e.target instanceof Element && e.target.closest(".globe-stage"))return; // wheel on globe zooms globe
    e.preventDefault();
    if(menu?.classList.contains("open"))return;
    const now=performance.now();
    const dy=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;
    if(Math.abs(dy)<1)return;
    if(now<frameLockedUntil)return;
    const sign=Math.sign(dy);
    if(sign!==lastWheelSign)wheelAccum=0;
    lastWheelSign=sign;
    const scaled=e.deltaMode===1?dy*18:e.deltaMode===2?dy*innerHeight:dy;
    wheelAccum+=scaled;
    if(Math.abs(wheelAccum)>=72){
      setFrame(active+(wheelAccum>0?1:-1));
      frameLockedUntil=now+(reduced.matches?360:860);
      wheelAccum=0;
    }
  },{passive:false});
  addEventListener("keydown",e=>{
    const tag=document.activeElement?.tagName;
    if(["INPUT","TEXTAREA","SELECT"].includes(tag)||e.altKey||e.ctrlKey||e.metaKey)return;
    if(["ArrowDown","PageDown"," "].includes(e.key)){e.preventDefault();setFrame(active+1)}
    if(["ArrowUp","PageUp"].includes(e.key)){e.preventDefault();setFrame(active-1)}
    if(e.key==="Home"){e.preventDefault();setFrame(0)}
    if(e.key==="End"){e.preventDefault();setFrame(3)}
  });
  let touchStartY=0,touchStartX=0;
  addEventListener("touchstart",e=>{
    if(e.touches.length!==1)return;
    touchStartY=e.touches[0].clientY;
    touchStartX=e.touches[0].clientX;
  },{passive:true});
  addEventListener("touchend",e=>{
    if(!e.changedTouches.length||!touchStartY)return;
    const dy=touchStartY-e.changedTouches[0].clientY;
    const dx=touchStartX-e.changedTouches[0].clientX;
    touchStartY=0;
    if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.3)setFrame(active+(dy>0?1:-1));
  },{passive:true});
  const hashMap={"#scene-intro":0,"#scene-human":1,"#scene-work":2,"#scene-contact":3};


  // Gentle pointer perspective for landscape windows and photography reel.
  const arches=$("#arched-world .arch");
  const archedWorld=$("#arched-world");
  const reel=$("#photo-reel");
  const orb=$("#work-orbit");
  const title=$(".hero-title");
  const deck=$("#deck");
  let reelOffset=0,reelTarget=0,reelStart=0,reelStartOffset=0;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const setReel=(value)=>{reelTarget=clamp(value,-200,180);if(reel)reel.style.translate=reelTarget+"px 0px";};
  if(reel){
    reel.addEventListener("pointerdown",e=>{
      if(e.button!==0)return;
      reelDragging=true;reelStart=e.clientX;reelStartOffset=reelTarget;
      reel.classList.add("is-dragging");reel.setPointerCapture(e.pointerId);
    });
    reel.addEventListener("pointermove",e=>{if(reelDragging)setReel(reelStartOffset+(e.clientX-reelStart)*.85)});
    const stopReel=()=>{reelDragging=false;reel.classList.remove("is-dragging");};
    reel.addEventListener("pointerup",stopReel);reel.addEventListener("pointercancel",stopReel);
  }
  if(deck){
    deck.addEventListener("pointerdown",e=>{
      if(e.button!==0 || e.target.closest("a,button,canvas,.reel"))return;
      holding=true;document.body.classList.add("is-grabbing");
      try{deck.setPointerCapture(e.pointerId)}catch{}
    });
    const stopHold=()=>{
      holding=false;document.body.classList.remove("is-grabbing");
      archedWorld?.style.setProperty("--camera-scale","1");
    };
    deck.addEventListener("pointerup",stopHold);deck.addEventListener("pointercancel",stopHold);
  }

  if(fine.matches){
    addEventListener("pointermove",e=>{
      if(reduced.matches)return;
      const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
      if(active===0){
        arches.forEach((a,i)=>{
          a.style.setProperty("--move-x",(x*(i-1)*(holding?-65:-24)).toFixed(2)+"px");
          a.style.setProperty("--move-y",(y*(i+1)*(holding?-34:-12)).toFixed(2)+"px");
          a.style.setProperty("--arch-rotate",(x*(i-1)*(holding?12:5)).toFixed(2)+"deg");
        });
        archedWorld?.style.setProperty("--camera-x",(x*(holding?-78:-26)).toFixed(2)+"px");
        archedWorld?.style.setProperty("--camera-y",(y*(holding?-63:-23)).toFixed(2)+"px");
        archedWorld?.style.setProperty("--camera-scale",holding?"1.13":"1");
        title?.style.setProperty("--type-x",(x*12).toFixed(2)+"px");
        title?.style.setProperty("--type-y",(y*8).toFixed(2)+"px");
      }
      if(active===1&&reel&&!reelDragging)reel.style.transform="translate(calc(-43% + "+(x*-22).toFixed(2)+"px),calc(-49% + "+(y*-16).toFixed(2)+"px)) rotateX(3deg)";
      if(active===2&&orb)orb.style.transform="rotateX("+(-y*(holding?19:9)).toFixed(2)+"deg) rotateY("+(x*(holding?22:13)).toFixed(2)+"deg)";
      // The contact globe is controlled by direct dragging, never by page-wide cursor position.
    },{passive:true});
  }


  // Copenhagen-centred, draggable native Canvas 3D globe.
  // Spherical coordinates are geographic: latitude and longitude.
  const canvas=$("#globe");
  const shell=$(".globe-stage");
  const label=$("#copenhagen-label");
  const ctx=canvas?.getContext("2d",{alpha:true});
  const RAD=Math.PI/180, CPH={lat:55.6761*RAD,lon:12.5683*RAD};
  let yaw=CPH.lon, pitch=.17, globeZoom=1, targetYaw=yaw,targetPitch=pitch,targetZoom=1;
  let globeStarted=false,globePending=false,globeDragging=false,globePointer=0;
  let dragX=0,dragY=0,dragYaw=0,dragPitch=0,angularVelocity=0,previousYaw=yaw;
  let gw=0,gh=0,scale=1,lastTick=0;
  const polygons=[
    [[-168,65],[-148,72],[-127,69],[-115,58],[-99,52],[-82,49],[-65,47],[-79,8],[-96,14],[-113,29],[-125,46]],
    [[-82,12],[-72,10],[-62,9],[-50,-2],[-35,-11],[-46,-26],[-52,-35],[-71,-56],[-77,-30]],
    [[-17,36],[-3,36],[14,32],[32,31],[40,13],[48,-12],[35,-27],[17,-35],[10,-24],[4,-1],[-17,18]],
    [[-11,36],[-9,46],[-1,49],[3,57],[15,60],[24,70],[31,71],[38,60],[50,55],[67,52],[86,60],[112,56],[123,45],[142,45],[161,58],[177,61],[180,9],[148,0],[135,-8],[111,-6],[101,11],[77,9],[67,23],[45,32],[33,40],[20,41],[11,45],[1,40]],
    [[112,-11],[131,-12],[155,-26],[148,-40],[126,-39],[114,-27]],
    [[-52,82],[-19,83],[-39,59],[-57,60]]
  ];
  function land(lon,lat){
    for(const shape of polygons){
      let inside=false;
      for(let i=0,j=shape.length-1;i<shape.length;j=i++){
        const [xi,yi]=shape[i],[xj,yj]=shape[j];
        if((yi>lat)!==(yj>lat)&&lon<(xj-xi)*(lat-yi)/(yj-yi+1e-9)+xi)inside=!inside;
      }
      if(inside)return true;
    }
    return false;
  }
  const dots=[];
  const N=matchMedia("(max-width:760px)").matches?3100:5400;
  const goldenAngle=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<N;i++){
    const y=1-2*i/(N-1),ring=Math.sqrt(1-y*y),a=i*goldenAngle;
    // Coordinate convention: front of globe is positive z.
    const lon=Math.atan2(Math.cos(a)*ring,Math.sin(a)*ring);
    const lat=Math.asin(y);
    dots.push({lon,lat,land:land(lon/RAD,lat/RAD)});
  }
  function project(lat,lon){
    const d=lon-yaw,cosLat=Math.cos(lat);
    const x=cosLat*Math.sin(d),z=cosLat*Math.cos(d),y=Math.sin(lat);
    const yy=y*Math.cos(pitch)-z*Math.sin(pitch);
    const zz=y*Math.sin(pitch)+z*Math.cos(pitch);
    return {x,y:yy,z:zz};
  }
  function resizeGlobe(){
    if(!ctx||!shell)return;
    const r=shell.getBoundingClientRect();
    if(r.width<50)return;
    gw=r.width;gh=r.height;scale=Math.min(devicePixelRatio||1,1.6);
    canvas.width=Math.round(gw*scale);canvas.height=Math.round(gh*scale);
    canvas.style.width=gw+"px";canvas.style.height=gh+"px";
    ctx.setTransform(scale,0,0,scale,0,0);
    drawGlobe();
  }
  function drawGlobe(){
    if(!ctx||!gw)return;
    const cx=gw*.5,cy=gh*.5,R=Math.min(gw,gh)*.414*globeZoom;
    ctx.clearRect(0,0,gw,gh);
    const halo=ctx.createRadialGradient(cx,cy,R*.3,cx,cy,R*1.2);
    halo.addColorStop(0,"rgba(222,46,253,.04)");halo.addColorStop(.78,"rgba(199,30,248,.06)");
    halo.addColorStop(1,"rgba(183,40,216,0)");
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,R*1.2,0,Math.PI*2);ctx.fill();
    const backColor="rgba(155,64,194,.14)";
    const frontColor="rgba(216,38,255,";
    for(const dot of dots){
      const p=project(dot.lat,dot.lon);
      if(p.z<0)continue;
      const depth=.3+.7*p.z;
      ctx.fillStyle=dot.land?frontColor+(.21+.77*depth).toFixed(3)+")":backColor;
      ctx.beginPath();
      ctx.arc(cx+p.x*R,cy-p.y*R,(dot.land?1.16:.55)*(.68+depth*.44)*globeZoom,0,Math.PI*2);
      ctx.fill();
    }
    // Latitude line of Copenhagen, faint and useful as depth orientation.
    ctx.strokeStyle="rgba(230,153,255,.11)";ctx.lineWidth=.7;
    ctx.beginPath();
    for(let i=0;i<=160;i++){
      const p=project(CPH.lat,(i/160*2-1)*Math.PI);
      if(p.z<0)continue;
      const xx=cx+p.x*R,yy=cy-p.y*R;
      if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.stroke();
    const pin=project(CPH.lat,CPH.lon);
    const shown=pin.z>.08;
    if(label){
      label.classList.toggle("is-visible",shown);
      if(shown){
        label.style.left=(cx+pin.x*R)+"px";
        label.style.top=(cy-pin.y*R)+"px";
      }
    }
    if(shown){
      const px=cx+pin.x*R,py=cy-pin.y*R,t=performance.now();
      const wave=10+(t/40)%15;
      ctx.strokeStyle="rgba(237,173,255,"+(.5-(wave-10)/42).toFixed(3)+")";
      ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(px,py,wave,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#fff";ctx.shadowColor="#e451fc";ctx.shadowBlur=18;
      ctx.beginPath();ctx.arc(px,py,4.9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
    if(canvas){
      canvas.dataset.yaw=yaw.toFixed(5);
      canvas.dataset.pitch=pitch.toFixed(5);
      canvas.dataset.zoom=globeZoom.toFixed(3);
      canvas.dataset.copenhagenVisible=String(shown);
    }
  }
  function render(now){
    globePending=false;
    if(active!==3||document.hidden||!globeStarted)return;
    const dt=Math.min(.05,Math.max(.001,(now-lastTick)/1000));lastTick=now;
    if(!reduced.matches){
      if(!globeDragging)targetYaw+=angularVelocity*dt;
      angularVelocity*=Math.pow(.18,dt);
      yaw+=(targetYaw-yaw)*Math.min(1,dt*7);
      pitch+=(targetPitch-pitch)*Math.min(1,dt*8);
      globeZoom+=(targetZoom-globeZoom)*Math.min(1,dt*8);
    }else{
      yaw=targetYaw;pitch=targetPitch;globeZoom=targetZoom;
    }
    drawGlobe();
    if(!reduced.matches||Math.abs(targetYaw-yaw)>.0001)requestGlobeFrame();
  }
  function requestGlobeFrame(){
    if(!globePending){globePending=true;requestAnimationFrame(render)}
  }
  function startGlobe(){
    if(!ctx)return;
    if(!globeStarted){globeStarted=true;resizeGlobe();}
    lastTick=performance.now();requestGlobeFrame();
  }
  function resetCopenhagen(){
    targetYaw=CPH.lon;targetPitch=.17;targetZoom=1;angularVelocity=0;startGlobe();
  }
  if(canvas){
    canvas.addEventListener("pointerdown",e=>{
      if(e.button!==0)return;
      e.stopPropagation();
      globeDragging=true;dragX=e.clientX;dragY=e.clientY;
      dragYaw=targetYaw;dragPitch=targetPitch;
      angularVelocity=0;globePointer=e.pointerId;
      canvas.classList.add("is-dragging");canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove",e=>{
      if(!globeDragging||globePointer!==e.pointerId)return;
      const dx=e.clientX-dragX,dy=e.clientY-dragY;
      const last=targetYaw;
      targetYaw=dragYaw-dx*.0075;
      targetPitch=clamp(dragPitch+dy*.006,-1.22,1.22);
      angularVelocity=clamp((targetYaw-last)*36,-2.2,2.2);
      requestGlobeFrame();
    });
    const stopDrag=e=>{
      if(globePointer!==e.pointerId)return;
      globeDragging=false;canvas.classList.remove("is-dragging");requestGlobeFrame();
    };
    canvas.addEventListener("pointerup",stopDrag);canvas.addEventListener("pointercancel",stopDrag);
    canvas.addEventListener("wheel",e=>{
      e.preventDefault();e.stopPropagation();
      targetZoom=clamp(targetZoom+(e.deltaY<0?.11:-.11),.7,1.48);
      startGlobe();
    },{passive:false});
    canvas.addEventListener("touchend",e=>e.stopPropagation(),{passive:true});
    canvas.addEventListener("keydown",e=>{
      const map={ArrowLeft:[-.24,0],ArrowRight:[.24,0],ArrowUp:[0,-.17],ArrowDown:[0,.17]};
      if(map[e.key]){
        e.preventDefault();e.stopPropagation();
        targetYaw+=map[e.key][0];targetPitch=clamp(targetPitch+map[e.key][1],-1.22,1.22);
        startGlobe();
      }
      if(e.key==="+"||e.key==="="){e.preventDefault();e.stopPropagation();targetZoom=clamp(targetZoom+.12,.7,1.48);startGlobe();}
      if(e.key==="-"){e.preventDefault();e.stopPropagation();targetZoom=clamp(targetZoom-.12,.7,1.48);startGlobe();}
    });
  }
  $("#globe-zoom-in")?.addEventListener("click",()=>{targetZoom=clamp(targetZoom+.16,.7,1.48);startGlobe()});
  $("#globe-zoom-out")?.addEventListener("click",()=>{targetZoom=clamp(targetZoom-.16,.7,1.48);startGlobe()});
  $("#globe-home")?.addEventListener("click",resetCopenhagen);
  addEventListener("resize",()=>{if(active===3)resizeGlobe()},{passive:true});
  document.addEventListener("visibilitychange",()=>{if(active===3&&!document.hidden)startGlobe()});
  reduced.addEventListener("change",()=>{if(active===3)startGlobe()});
  if(Object.hasOwn(hashMap,location.hash))setFrame(hashMap[location.hash]);
})();
