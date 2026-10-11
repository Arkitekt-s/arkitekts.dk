/* Three cinematic worlds for Frames 01–03.
 * 01 = original mountain video (untouched).
 * 02 = original, rendered server-room corridor.
 * 03 = original, rendered Linux/Ansible automation workspace.
 * Hold switches one world while the translucent liquid wave travels
 * across the ENTIRE viewport, including header and footer.
 * The scroll journey, arches, text, gallery and contact remain unchanged.
 */
(() => {
  "use strict";
  const stage=document.getElementById("frame");
  const panorama=document.getElementById("panorama");
  const shade=document.querySelector(".portal-shade");
  const arches=[...document.querySelectorAll("#panorama .arch")];
  if(!stage||!panorama||!shade||arches.length!==3)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const SCENE_NAMES=["Mountain Film","Server Infrastructure","Linux & Automation"];
  const LABELS=[
    ["DATA CENTER","RHEL  /  NODES","PRODUCTION  /  24×7"],
    ["LINUX  /  RHEL","ANSIBLE PLAYBOOKS","KAFKA  →  LOGSTASH  →  ES"]
  ];
  const FILM_SPEED=.70;
  // Keep the owner's selected slower pace on the original mountain film.
  const originalFilms=[...document.querySelectorAll("#panorama .arch-video"),
    document.getElementById("portal-film")].filter(Boolean);
  const slowFilms=()=>{
    originalFilms.forEach(video=>{
      if(Math.abs(video.playbackRate-FILM_SPEED)>.001)
        video.playbackRate=FILM_SPEED;
    });
  };
  originalFilms.forEach(video=>{
    video.addEventListener("loadedmetadata",slowFilms);
    video.addEventListener("playing",slowFilms);
  });
  slowFilms();

  // Single full-quality canvas, cropped to form one continuous film.
  // It is redrawn for the arches and the full-screen 02–03 journey.
  const source=document.createElement("canvas");
  source.width=1200;source.height=675;
  const g=source.getContext("2d",{alpha:false});
  if(!g)return;
  const W=source.width,H=source.height;

  const panes=arches.map((arch,index)=>{
    const canvas=document.createElement("canvas");
    canvas.className="hold-scene-paint";
    canvas.setAttribute("aria-hidden","true");
    arch.append(canvas);
    const overlay=document.createElement("div");
    overlay.className="hold-scene-tech";
    overlay.setAttribute("aria-hidden","true");
    const number=document.createElement("span");
    number.className="hold-tech-top";
    number.textContent=String(index+1).padStart(2,"0")+"  /  03";
    const flow=document.createElement("span");
    flow.className="hold-tech-flow";
    for(let n=0;n<3;n++){
      const light=document.createElement("i");
      light.style.setProperty("--unit",String(n));
      flow.append(light);
    }
    const label=document.createElement("span");
    label.className="hold-tech-label";
    overlay.append(number,flow,label);
    arch.append(overlay);
    return {arch,canvas,ctx:canvas.getContext("2d",{alpha:true}),label};
  });

  const full=document.createElement("canvas");
  full.id="hold-scene-film";
  full.className="hold-scene-film";
  full.setAttribute("aria-hidden","true");
  stage.insertBefore(full,shade);
  const fullCtx=full.getContext("2d",{alpha:false});

  const flow=document.createElement("div");
  flow.className="hold-scene-system-flow";
  flow.setAttribute("aria-hidden","true");
  const flowTrack=document.createElement("span");
  flowTrack.className="hold-flow-track";
  ["LINUX","AUTOMATION","STREAMING","SEARCH"].forEach(label=>{
    const item=document.createElement("span");
    item.className="hold-flow-chip";
    item.textContent=label;flowTrack.append(item);
  });
  flow.append(flowTrack);
  stage.insertBefore(flow,shade);

  // The liquid is attached to BODY, not the inset content stage.
  // This intentionally sends its translucent marbled film across
  // header, footer, hero and both edges of the browser window.
  const wipe=document.createElement("canvas");
  wipe.className="hold-scene-wipe";
  wipe.setAttribute("aria-hidden","true");
  document.body.append(wipe);
  const wc=wipe.getContext("2d",{alpha:true});
  const marble=document.createElement("canvas");
  marble.width=640;marble.height=360;
  const mc=marble.getContext("2d",{alpha:false});
  let wipeWidth=1,wipeHeight=1;
  function makeMarble(){
    if(!mc)return;
    const w=marble.width,h=marble.height;
    const img=mc.createImageData(w,h),px=img.data;
    const palette=[[29,25,52],[49,38,81],[81,57,111],[122,91,151],
      [167,135,189],[213,179,220],[102,100,143]];
    for(let y=0;y<h;y++){
      const v=y/h;
      for(let x=0;x<w;x++){
        const u=x/w,dx=u-.46,dy=v-.51;
        const r=Math.hypot(dx*1.2,dy*.84),a=Math.atan2(dy,dx);
        const twist=17*r-3*a+2.0*Math.sin(u*7+v*4)+
          1.2*Math.cos(u*11-v*10);
        const f=clamp(.49+.21*Math.sin(twist)+
          .17*Math.sin(twist*2.3+.9*Math.cos(v*18))+
          .09*Math.cos(19*u+13*v),0,.9999)*(palette.length-1);
        const i=Math.floor(f),n=i+1,t=f-i,p=(y*w+x)*4;
        for(let k=0;k<3;k++)px[p+k]=palette[i][k]*(1-t)+palette[n][k]*t;
        px[p+3]=255;
      }
    }
    mc.putImageData(img,0,0);
    for(let n=0;n<74;n++){
      mc.beginPath();
      for(let x=0;x<=w;x+=7){
        const y=n*h/74+13*Math.sin(x*.026+n*.084)+
          5*Math.sin(x*.056-n*.14);
        if(x===0)mc.moveTo(x,y);else mc.lineTo(x,y);
      }
      mc.strokeStyle=n%7===0?"rgba(239,234,255,.22)":"rgba(238,206,250,.09)";
      mc.lineWidth=n%7===0?1.2:.45;mc.stroke();
    }
  }
  makeMarble();

  const button=document.createElement("button");
  button.type="button";
  button.className="hold-scene-control";
  button.id="hold-scene-control";
  stage.append(button);
  const hint=document.createElement("span");
  hint.className="hold-scene-hint";
  hint.setAttribute("aria-hidden","true");
  hint.textContent="HOLD ANYWHERE TO CHANGE THE SCENE";
  stage.append(hint);

  let scene=0,armed=null,held=null,transition=null;
  let frame=0,lastRendered=0,lastVisible=false,lastOpacity=-1;
  function progress(){
    return clamp(Number(document.body.dataset.portalProgress||"0"),0,1);
  }
  function journey(){
    return Number(document.body.dataset.journeyProgress||"0");
  }
  function allowed(){
    return !reduced.matches && !document.body.classList.contains("motion-off");
  }
  function eligible(){
    return (document.body.dataset.currentFrame||"1")==="1" &&
      progress()<.075 && allowed() && !document.hidden;
  }
  function visibleMovie(){
    return journey()<2.82 && !document.hidden;
  }
  function status(){
    button.textContent="PRESS & HOLD  ·  "+
      String(scene+1).padStart(2,"0")+" / 03";
    button.setAttribute("aria-label",SCENE_NAMES[scene]+
      ". Hold or click to change the animated background.");
  }
  function fit(){
    wipeWidth=Math.max(1,innerWidth);
    wipeHeight=Math.max(1,innerHeight);
    const d=Math.min(devicePixelRatio||1,1.35);
    wipe.width=Math.ceil(wipeWidth*d);
    wipe.height=Math.ceil(wipeHeight*d);
    if(wc)wc.setTransform(d,0,0,d,0,0);
    const box=stage.getBoundingClientRect();
    const scale=Math.min(devicePixelRatio||1,1.45);
    const width=Math.max(1,Math.round(box.width*scale));
    const height=Math.max(1,Math.round(box.height*scale));
    if(full.width!==width)full.width=width;
    if(full.height!==height)full.height=height;
  }
  function fillGradient(x,y,r,stops){
    const gradient=g.createRadialGradient(x,y,0,x,y,r);
    stops.forEach(([p,c])=>gradient.addColorStop(p,c));
    return gradient;
  }
  function line(x,y,x2,y2,color,width=1){
    g.strokeStyle=color;g.lineWidth=width;g.beginPath();
    g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();
  }
  function panel(x,y,w,h,fill,stroke){
    g.fillStyle=fill;g.fillRect(x,y,w,h);
    if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);}
  }
  function renderServers(t){
    // Film lighting: elegant violet shadows, blue steel and mint LEDs.
    const bg=g.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,"#08131e");bg.addColorStop(.46,"#172a3a");
    bg.addColorStop(1,"#070d1d");g.fillStyle=bg;g.fillRect(0,0,W,H);
    const vx=W*.50+Math.sin(t*.11)*9,vy=H*.36;
    g.fillStyle=fillGradient(vx,vy,660,[
      [0,"rgba(149,193,205,.24)"],[.48,"rgba(40,91,133,.10)"],
      [1,"rgba(2,7,20,0)"]]);
    g.fillRect(0,0,W,H);

    // Roof and floor converge into a long industrial server corridor.
    g.fillStyle="#101825";
    g.beginPath();g.moveTo(0,0);g.lineTo(W,0);g.lineTo(vx+170,vy);
    g.lineTo(vx-170,vy);g.closePath();g.fill();
    g.fillStyle="#0b1423";
    g.beginPath();g.moveTo(0,H);g.lineTo(W,H);g.lineTo(vx+160,vy);
    g.lineTo(vx-160,vy);g.closePath();g.fill();
    for(const side of [-1,1]){
      const edge=side<0?0:W;
      for(let row=0;row<7;row++){
        const depth=(row+.45+(t*.033)%1)/8;
        const f=Math.pow(depth,1.42);
        const lx=vx+side*(165+f*440);
        const rx=vx+side*(210+f*530);
        const yTop=vy-f*370,yBottom=vy+f*610;
        // Side racks are drawn distant-first for a subtle dolly illusion.
        const rackLeft=Math.min(lx,rx),rackW=Math.abs(rx-lx);
        const body=g.createLinearGradient(rackLeft,yTop,rackLeft+rackW,yBottom);
        body.addColorStop(0,side<0?"#142737":"#101c2d");
        body.addColorStop(1,"#060f1c");
        g.fillStyle=body;g.fillRect(rackLeft,yTop,rackW,yBottom-yTop);
        g.strokeStyle="rgba(142,197,207,.24)";
        g.strokeRect(rackLeft,yTop,rackW,yBottom-yTop);
        const rows=12;
        for(let unit=0;unit<rows;unit++){
          const y=yTop+(unit+.4)/rows*(yBottom-yTop);
          const thickness=Math.max(1,(yBottom-yTop)/rows*.55);
          g.fillStyle="rgba(3,11,21,.87)";
          g.fillRect(rackLeft+2,y,rackW-4,thickness);
          line(rackLeft+2,y+thickness*.62,rackLeft+rackW-2,
            y+thickness*.62,"rgba(89,133,156,.24)");
          const blink=.40+.42*Math.sin(t*.48+unit*2.4+row*1.37+side);
          const ledColor=unit%4===0?"rgba(179,245,207,"+blink.toFixed(2)+")":
            "rgba(92,200,241,"+(blink*.75).toFixed(2)+")";
          g.fillStyle=ledColor;
          g.fillRect(side<0?rackLeft+rackW-7:rackLeft+5,y+2,
            Math.max(1,1.8*f),Math.max(1,2.2*f));
        }
        line(rackLeft,yTop,rackLeft,yBottom,"rgba(110,200,224,.14)",1.5);
      }
      // Light rail on the floor.
      line(vx+side*82,vy,W*.5+side*560,H,"rgba(111,209,227,.32)",2);
      line(vx+side*46,vy,W*.5+side*400,H,"rgba(98,155,205,.19)",1.5);
    }
    for(let row=0;row<9;row++){
      const d=(row/9+(t*.025)%1);
      const k=d%1,y=vy+(H-vy)*k*k;
      line(vx-(170+310*k),y,vx+(170+310*k),y,
        "rgba(137,211,221,"+(.16*k).toFixed(3)+")",1);
    }
    // Soft ceiling lights, with a near-black falloff at the edges.
    for(let k=0;k<7;k++){
      const depth=(k/7+t*.035)%1;
      const y=vy-340*depth*depth;
      const w=8+90*depth;
      g.fillStyle="rgba(181,230,235,"+(.08+.2*depth).toFixed(3)+")";
      g.fillRect(vx-w/2,y,w,2+2*depth);
    }
    g.fillStyle=fillGradient(W*.5,H*.36,760,[
      [0,"rgba(2,9,20,0)"],[.65,"rgba(3,10,20,.12)"],
      [1,"rgba(2,5,16,.72)"]]);
    g.fillRect(0,0,W,H);
    g.fillStyle="rgba(147,210,232,.60)";
    g.font="600 12px ui-monospace, monospace";
    g.fillText("INFRASTRUCTURE   /   OPERATIONS",54,52);
    line(54,66,408,66,"rgba(126,224,231,.30)");
  }
  function renderLinux(t){
    // A premium, cinematic Linux automation workspace rather than
    // generic rapidly scrolling green hacker code.
    const bg=g.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,"#0a1220");bg.addColorStop(.45,"#14192d");
    bg.addColorStop(1,"#060d1b");g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.fillStyle=fillGradient(770,320,620,[
      [0,"rgba(131,91,166,.24)"],[.55,"rgba(69,88,134,.09)"],
      [1,"rgba(17,23,40,0)"]]);
    g.fillRect(0,0,W,H);
    // Network geometry and a deliberately restrained animated pulse.
    for(let row=0;row<8;row++){
      const y=85+row*75;
      line(0,y,W,y,"rgba(132,171,195,.06)");
    }
    for(let col=0;col<15;col++){
      const x=35+col*79;
      line(x,0,x,H,"rgba(120,157,192,.045)");
    }
    const blink=.4+.4*Math.sin(t*.8);
    for(let i=0;i<5;i++){
      const x=820+(i%3)*118,y=110+Math.floor(i/3)*132;
      const glow=fillGradient(x,y,74,[
        [0,"rgba(123,220,204,.18)"],[1,"rgba(123,220,204,0)"]]);
      g.fillStyle=glow;g.fillRect(x-74,y-74,148,148);
      panel(x-36,y-21,72,42,"rgba(23,48,62,.94)","rgba(126,214,210,.42)");
      g.font="700 11px ui-monospace, monospace";
      g.fillStyle="rgba(199,243,236,.86)";
      g.fillText(["LINUX","VAULT","KAFKA","ES","CI/CD"][i],x-27,y+5);
      if(i!==4){
        line(x+37,y,x+83,y,"rgba(99,203,198,.22)",2);
        const pulse=(Math.sin(t*.6+i)+1)*.5;
        g.fillStyle="rgba(147,246,224,"+(.4+blink*.35).toFixed(2)+")";
        g.fillRect(x+38+45*pulse,y-2,4,4);
      }
    }
    // One strong main shell window, one small status window.
    const wx=86,wy=88,ww=685,wh=475;
    g.shadowColor="rgba(2,7,17,.65)";g.shadowBlur=45;
    panel(wx,wy,ww,wh,"rgba(10,20,34,.94)","rgba(153,192,215,.29)");
    g.shadowBlur=0;
    panel(wx,wy,ww,36,"rgba(40,54,74,.73)");
    for(let i=0;i<3;i++){
      g.fillStyle=["#9b6a83","#d2ab7c","#80a9b4"][i];
      g.beginPath();g.arc(wx+18+i*19,wy+18,3.3,0,Math.PI*2);g.fill();
    }
    g.fillStyle="rgba(208,225,235,.72)";
    g.font="600 13px ui-monospace, monospace";
    g.fillText("soheil@linux-ksp: ~ / automation",wx+91,wy+23);
    const rows=[
      ["$ ansible-playbook deploy_ksp.yml","#a5f1d1"],
      ["PLAY [Configure production services]","#c9deed"],
      ["TASK [Deploy Elasticsearch configuration]","#9bb6c9"],
      ["ok: [ksp-es-01]   ok: [ksp-es-02]","#6cd6ad"],
      ["TASK [Kafka certificates and Vault]","#9bb6c9"],
      ["changed: [ksp-logstash-01]","#dabedb"],
      ["TASK [Validate pipeline and health]","#9bb6c9"],
      ["ok: [ksp-logstash-01]","#6cd6ad"],
      ["$ journalctl -u elasticsearch","#a5f1d1"],
      ["service: active (running)","#77d0b8"],
      ["$ curl -s /_cluster/health","#a5f1d1"],
      ['{"status":"green","nodes":3}',"#b1cfdd"]
    ];
    const cycle=Math.floor(t*.25)%rows.length;
    for(let i=0;i<11;i++){
      const item=rows[(i+cycle)%rows.length];
      const y=wy+71+i*32;
      g.font=(item[0].startsWith("$")?"700":"530")+" 18px ui-monospace,monospace";
      g.fillStyle=item[1];
      g.fillText(item[0],wx+23,y,ww-40);
      if(item[0].startsWith("ok:")||item[0].startsWith("service:")){
        g.fillStyle="rgba(80,237,171,.43)";
        g.fillRect(wx+11,y-12,2,14);
      }
    }
    g.fillStyle="rgba(177,222,236,.60)";
    g.font="600 12px ui-monospace, monospace";
    g.fillText("SYSTEMS   /   CODE   /   DELIVERY",W-349,H-60);
    line(W-349,H-46,W-73,H-46,"rgba(134,210,216,.33)");
  }
  function paintSource(time){
    g.save();
    g.clearRect(0,0,W,H);
    if(scene===1)renderServers(time);
    if(scene===2)renderLinux(time);
    g.restore();
  }
  function drawCover(ctx,destW,destH,sourceX=0,sourceW=W){
    const scale=Math.max(destW/sourceW,destH/H);
    const cropW=destW/scale,cropH=destH/scale;
    const x=sourceX+(sourceW-cropW)*.5,y=(H-cropH)*.5;
    ctx.drawImage(source,x,y,cropW,cropH,0,0,destW,destH);
  }
  function paintPanes(){
    const fullRect=panorama.getBoundingClientRect();
    const fw=Math.max(1,fullRect.width),fh=Math.max(1,fullRect.height);
    const scale=Math.max(fw/W,fh/H);
    const cropW=fw/scale,cropH=fh/scale;
    const cropX=(W-cropW)*.5,cropY=(H-cropH)*.5;
    for(const pane of panes){
      const r=pane.arch.getBoundingClientRect();
      const d=Math.min(devicePixelRatio||1,1.45);
      const width=Math.max(1,Math.round(r.width*d));
      const height=Math.max(1,Math.round(r.height*d));
      if(pane.canvas.width!==width)pane.canvas.width=width;
      if(pane.canvas.height!==height)pane.canvas.height=height;
      if(!pane.ctx)continue;
      const offset=clamp((r.left-fullRect.left)/fw,0,1);
      const part=clamp(r.width/fw,.001,1-offset);
      pane.ctx.drawImage(source,cropX+offset*cropW,cropY,
        Math.max(.1,part*cropW),cropH,0,0,width,height);
    }
  }
  function paintFull(){
    if(!fullCtx)return;
    const r=stage.getBoundingClientRect();
    const d=Math.min(devicePixelRatio||1,1.45);
    const w=Math.max(1,Math.round(r.width*d));
    const h=Math.max(1,Math.round(r.height*d));
    if(full.width!==w)full.width=w;
    if(full.height!==h)full.height=h;
    drawCover(fullCtx,full.width,full.height);
  }
  function updateFull(){
    if(scene===0)return;
    const p=progress();
    const visible=visibleMovie()&&p>.60;
    const opacity=visible?smooth((p-.69)/.24):0;
    if(opacity!==lastOpacity){
      full.style.opacity=opacity.toFixed(3);lastOpacity=opacity;
    }
    if(visible!==lastVisible){
      full.style.visibility=visible?"visible":"hidden";
      lastVisible=visible;
    }
  }
  function paintWorld(time){
    if(scene===0||!visibleMovie())return;
    paintSource(time);
    if(progress()<.995)paintPanes();
    paintFull();
    updateFull();
    panorama.dataset.artMediaReady="true";
  }
  function animation(now){
    frame=0;
    if(scene===0||!visibleMovie())return;
    if(now-lastRendered>=37){
      lastRendered=now;
      paintWorld(allowed()?now*.00055:0);
    }
    updateFull();
    if(allowed())frame=requestAnimationFrame(animation);
  }
  function schedule(){
    if(scene!==0&&visibleMovie()&&!frame&&allowed())
      frame=requestAnimationFrame(animation);
  }
  function stop(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;
  }
  function setScene(next){
    scene=((next%3)+3)%3;
    panorama.dataset.artScene=String(scene);
    document.body.dataset.frameOneArt=String(scene);
    panorama.dataset.artMediaReady=scene===0?"false":"true";
    status();stop();lastVisible=false;lastOpacity=-1;
    if(scene===0){
      full.style.opacity="0";full.style.visibility="hidden";
      return;
    }
    panes.forEach((pane,i)=>{
      pane.label.textContent=LABELS[scene-1][i];
    });
    paintWorld(performance.now()*.00055);
    schedule();
  }

  const LIQUID_MS=2400;
  function clearWipe(){
    if(wc)wc.clearRect(0,0,wipeWidth,wipeHeight);
    wipe.style.visibility="hidden";
  }
  function liquidFrame(now){
    if(!transition||!wc)return;
    const tr=transition,t=clamp((now-tr.started)/LIQUID_MS,0,1);
    if(!eligible()){
      if(!tr.switched)setScene(tr.next);
      transition=null;clearWipe();return;
    }
    if(!tr.switched&&t>=.47){
      tr.switched=true;setScene(tr.next);
    }
    wc.clearRect(0,0,wipeWidth,wipeHeight);
    if(t>=1){transition=null;clearWipe();return;}
    const entering=smooth(t/.55),leaving=1-smooth((t-.61)/.38);
    const radius=26+Math.hypot(wipeWidth,wipeHeight)*1.36*
      Math.min(entering,leaving);
    const cx=tr.x+wipeWidth*.10*smooth(t);
    const cy=tr.y-wipeHeight*.04*smooth(t);
    const alpha=.68*(1-smooth((t-.60)/.39));
    if(alpha>.003){
      wc.save();wc.beginPath();
      for(let i=0;i<=112;i++){
        const a=i/112*Math.PI*2;
        const ripple=1+.045*Math.sin(7*a+now*.0021)+
          .028*Math.cos(14*a-now*.0018);
        const x=cx+Math.cos(a)*radius*ripple;
        const y=cy+Math.sin(a)*radius*ripple*.92;
        if(i===0)wc.moveTo(x,y);else wc.lineTo(x,y);
      }
      wc.closePath();
      wc.save();wc.clip();wc.globalAlpha=alpha;
      wc.drawImage(marble,-wipeWidth*.04+t*wipeWidth*.05,
        -wipeHeight*.06,wipeWidth*1.10,wipeHeight*1.12);
      const bloom=wc.createRadialGradient(cx,cy,1,cx,cy,radius);
      bloom.addColorStop(0,"rgba(236,212,253,.18)");
      bloom.addColorStop(.65,"rgba(195,171,235,.07)");
      bloom.addColorStop(1,"rgba(67,65,139,.01)");
      wc.fillStyle=bloom;wc.fillRect(0,0,wipeWidth,wipeHeight);
      wc.restore();
      wc.strokeStyle="rgba(234,217,255,"+(alpha*.75).toFixed(3)+")";
      wc.shadowColor="rgba(180,163,234,"+(alpha*.6).toFixed(3)+")";
      wc.shadowBlur=18;wc.lineWidth=2.1;wc.stroke();
      wc.restore();
    }
    requestAnimationFrame(liquidFrame);
  }
  function advance(x,y){
    if(!eligible()||transition)return;
    fit();
    if(reduced.matches){
      setScene((scene+1)%3);return;
    }
    transition={
      x:clamp(x,0,wipeWidth),y:clamp(y,0,wipeHeight),
      next:(scene+1)%3,started:performance.now(),switched:false
    };
    wipe.style.visibility="visible";
    requestAnimationFrame(liquidFrame);
  }
  function unarm(){
    if(armed!==null)clearTimeout(armed);
    armed=null;held=null;
  }
  stage.addEventListener("pointerdown",e=>{
    if(!eligible()||transition||e.button!==0||armed!==null)return;
    if(e.target instanceof Element&&e.target.closest(
      "a,button,input,textarea,select,.journey-scrollbar,#journey-scrollbar,#gallery-viewport,#globe-shell"))return;
    const x=e.clientX,y=e.clientY;
    held={id:e.pointerId,x,y};
    armed=setTimeout(()=>{
      armed=null;
      if(!held||held.id!==e.pointerId)return;
      advance(x,y);
    },e.pointerType==="touch"?440:320);
  },{passive:true});
  stage.addEventListener("pointermove",e=>{
    if(!held||held.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-held.x,e.clientY-held.y)>18)unarm();
  },{passive:true});
  addEventListener("pointerup",unarm,{passive:true});
  addEventListener("pointercancel",unarm,{passive:true});
  addEventListener("blur",()=>{unarm();stop();});
  button.addEventListener("click",()=>{
    const r=stage.getBoundingClientRect();
    advance(r.left+r.width*.32,r.top+r.height*.48);
  });
  addEventListener("keydown",e=>{if(e.key==="Escape")unarm();});
  addEventListener("resize",()=>{fit();if(scene!==0)paintWorld(performance.now()*.00055);},{passive:true});
  reduced.addEventListener("change",()=>{
    if(scene!==0)paintWorld(0);
    schedule();
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)stop();else schedule();
  });
  new MutationObserver(()=>{
    if(!eligible())unarm();
    if(transition&&!eligible()){
      if(!transition.switched)setScene(transition.next);
      transition=null;clearWipe();
    }
    if(!visibleMovie())stop();
    else if(scene!==0){updateFull();schedule();}
  }).observe(document.body,{
    attributes:true,
    attributeFilter:["data-current-frame","data-portal-progress",
      "data-journey-progress","class"]
  });
  fit();setScene(0);clearWipe();
})();