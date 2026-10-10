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
    if(e.ctrlKey)return; // never block browser zoom gestures
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
  const arches=$$("#arched-world .arch");
  const reel=$("#photo-reel");
  const orb=$("#work-orbit");
  if(fine.matches){
    addEventListener("pointermove",e=>{
      if(reduced.matches)return;
      const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
      if(active===0)arches.forEach((a,i)=>{
        a.style.setProperty("--move-x",(x*(i-1)*-15).toFixed(2)+"px");
        a.style.setProperty("--move-y",(y*(i+1)*-8).toFixed(2)+"px");
        a.style.setProperty("--arch-rotate",(x*(i-1)*4).toFixed(2)+"deg");
      });
      if(active===1&&reel)reel.style.translate=(x*-24).toFixed(2)+"px "+(y*-15).toFixed(2)+"px";
      if(active===2&&orb)orb.style.transform="rotateX("+(-y*8).toFixed(2)+"deg) rotateY("+(x*9).toFixed(2)+"deg)";
      if(active===3)globeTarget=x*1.1;
    },{passive:true});
  }

  // Globe — mathematical 3D projection, no CDN or JS framework.
  const canvas=$("#globe");
  const shell=$(".globe-stage");
  const ctx=canvas?.getContext("2d",{alpha:true});
  let globeStarted=false,globeRunning=false,globeFrame=0,globeAngle=.52,globeTarget=0;
  let width=0,height=0,pixel=1,frameTime=0;
  const rad=Math.PI/180;
  const continentPolygons=[
    [[-167,64],[-150,71],[-125,70],[-111,60],[-96,52],[-82,52],[-60,46],[-81,8],[-101,16],[-108,29],[-118,33],[-129,48],[-167,60]],
    [[-84,13],[-73,12],[-60,8],[-51,-1],[-36,-10],[-43,-24],[-54,-35],[-69,-56],[-78,-39],[-81,-14]],
    [[-18,36],[-5,38],[11,34],[32,29],[40,12],[49,-12],[35,-27],[15,-35],[5,-29],[-2,-1],[-17,15]],
    [[-12,36],[-9,48],[5,59],[27,72],[49,67],[70,56],[97,60],[126,48],[152,55],[180,62],[180,10],[133,-9],[110,-7],[99,6],[80,7],[69,22],[50,32],[33,35],[30,42],[11,41],[-2,36]],
    [[112,-11],[133,-12],[155,-25],[150,-39],[126,-39],[114,-26]],
    [[-54,82],[-20,83],[-39,59],[-57,61]]
  ];
  function land(lon,lat){
    for(const polygon of continentPolygons){
      let inside=false;
      for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
        const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
        if((yi>lat)!==(yj>lat)&&lon<(xj-xi)*(lat-yi)/(yj-yi+1e-9)+xi)inside=!inside;
      }
      if(inside)return true;
    }
    return false;
  }
  const dots=[];
  // Fibonacci sampling produces a smooth point-cloud sphere.
  const samples=4200,phi=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<samples;i++){
    const y=1-(i/(samples-1))*2;
    const ring=Math.sqrt(1-y*y),theta=i*phi;
    const lon=Math.atan2(Math.sin(theta)*ring,Math.cos(theta)*ring)/rad;
    const lat=Math.asin(y)/rad;
    dots.push({x:Math.cos(theta)*ring,y,z:Math.sin(theta)*ring,land:land(lon,lat)});
  }
  function resizeGlobe(){
    if(!ctx||!shell)return;
    const b=shell.getBoundingClientRect();
    if(b.width<50)return;
    pixel=Math.min(devicePixelRatio||1,1.8);
    width=b.width;height=b.height;
    canvas.width=Math.round(width*pixel);canvas.height=Math.round(height*pixel);
    canvas.style.width=width+"px";canvas.style.height=height+"px";
    ctx.setTransform(pixel,0,0,pixel,0,0);
    drawGlobe();
  }
  function drawGlobe(){
    if(!ctx||width<1)return;
    ctx.clearRect(0,0,width,height);
    const cx=width*.5,cy=height*.5,R=Math.min(width,height)*.42;
    // Soft magenta halo emphasizes depth.
    const halo=ctx.createRadialGradient(cx,cy,R*.35,cx,cy,R*1.16);
    halo.addColorStop(0,"rgba(174,35,227,.08)");
    halo.addColorStop(.76,"rgba(171,18,229,.055)");
    halo.addColorStop(1,"rgba(154,16,193,0)");
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,R*1.18,0,Math.PI*2);ctx.fill();
    const sin=Math.sin(globeAngle),cos=Math.cos(globeAngle);
    for(const p of dots){
      const z=p.z*cos-p.x*sin;
      if(z<-.08)continue;
      const x=p.x*cos+p.z*sin;
      const d=(z+.08)/1.08;
      const radius=p.land?1.24:.52;
      ctx.fillStyle=p.land
        ?"rgba(214,38,255,"+(.24+.73*Math.max(0,d)).toFixed(3)+")"
        :"rgba(182,75,210,"+(.04+.15*Math.max(0,d)).toFixed(3)+")";
      ctx.beginPath();ctx.arc(cx+x*R,cy-p.y*R,radius*(.7+d*.52),0,Math.PI*2);ctx.fill();
    }
    // Copenhagen signal placed on the sphere's visible hemisphere.
    const cLat=55.7*rad,cLon=12.6*rad+globeAngle;
    const px=Math.sin(cLon)*Math.cos(cLat),pz=Math.cos(cLon)*Math.cos(cLat);
    if(pz>0){
      const x=cx+px*R,y=cy-Math.sin(cLat)*R;
      ctx.fillStyle="#fff";ctx.shadowColor="#d848ff";ctx.shadowBlur=19;
      ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
  }
  function paint(now){
    globeRunning=false;
    if(active!==3||document.hidden||!ctx||!globeStarted)return;
    if(now-frameTime>=33){
      if(!reduced.matches){
        globeAngle+=.0044+(globeTarget-(globeAngle%Math.PI*2))*.0007;
      }
      drawGlobe();frameTime=now;
    }
    globeFrame=requestAnimationFrame(paint);globeRunning=true;
  }
  function startGlobe(){
    if(!ctx)return;
    if(!globeStarted){globeStarted=true;resizeGlobe();}
    if(!globeRunning){globeFrame=requestAnimationFrame(paint);globeRunning=true}
  }
  addEventListener("resize",()=>{if(active===3)resizeGlobe()},{passive:true});
  document.addEventListener("visibilitychange",()=>{if(active===3&&!document.hidden)startGlobe()});
  reduced.addEventListener("change",()=>{if(active===3)drawGlobe()});
  if(Object.hasOwn(hashMap,location.hash))setFrame(hashMap[location.hash]);
})();
