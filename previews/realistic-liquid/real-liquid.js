/* Three real-time, VIDEO-TEXTURED WebGL2 liquid models.
 * Isolated to /previews/realistic-liquid/. Never imported by the homepage.
 * The same video continues playing under the GPU overlay.
 */
(()=>{
"use strict";
const stage=document.getElementById("frame");
const vid=document.getElementById("arch-morph-video");
const mask=document.getElementById("live-arch-morph-path");
const poster=document.getElementById("arch-morph-poster");
if(!stage||!vid||!mask||!poster)return;
const q=new URLSearchParams(location.search).get("model");
const model=["a","b","c"].includes(q)?q:"a";
const models={
 a:{title:"A · Glass Gel",description:"Thick, refracted gel stretches into rounded glossy bulbs. Slow, weighty elastic recoil.",
    count:6,reach:220,width:23,bounce:.79,force:.108,mode:0},
 b:{title:"B · Water Splash",description:"Fine liquid sheets, narrow jets and smaller droplets. Quick response and lively return.",
    count:9,reach:248,width:11,bounce:.70,force:.17,mode:1},
 c:{title:"C · Magnetic Vortex",description:"Wide flowing ribbons spiral outward, as though the moving video is being pulled through glass.",
    count:7,reach:255,width:19,bounce:.83,force:.11,mode:2}
};
const settings=models[model];
document.getElementById("real-liquid-mode-label").textContent=settings.title;
document.getElementById("real-liquid-mode-desc").textContent=settings.description;
document.querySelector('[data-fluid="'+model+'"]')?.setAttribute("aria-current","page");
const status=document.getElementById("real-liquid-status");
const demoButton=document.getElementById("real-liquid-demo");
const reset=document.getElementById("real-liquid-reset");
const strength=document.getElementById("real-liquid-strength");
const output=document.getElementById("real-liquid-value");
const reduced=matchMedia("(prefers-reduced-motion:reduce)");
const canvas=document.createElement("canvas");
canvas.id="real-liquid-canvas";canvas.className="real-liquid-overlay";
canvas.setAttribute("aria-hidden","true");
stage.append(canvas);
const gl=canvas.getContext("webgl2",{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,
 powerPreference:"high-performance"});
if(!gl){
  status.textContent="WEBGL2 REQUIRED · USE CURRENT CHROME";
  return;
}
const vtxSource="#version 300 es\nin vec2 position;\nvoid main(){gl_Position=vec4(position,0.,1.);}";
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const spring=(s,target,dt,force,drag)=>{
  s.v=(s.v+(target-s.p)*force*dt)*Math.pow(drag,dt);
  s.p+=s.v*dt;
  return s.p;
};
function compile(type,source){
 const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){
   const err=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw Error("Fluid shader: "+err);
 }
 return sh;
}
function createProgram(fragment){
 const p=gl.createProgram();
 const vs=compile(gl.VERTEX_SHADER,vtxSource);
 const fs=compile(gl.FRAGMENT_SHADER,fragment);
 gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error("Fluid GPU link: "+gl.getProgramInfoLog(p));
 gl.deleteShader(vs);gl.deleteShader(fs);return p;
}
let program=null,uniforms={},w=0,h=0,textureWidth=0,textureHeight=0,draws=0;
const sourceTex=gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D,sourceTex);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
const vao=gl.createVertexArray();gl.bindVertexArray(vao);
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
gl.bindVertexArray(null);
const hitCanvas=document.createElement("canvas");
const hitCtx=hitCanvas.getContext("2d");
let pointer={x:-10000,y:-10000},inside=false,energy=0,active=false,lastTs=0,lastTex=0,raf=0,renderedVideo=false,hasTexture=false;
let lastMouseTs=0,velocityX=0,velocityY=0,anchor={x:0,y:0,side:1,cx:0,w:100,cy:0};
let modelStrokes=[],demoAt=0,demoOn=false,demoFinished=false,initialized=false,steps=0;
let textureSource="none",errorMessage="";
const zero=()=>({p:0,v:0});
function resetStrokes(x,y){
 modelStrokes=Array.from({length:settings.count},(_,i)=>({
  rx:{p:x,v:0},ry:{p:y,v:0},tx:{p:x,v:0},ty:{p:y,v:0},
  bx:{p:x,v:0},by:{p:y,v:0},width:{p:0,v:0},
  phase:i*2.3999632
 }));
}
function updateSize(){
 const r=stage.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);
 const scale=Math.min(1,980/w,680/h);
 textureWidth=Math.max(1,Math.round(w*scale));textureHeight=Math.max(1,Math.round(h*scale));
 canvas.width=textureWidth;canvas.height=textureHeight;
 gl.viewport(0,0,textureWidth,textureHeight);
}
new ResizeObserver(updateSize).observe(stage);updateSize();
function getRectangles(){
 const stageBox=stage.getBoundingClientRect();
 return [...document.querySelectorAll("#panorama .arch")].map(el=>{
  const b=el.getBoundingClientRect();
  return {left:b.left-stageBox.left,top:b.top-stageBox.top,
   right:b.right-stageBox.left,bottom:b.bottom-stageBox.top,
   center:(b.left+b.right)/2-stageBox.left,width:b.width,height:b.height};
 });
}
function inPortal(x,y){
 if(x<0||y<0||x>w||y>h)return false;
 try{return hitCtx.isPointInPath(new Path2D(mask.getAttribute("d")||""),x,y);}catch{return false;}
}
function locateAnchor(x,y){
 const rects=getRectangles();
 let r=rects.find(r=>x>=r.left-9&&x<=r.right+9&&y>=r.top-10&&y<=r.bottom+10);
 if(!r)r=rects.reduce((a,b)=>Math.abs(x-b.center)<Math.abs(x-a.center)?b:a);
 return {x:x<r.center?r.left:r.right,
  y:clamp(y,r.top+r.width*.58,r.bottom-r.width*.27),
  side:x<r.center?-1:1,cx:r.center,cy:(r.top+r.bottom)/2,w:r.width};
}
function updateAnchor(near){
 if(!near)return;
 if(!modelStrokes.length||Math.abs(near.cx-anchor.cx)>Math.max(50,near.w*.82)
   ||near.side!==anchor.side)resetStrokes(near.x,near.y);
 anchor=near;
}
function videoFrame(ts){
 if(!program || (ts-lastTex)<65)return;
 lastTex=ts;
 let frame=vid.readyState>=2&&vid.videoWidth?vid:null;
 if(!frame&&poster.complete&&poster.naturalWidth)frame=poster;
 if(!frame)return;
 try{
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sourceTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,frame);
  const valid=gl.getError()===gl.NO_ERROR;
  if(!valid){errorMessage="Could not upload live movie pixels";return;}
  renderedVideo=frame===vid;
  textureSource=frame===vid?"playing-video":"poster";
  hasTexture=true;
  const sourceWidth=frame.videoWidth||frame.naturalWidth;
  const sourceHeight=frame.videoHeight||frame.naturalHeight;
  const fit=Math.max(w/sourceWidth,h/sourceHeight);
  const crop=[w/fit/sourceWidth,h/fit/sourceHeight];
  gl.useProgram(program);gl.uniform2f(uniforms.uCrop,crop[0],crop[1]);
 }catch(e){errorMessage=String(e).slice(0,150);}
}
function animateStrokes(time,dt){
 const strengthFactor=Number(strength.value)/75;
 let motion=0;
 const data=new Float32Array(40),bend=new Float32Array(40);
 const near=anchor;
 const c=(settings.count-1)/2;
 for(let i=0;i<settings.count;i++){
  const s=modelStrokes[i],delta=i-c,spread=settings.mode===1?20:(settings.mode===2?28:26);
  const rootX=near.x+Math.sin(delta*.48)*6,rootY=clamp(near.y+delta*spread,15,h-16);
  const reach=settings.reach*strengthFactor*(settings.mode===1?.79+(.15*Math.sin(i*5.2)):.74+.29*Math.sin(i*3.07+1.0));
  const drawTime=time*.001;
  const wave=settings.mode===2?Math.sin(drawTime*1.8+i*.67)*65:Math.sin(drawTime*2.3+s.phase)*25;
  const direction=near.side;
  const tx=rootX+(active?direction*(reach+clamp(velocityX*1.6,-55,55)):0);
  const ty=active?rootY+wave+(pointer.y-near.y)*.12+clamp(velocityY*.7,-40,40):rootY;
  const bending=settings.mode===2?90:(settings.mode===1?47:35);
  const bx=active?mix(rootX,tx,.46)-direction*bending*Math.sin(drawTime*1.6+i*.92):rootX;
  const by=active?mix(rootY,ty,.48)+bending*Math.cos(drawTime*1.4+i*.9):rootY;
  const desiredWidth=active?settings.width*strengthFactor*(.77+.22*Math.cos(i*1.8)):0;
  const sn=(dt,field,t,k=settings.force,drag=settings.bounce)=>spring(s[field],t,dt,k,drag);
  const rx=sn(dt,"rx",rootX,.18,.76),ry=sn(dt,"ry",rootY,.17,.76);
  const endX=sn(dt,"tx",tx),endY=sn(dt,"ty",ty);
  const midX=sn(dt,"bx",bx,.13,.79),midY=sn(dt,"by",by,.13,.79);
  const thick=sn(dt,"width",desiredWidth,.115,.74);
  data.set([rx,ry,endX,endY],i*4);
  bend.set([midX,midY,Math.max(0,thick),s.phase],i*4);
  motion+=Math.abs(endX-rootX)+Math.abs(endY-rootY)+Math.abs(thick)+Math.abs(s.tx.v)+Math.abs(s.ty.v);
 }
 return {data,bend,motion};
}
function runDemo(ts){
 if(!demoOn)return;
 const t=(ts-demoAt)*.001;
 const el=document.querySelector("#panorama .arch:nth-child(2)");
 if(!el){demoOn=false;return;}
 const bounds=el.getBoundingClientRect(),sr=stage.getBoundingClientRect();
 if(t>4.4){demoOn=false;inside=false;demoFinished=true;return;}
 pointer.x=bounds.left-sr.left+bounds.width*(.48+.22*Math.sin(t*2.7));
 pointer.y=bounds.top-sr.top+bounds.height*(.48+.21*Math.sin(t*2.2));
 inside=inPortal(pointer.x,pointer.y);
 if(inside)updateAnchor(locateAnchor(pointer.x,pointer.y));
}
function render(ts){
 raf=0;
 if(!program||reduced.matches||document.hidden){gl.clear(gl.COLOR_BUFFER_BIT);return;}
 const dt=lastTs?clamp((ts-lastTs)/16.667,.55,2.3):1;lastTs=ts;
 runDemo(ts);
 const progress=Number(document.body.dataset.journeyProgress||0);
 active=inside&&progress<.26&&!reduced.matches;
 energy=mix(energy,active?1:0,1-Math.exp(-dt*16.667/(active?110:260)));
 if(!modelStrokes.length){resetStrokes(w*.54,h*.45);}
 const {data,bend,motion}=animateStrokes(ts,dt);
 videoFrame(ts);
 const canDraw=hasTexture&&(active||energy>.017||motion>3.5);
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 if(canDraw){
  const arches=getRectangles();
  const flat=new Float32Array(12);
  for(let i=0;i<3;i++){const r=arches[i];flat.set([r.left,r.top,r.right,r.bottom],i*4);}
  gl.useProgram(program);
  gl.uniform2f(uniforms.uSize,w,h);
  gl.uniform2f(uniforms.uTextureSize,textureWidth,textureHeight);
  gl.uniform4fv(uniforms.uStrokes,data);gl.uniform4fv(uniforms.uBends,bend);
  gl.uniform4fv(uniforms.uArches,flat);
  gl.uniform2f(uniforms.uPointer,pointer.x,pointer.y);
  gl.uniform1f(uniforms.uTime,ts*.001);
  gl.uniform1f(uniforms.uEnergy,energy);
  gl.uniform1f(uniforms.uModel,settings.mode);
  gl.uniform1i(uniforms.uCount,settings.count);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  draws++;
  gl.bindVertexArray(null);
 }
 canvas.dataset.fluidActive=String(active);
 canvas.dataset.fluidEnergy=energy.toFixed(3);
 canvas.dataset.fluidExtent=Math.round(motion).toString();
 canvas.dataset.frameTexture=textureSource;
 canvas.dataset.videoPlaying=String(!vid.paused);
 canvas.dataset.drawCalls=String(draws);
 canvas.dataset.fluidModel=model;
 canvas.dataset.fluidError=errorMessage;
 if(active)status.textContent="LIVE VIDEO → LIQUID SURFACE";
 else if(canDraw)status.textContent="ELASTIC RETURN INTO ARCH";
 else status.textContent="READY · VIDEO STILL PLAYING";
 if(active||energy>.018||motion>4||demoOn)request();
 else {lastTs=0;canvas.dataset.fluidExtent="0";}
}
function request(){if(program&&!raf)raf=requestAnimationFrame(render);}
function move(e){
 if(e.pointerType!=="mouse"&&e.pointerType!=="pen"&&e.pointerType!=="touch")return;
 if(demoOn)demoOn=false;
 const sr=stage.getBoundingClientRect();
 const x=e.clientX-sr.left,y=e.clientY-sr.top;
 if(lastMouseTs){velocityX=velocityX*.65+(x-pointer.x)*.35;velocityY=velocityY*.65+(y-pointer.y)*.35;}
 lastMouseTs=performance.now();
 pointer={x,y};
 inside=!(e.target instanceof Element&&e.target.closest(".real-liquid-panel,.site-header,.site-footer,.portal-navigation"))&&inPortal(x,y);
 if(inside)updateAnchor(locateAnchor(x,y));
 request();
}
addEventListener("pointermove",move,{passive:true});
stage.addEventListener("pointerdown",e=>{if(e.pointerType==="touch")move(e)},{passive:true});
addEventListener("pointerup",e=>{if(e.pointerType==="touch"){inside=false;request()}},{passive:true});
document.addEventListener("mouseout",e=>{if(!e.relatedTarget){inside=false;request()}},{passive:true});
addEventListener("blur",()=>{inside=false;demoOn=false;request()});
addEventListener("visibilitychange",()=>{inside=false;request()});
reduced.addEventListener("change",()=>{inside=false;demoOn=false;request()});
reset?.addEventListener("click",()=>{demoOn=false;inside=false;request()});
demoButton?.addEventListener("click",()=>{
 demoOn=true;demoFinished=false;demoAt=performance.now();lastTs=0;
 inside=false;request();
});
strength?.addEventListener("input",()=>{output.textContent=strength.value+"%";request()});
canvas.dataset.fluidReady="false";
fetch("/previews/realistic-liquid/liquid.frag",{cache:"no-cache"})
 .then(r=>{if(!r.ok)throw Error("Shader HTTP "+r.status);return r.text();})
 .then(frag=>{
  program=createProgram(frag);
  gl.useProgram(program);
  ["uSize","uTextureSize","uCrop","uVideo","uStrokes[0]","uBends[0]",
   "uArches[0]","uPointer","uTime","uEnergy","uModel","uCount"].forEach(key=>{
    uniforms[key.split("[")[0]]=gl.getUniformLocation(program,key);
  });
  gl.uniform1i(uniforms.uVideo,0);
  canvas.dataset.fluidReady="true";
  canvas.dataset.fluidModel=model;
  videoFrame(performance.now()+1000);
  status.textContent="MOVE MOUSE OVER VIDEO ARCH";
  request();
 }).catch(e=>{
  canvas.dataset.fluidError=String(e);
  status.textContent="GPU PREVIEW ERROR — "+String(e).slice(0,55);
  console.error(e);
 });
})();
