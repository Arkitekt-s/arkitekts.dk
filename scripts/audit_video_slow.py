#!/usr/bin/env python3
"""Browser-observed hero startup under throttled mobile broadband.
Captures first paint and first playing event of all three existing films.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright,TimeoutError as BrowserTimeout
import time,json
root=Path(__file__).resolve().parents[1]
out=root/"screenshots/performance"
out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel="chrome",headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
 for seed,label in [(.01,"Pexels landscape"),(.50,"Local 7 MB"),(.99,"Pexels square")]:
  ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=1,is_mobile=True,has_touch=True)
  page=ctx.new_page()
  page.add_init_script("""(() => {
   window.__startup={events:[],paints:[]};
   document.addEventListener('loadeddata',e=>{
     if(e.target.id==='arch-morph-video')
       window.__startup.events.push({name:'loadeddata',ms:performance.now(),ready:e.target.readyState})
   },true);
   document.addEventListener('playing',e=>{
     if(e.target.id==='arch-morph-video')
       window.__startup.events.push({name:'playing',ms:performance.now(),ready:e.target.readyState})
   },true);
   try{new PerformanceObserver(list=>list.getEntries().forEach(e=>{
      if(e.name==='first-contentful-paint')window.__startup.paints.push(e.startTime)
   })).observe({type:'paint',buffered:true})}catch{}
  })();""")
  page.add_init_script(f"Math.random=()=>{seed}")
  cdp=ctx.new_cdp_session(page)
  cdp.send("Network.enable")
  cdp.send("Network.emulateNetworkConditions",{
    "offline":False,"latency":150,
    "downloadThroughput":200000,
    "uploadThroughput":80000
  })
  started=time.time()
  try:
   response=page.goto("https://arkitekts.dk/",wait_until="domcontentloaded",timeout=40000)
   try:page.wait_for_function("window.__startup.events.some(e=>e.name==='playing')",timeout=16000)
   except BrowserTimeout:pass
   state=page.evaluate("""() => ({
    eventLog:window.__startup.events.map(x=>({name:x.name,ms:Math.round(x.ms)})),
    fcp:Math.round(window.__startup.paints[0]||0),
    chosen:document.body.dataset.archMorphScene,
    video:(()=>{const v=document.getElementById('arch-morph-video');return {
      paused:v.paused,ready:v.readyState,time:v.currentTime,src:v.currentSrc,error:v.error?.code||null,
      network:v.networkState
    }})()
   })""")
   result={"clip":label,"status":response.status,"elapsed":round(time.time()-started,2),**state}
  except Exception as e:result={"clip":label,"error":str(e)[:300]}
  results.append(result)
  print("SLOW_MOBILE_VIDEO",json.dumps(result),flush=True)
  ctx.close()
 b.close()
(out/"slow-mobile-video.json").write_text(json.dumps(results,indent=2))
