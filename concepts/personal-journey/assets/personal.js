/* Immersive Studio — original scroll-led 3D engineering scene
 * Runtime: pinned Three.js ES module, progressive WebGL enhancement.
 * Desktop pointer influence, four camera chapters, responsive and reduced motion.
 * Real content remains semantic HTML without JavaScript or WebGL.
 */
(() => {
  "use strict";
  const $ = (q, context = document) => context.querySelector(q);
  const $$ = (q, context = document) => [...context.querySelectorAll(q)];
  const root = $(".experience");
  const canvas = $("#world");
  const panels = $$(".story-panel");
  const indicators = $(".timeline-bars i");
  const episodeNav = $(".stage-index button[data-episode]");
  const counter = $("[data-current-stage]");
  const motionControl = $("#motion");
  const quality = $("#quality");
  const screen = $(".experience-sticky");
  const nav = $("#main-navigation");
  const menuButton = $("#menu-button");
  let current = 0;
  let manualStill = false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(pointer: fine)");
  const isStill = () => manualStill || reduce.matches;

  function changeStage(index) {
    const clamped = Math.max(0, Math.min(3, index));
    if (clamped === current && panels[clamped]?.classList.contains("active")) return;
    current = clamped;
    panels.forEach((p, i) => {
      const shown = i === current;
      p.classList.toggle("active", shown);
      p.setAttribute("aria-hidden", String(!shown));
      p.inert = !shown;
    });
    indicators.forEach((el,i)=>el.classList.toggle("on",i<=current));
    episodeNav.forEach((el,i)=>{if(i===current)el.setAttribute("aria-current","step");else el.removeAttribute("aria-current")});
    if(counter)counter.textContent=String(current+1).padStart(2,"0");
    if(screen)screen.dataset.stage=String(current);
  }
  changeStage(0);
  const jumpToEpisode = i => {
    if (!root) return;
    const max=Math.max(1,root.offsetHeight-innerHeight);
    const normalized=Math.min(.97,(i+.32)/4);
    scrollTo({top:root.offsetTop+normalized*max,behavior:reduce.matches?"instant":"smooth"});
  };
  episodeNav.forEach((button,i)=>button.addEventListener("click",()=>jumpToEpisode(i)));
  $("[data-next-episode]")?.addEventListener("click",()=>{
    if(current===3)document.querySelector("#content")?.scrollIntoView({behavior:reduce.matches?"instant":"smooth"});
    else jumpToEpisode(current+1);
  });

  const toggleMenu = open => {
    if (!nav || !menuButton) return;
    nav.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded",String(open));
    menuButton.setAttribute("aria-label",open?"Close menu":"Open menu");
  };
  menuButton?.addEventListener("click",()=>toggleMenu(menuButton.getAttribute("aria-expanded")!=="true"));
  nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>toggleMenu(false)));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")toggleMenu(false)});
  matchMedia("(min-width: 741px)").addEventListener("change",e=>{if(e.matches)toggleMenu(false)});
  const y = $("[data-year]"); if(y)y.textContent=String(new Date().getFullYear());

  let floatStage=0, sceneVisible=true, lastScrollY=-1;
  function onScroll() {
    const header=$(".site-head");
    if(header)header.classList.toggle("scrolled",scrollY>Math.max(90,innerHeight*.89));
    if (!root) return;
    const r=root.getBoundingClientRect();
    const scrollRange=Math.max(1,root.offsetHeight-innerHeight);
    const p=Math.max(0,Math.min(1,-r.top/scrollRange));
    floatStage=p*3;
    changeStage(Math.min(3,Math.floor(p*4)));
    lastScrollY=scrollY;
  }
  let waiting=false;
  function onScrollThrottled() {
    if(waiting)return;
    waiting=true;
    requestAnimationFrame(()=>{waiting=false;onScroll()});
  }
  addEventListener("scroll",onScrollThrottled,{passive:true});
  addEventListener("resize",onScrollThrottled,{passive:true});
  onScroll();
  // The real WordPress portrait adds a human focal point to the 3D opening.
  const photo = $(".portrait-stage");
  if(photo && fine.matches){
    const handlePortraitPointer = e => {
      if(isStill())return;
      const dx=(e.clientX/innerWidth-.5);
      photo.style.setProperty("--photo-tilt",(dx*7).toFixed(2)+"deg");
      photo.style.setProperty("--photo-lift",(-dx*14).toFixed(1)+"px");
    };
    screen?.addEventListener("pointermove",handlePortraitPointer,{passive:true});
    screen?.addEventListener("pointerleave",()=>{
      photo.style.setProperty("--photo-tilt","0deg");
      photo.style.setProperty("--photo-lift","0px");
    });
  }
  const observer=root&&"IntersectionObserver" in window?new IntersectionObserver(entries=>{
    sceneVisible=!!entries[0]?.isIntersecting;
  },{rootMargin:"150px 0px",threshold:.01}):null;
  if(observer)observer.observe(root);

  function updateMotionLabel() {
    if(!motionControl)return;
    const still=isStill();
    motionControl.textContent=still?"Enable motion":"Reduce motion";
    motionControl.setAttribute("aria-pressed",String(still));
  }
  motionControl?.addEventListener("click",()=>{manualStill=!manualStill;updateMotionLabel()});
  reduce.addEventListener("change",updateMotionLabel);
  updateMotionLabel();

  // Scene is explicitly decorative and is never essential to accessing content.
  async function bootWebGL(){
    if(!canvas || isStill())return;
    let T;
    try{
      T=await import("https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js");
    }catch(e){console.info("Using CSS 3D fallback because Three.js is unavailable.");return;}
    let renderer;
    try{
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
    }catch(e){console.info("WebGL unavailable; CSS fallback remains visible.");return;}
    const scene=new T.Scene();
    scene.fog=new T.FogExp2(0x131329,.018);
    const camera=new T.PerspectiveCamera(39,1,.1,110);
    const room=new T.Group();room.position.x=3.2;scene.add(room);
    scene.add(new T.HemisphereLight(0xcce9ff,0x110a2a,2.0));
    const light=(color,intensity,x,y,z)=>{const l=new T.PointLight(color,intensity,17);l.position.set(x,y,z);scene.add(l)};
    light(0xa58bff,75,1.5,4.7,4.5);
    light(0x70eff4,65,6.8,1.1,-2.3);
    light(0xffffff,38,3.0,5.5,-6);
    const mat=(color,metal=.12,rough=.35,extra={})=>new T.MeshStandardMaterial({color,metalness:metal,roughness:rough,...extra});
    const dark=mat(0x182947,.57,.26),edge=mat(0x35466c,.5,.25),silver=mat(0xe4e5f6,.63,.18),glass=mat(0x91b6f3,.15,.05,{transparent:true,opacity:.20,depthWrite:false}),aqua=mat(0x6bf1e2,.2,.28,{emissive:0x008b99,emissiveIntensity:1.6}),violet=mat(0xc59bff,.3,.23,{emissive:0x5543c3,emissiveIntensity:1.2}),glow=mat(0x8cbbff,.25,.22,{emissive:0x1739a2,emissiveIntensity:1.8});
    const basic=(color,opacity=.65)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});
    const box=(w,h,d,m,x,y,z,parent=room)=>{const ob=new T.Mesh(new T.BoxGeometry(w,h,d),m);ob.position.set(x,y,z);parent.add(ob);return ob};
    const cylinder=(r,thick,m,x,y,z,parent=room)=>{const ob=new T.Mesh(new T.CylinderGeometry(r,r,thick,64),m);ob.position.set(x,y,z);parent.add(ob);return ob};
    const torus=(radius,tube,m,x,y,z,rx,ry,rz,parent=room)=>{const o=new T.Mesh(new T.TorusGeometry(radius,tube,8,96),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);parent.add(o);return o};
    const addLine=(points,color=0x8debe9,opacity=.8)=>{
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
      const line=new T.Mesh(new T.TubeGeometry(curve,80,.018,6,false),basic(color,opacity));
      room.add(line);return curve;
    };

    // Floating architectural floor — not a data-center floorplan or real system.
    box(10.6,.23,7.0,edge,0,-2.45,0);
    box(10.3,.09,6.8,dark,0,-2.26,0);
    for(let i=-5;i<=5;i++){
      const b=box(.013,.006,6.77,basic(0x95bbdc,.22),i,-2.195,0);
    }
    for(let j=-3;j<=3;j++)box(10.35,.006,.013,basic(0x95bbdc,.22),0,-2.19,j);
    for (let i = 0; i < 5; i++) {
      cylinder(.052,.013,i%2?aqua:violet,-3.4+i*1.67,-2.18,2.65);
    }

    // Sculptural rack array. Geometry has operational meaning without exposing customer systems.
    const racks=new T.Group();room.add(racks);
    for(let n=0;n<3;n++){
      const rack=new T.Group();rack.position.set(-2.8+n*1.15,-.25,-.85+n*.25);
      racks.add(rack);
      box(.84,3.1,1.0,silver,0,0,0,rack);
      box(.73,2.92,.11,dark,0,0,.54,rack);
      box(.85,.1,1.04,edge,0,1.55,0,rack);
      box(.85,.1,1.04,edge,0,-1.55,0,rack);
      for(let i=0;i<10;i++){
        const yy=-1.27+i*.275;
        box(.59,.14,.034,i%4===0?violet:edge,0,yy,.608,rack);
        for(let q=0;q<4;q++)box(.026,.023,.015,i%3===0?aqua:glow,-.19+q*.13,yy,.64,rack);
      }
      box(.045,3.0,.035,aqua,-.35,0,.63,rack);
      rack.rotation.y=-.11+n*.12;
    }

    // Suspended central "data nucleus", surrounded by orbital connections.
    const nucleus=new T.Group();nucleus.position.set(1.4,.12,.2);room.add(nucleus);
    const crystal=new T.Mesh(new T.IcosahedronGeometry(1.12,2),glass);nucleus.add(crystal);
    const solid=new T.Mesh(new T.IcosahedronGeometry(.77,1),mat(0x789be5,.7,.15,{emissive:0x271e88,emissiveIntensity:.35}));nucleus.add(solid);
    const wire=new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(1.20,1)),new T.LineBasicMaterial({color:0xcceaff,transparent:true,opacity:.66}));nucleus.add(wire);
    torus(1.70,.018,basic(0x8cf0e3,.85),0,0,0,.5,-.16,.18,nucleus);
    torus(1.48,.019,basic(0xc9a7ff,.81),0,0,0,1.3,.7,.27,nucleus);
    torus(2.09,.015,basic(0x749afe,.64),0,0,0,.4,1.5,0,nucleus);
    for(let n=0;n<8;n++){
      const alpha=n*Math.PI/4;
      const dot=new T.Mesh(new T.SphereGeometry(.066,12,12),n%2?aqua:violet);
      dot.position.set(Math.cos(alpha)*1.62,Math.sin(alpha)*1.48,.15*Math.sin(2*alpha));
      nucleus.add(dot);
    }

    // Production target: energy portal and terminal beacon.
    const portal=new T.Group();portal.position.set(4.0,.05,-.8);room.add(portal);
    torus(1.43,.07,edge,0,0,0,.15,.2,0,portal);
    torus(1.13,.018,basic(0x9cf8e8,.94),0,0,.1,.15,.2,0,portal);
    torus(.89,.012,basic(0xc6b6ff,.83),0,0,.13,.15,.2,0,portal);
    const core=new T.Mesh(new T.OctahedronGeometry(.76,1),mat(0x61d8e3,.48,.18,{emissive:0x006a91,emissiveIntensity:.8}));portal.add(core);
    box(2.9,.13,2.9,edge,4.0,-2.15,-.7);
    cylinder(.85,.14,silver,4.0,-1.85,-.7);

    const paths=[
      addLine([[-2.1,.7,-.1],[-.8,1.25,.6],[.45,.9,.5],[1.45,.5,.3]],0x88f5f0,.85),
      addLine([[-2.1,-.5,1.1],[-.7,-.25,1.0],[.6,-.8,.6],[1.5,-.25,.4]],0xae9eff,.8),
      addLine([[1.7,.3,.2],[2.8,.9,-.4],[3.9,.5,-.7]],0x9eddf9,.88)
    ];
    const packets=[];
    for(let n=0;n<13;n++){
      const sphere=new T.Mesh(new T.SphereGeometry(.05,12,12),n%2?aqua:violet);
      room.add(sphere);packets.push({mesh:sphere,path:paths[n%3],offset:n/13});
    }

    // Slow distant particle layers; modest count for weaker GPUs.
    const count=115,coords=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const seed=(i*73129 % 997)/997;
      coords[i*3]=(seed-.5)*28;
      coords[i*3+1]=((i*3571%991)/991-.5)*14;
      coords[i*3+2]=-8+((i*2663%983)/983)*8;
    }
    const pg=new T.BufferGeometry();pg.setAttribute("position",new T.BufferAttribute(coords,3));
    const dust=new T.Points(pg,new T.PointsMaterial({color:0xc6b7f5,size:.045,transparent:true,opacity:.56,sizeAttenuation:true}));
    scene.add(dust);

    const chapterCameras=[
      {pos:[10.8,5.0,12.6],look:[1.5,-.10,0]},
      {pos:[5.0,3.3,8.0],look:[-1.15,.1,-.75]},
      {pos:[7.9,3.4,6.7],look:[1.35,.2,.1]},
      {pos:[8.8,2.6,8.0],look:[3.1,.0,-.8]},
    ];
    const eye=new T.Vector3(...chapterCameras[0].pos);
    const focus=new T.Vector3(...chapterCameras[0].look);
    camera.position.copy(eye);camera.lookAt(focus);
    let pointerX=0,pointerY=0,smoothedX=0,smoothedY=0;
    if(fine.matches){
      screen.addEventListener("pointermove",e=>{
        const r=screen.getBoundingClientRect();
        pointerX=((e.clientX-r.left)/r.width-.5)*.70;
        pointerY=((e.clientY-r.top)/r.height-.5)*.34;
      },{passive:true});
      screen.addEventListener("pointerleave",()=>{pointerX=0;pointerY=0});
    }
    function resize(){
      const w=Math.max(1,screen.clientWidth),h=Math.max(1,screen.clientHeight);
      const mode=quality?.value||"auto";
      renderer.setPixelRatio(Math.min(devicePixelRatio||1, mode==="low"?1:mode==="high"?1.75:innerWidth<740?1.1:1.45));
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<740?48:39;camera.updateProjectionMatrix();
    }
    quality?.addEventListener("change",resize);
    addEventListener("resize",resize,{passive:true});resize();
    let time=0,then=performance.now(),frame=0,needsStillFrame=true;
    function loop(now){
      requestAnimationFrame(loop);
      if(!sceneVisible || document.hidden)return;
      // Stop unnecessary updates in reduced-motion mode, but still permit step changes.
      if(isStill() && !needsStillFrame && Math.abs(floatStage-frame)<.01)return;
      let dt=Math.min(.06,Math.max(0,(now-then)/1000));then=now;
      const target=Math.min(3,Math.max(0,floatStage));
      frame+=(target-frame)*(isStill()?1:Math.min(1,dt*2.2));
      const lo=Math.floor(frame),hi=Math.min(3,lo+1),t=frame-lo;
      const targetPos=new T.Vector3(...chapterCameras[lo].pos).lerp(new T.Vector3(...chapterCameras[hi].pos),t);
      const targetLook=new T.Vector3(...chapterCameras[lo].look).lerp(new T.Vector3(...chapterCameras[hi].look),t);
      // Keep 3D content higher in the frame on mobile, leaving space for captions.
      if(innerWidth<740){targetPos.y+=2;targetPos.z+=2;targetLook.y+=.7}
      smoothedX+=(pointerX-smoothedX)*Math.min(1,dt*2.4);
      smoothedY+=(pointerY-smoothedY)*Math.min(1,dt*2.4);
      targetPos.x+=isStill()?0:smoothedX;targetPos.y+=isStill()?0:-smoothedY;
      eye.lerp(targetPos,isStill()?1:Math.min(1,dt*2.5));focus.lerp(targetLook,isStill()?1:Math.min(1,dt*2.5));
      camera.position.copy(eye);camera.lookAt(focus);
      if(!isStill()){
        time+=Math.min(.07,dt);
        nucleus.rotation.y=time*.15; nucleus.rotation.x=Math.sin(time*.28)*.055;
        crystal.rotation.y=-time*.25;
        core.rotation.set(time*.14,time*.19,0);
        packets.forEach(({mesh,path,offset})=>mesh.position.copy(path.getPoint(((offset+time*.055)%1+1)%1)));
        dust.rotation.y=time*.006;
      }
      renderer.render(scene,camera);
      needsStillFrame=false;
    }
    const previousUpdate=onScrollThrottled;
    document.documentElement.classList.add("webgl-ready");
    motionControl?.addEventListener("click",()=>{needsStillFrame=true});
    reduce.addEventListener("change",()=>{needsStillFrame=true});
    quality?.addEventListener("change",()=>{needsStillFrame=true});
    requestAnimationFrame(loop);
  }
  let tried=false;
  function start(){
    if(tried || !canvas || isStill())return;
    tried=true;bootWebGL();
  }
  // Boot at an idle moment, except for reduced motion.
  if("requestIdleCallback" in window)requestIdleCallback(start,{timeout:900});
  else setTimeout(start,160);
  motionControl?.addEventListener("click",start);
  reduce.addEventListener("change",start);
})();
