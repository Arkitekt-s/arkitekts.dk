#!/usr/bin/env python3
"""Measured lab audit of the 24 public pages and six live-homepage scenes.
Run on hosted Chrome, with a cold browser context for each page. Numbers are
lab observations, not CrUX field data or a substitute for Lighthouse.
"""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright,TimeoutError as BrowserTimeout
import json,os,statistics,time
root=Path(__file__).resolve().parents[1]
out=root/"screenshots/performance"
out.mkdir(parents=True,exist_ok=True)
base=os.environ.get("AUDIT_ORIGIN","https://arkitekts.dk").rstrip("/")
routes=[
"/","/profile/","/portfolio/","/software-skills/","/contact/","/technical-guides/","/it-drift/",
"/portfolio/basecamp-response/","/portfolio/camp-booking/","/portfolio/copenhagen-valuation/",
"/portfolio/full-stack-application/","/portfolio/shopflow-mobile/","/portfolio/web-development/",
"/technical-guides/03-linux-red-hat-cheat-sheet-html-rendered/",
"/technical-guides/ansible-enterprise-guide-automation-playbooks-roles-and-production-architecture/",
"/technical-guides/ci-cd-enterprise-guide-github-actions-jenkins-gitlab-ci-and-production-pipelines/",
"/technical-guides/docker-cheat-sheet-containers-images-and-production-architecture-8/",
"/technical-guides/document-databases-mongodb-elasticsearch-and-firebase/",
"/technical-guides/git-and-github-enterprise-guide-version-control-branching-ci-cd-and-production-workflows/",
"/technical-guides/hashicorp-vault-enterprise-guide-secrets-management-pki-authentication-and-production-architecture/",
"/technical-guides/helm-enterprise-guide-kubernetes-package-management-charts-and-production-architecture/",
"/technical-guides/java-apache-kafka-building-scalable-backend-systems/",
"/technical-guides/kubernetes-enterprise-guide-pods-services-networking-and-production-architecture/",
"/technical-guides/terraform-enterprise-guide-infrastructure-as-code-modules-and-production-architecture/"
]
init=r"""(() => {
 window.__audit={lcp:0,videoEvents:[],fcp:0};
 try{new PerformanceObserver(list=>{for(const x of list.getEntries())window.__audit.lcp=x.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
 try{new PerformanceObserver(list=>{for(const x of list.getEntries())if(x.name==='first-contentful-paint')window.__audit.fcp=x.startTime}).observe({type:'paint',buffered:true})}catch{}
 ['loadedmetadata','loadeddata','playing','error'].forEach(type=>{
   document.addEventListener(type,e=>{
     if(e.target.id==='arch-morph-video')
       window.__audit.videoEvents.push({event:type,ms:Math.round(performance.now()),ready:e.target.readyState,mediaTime:+e.target.currentTime.toFixed(2),src:e.target.currentSrc||e.target.src,error:e.target.error?.code||null});
   },true);
 });
})();"""
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel="chrome",headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
 for device,w,h in [("desktop",1365,900),("mobile",390,844)]:
  for i,route in enumerate(routes):
   ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
   page=ctx.new_page()
   page.add_init_script(init)
   # The homepage has three original artworks. Use the local H.264 version
   # first to produce reproducible initial-movie measurements.
   if route=="/":
    page.add_init_script("Math.random = () => 0.50;")
   requests,failed=[],[]
   page.on("request",lambda q:requests.append(q.url))
   page.on("requestfailed",lambda q:failed.append({"url":q.url[:170],"failure":q.failure}))
   started=time.time()
   try:
    response=page.goto(base+route,wait_until="domcontentloaded",timeout=25000)
    page.wait_for_timeout(1800 if route=="/" else 750)
    if route=="/":
     try:page.wait_for_function("window.__audit.videoEvents.some(x=>x.event==='playing')",timeout=6500)
     except BrowserTimeout:pass
    metrics=page.evaluate("""() => {
     const n=performance.getEntriesByType('navigation')[0],a=window.__audit||{};
     const resources=performance.getEntriesByType('resource');
     const top=resources.filter(x=>x.duration>350).sort((x,y)=>y.duration-x.duration).slice(0,6).map(x=>({url:x.name.slice(0,160),ms:Math.round(x.duration),transfer:x.transferSize||0}));
     return {
      dcl:Math.round(n?.domContentLoadedEventEnd||0),load:Math.round(n?.loadEventEnd||0),
      ttfb:Math.round(n?.responseStart||0),
      fcp:Math.round(a.fcp||0),lcp:Math.round(a.lcp||0),
      resourceCount:resources.length,
      transferredBytes:resources.reduce((s,r)=>s+(r.transferSize||0),0),
      entries:resources.length,
      maxResources:top,
      media:a.videoEvents||[],
      videoState:(()=>{const v=document.getElementById('arch-morph-video');return v?{playing:!v.paused,time:v.currentTime,ready:v.readyState,src:v.currentSrc}:null})(),
      pageLang:document.documentElement.lang,
      pageSize:document.documentElement.scrollWidth-innerWidth
     }
    }""")
    item={"page":route,"device":device,"status":response.status,"url":page.url,"wallSec":round(time.time()-started,2),"requests":len(requests),"failures":failed[:6],**metrics}
   except Exception as e:
    item={"page":route,"device":device,"error":str(e)[:330],"wallSec":round(time.time()-started,2),"failures":failed[:6]}
   results.append(item)
   print("PAGE",device,route,"status",item.get("status"),"TTFB",item.get("ttfb"),"FCP",item.get("fcp"),"LCP",item.get("lcp"),"DCL",item.get("dcl"),"resources",item.get("resourceCount"),"bytes",item.get("transferredBytes"),"video",(item.get("videoState") or {}).get("ready"),flush=True)
   ctx.close()
 # Check all six scene stops without external navigation.
 ctx=browser.new_context(viewport={"width":1365,"height":900})
 page=ctx.new_page();page.add_init_script("Math.random = () => 0.50;")
 try:
  page.goto(base,wait_until="domcontentloaded",timeout=30000)
  page.wait_for_function("typeof window.__experienceGo==='function'",timeout=10000)
  scene=[]
  for n in range(1,7):
   t=time.time()
   page.evaluate(f"window.__experienceGo({n},true)")
   page.wait_for_function(f"document.body.dataset.currentFrame==='{n}'",timeout=8000)
   scene.append({"scene":n,"navigationMs":round((time.time()-t)*1000),"currentFrame":page.locator("body").get_attribute("data-current-frame"),"visibleExperience":page.locator("#experience-section").evaluate("(e)=>e.classList.contains('is-visible')"),"videoTime":page.locator("#arch-morph-video").evaluate("(v)=>Math.round(v.currentTime*10)/10")})
  print("SIX_SECTIONS",json.dumps(scene),flush=True)
 except Exception as e:scene=[{"error":str(e)[:320]}]
 ctx.close()
 # Identify heavy alternate video startup: actual remote selected options.
 alternatives=[]
 for value,label in [(0.02,"Pexels 1"),(0.99,"Pexels 3")]:
  ctx=browser.new_context(viewport={"width":1365,"height":900})
  p=ctx.new_page()
  p.add_init_script(init);p.add_init_script(f"Math.random = () => {value};")
  try:
   p.goto(base,wait_until="domcontentloaded",timeout=30000)
   try:p.wait_for_function("window.__audit.videoEvents.some(x=>x.event==='playing')",timeout=12000)
   except BrowserTimeout:pass
   e=p.evaluate("window.__audit.videoEvents")
   alternatives.append({"name":label,"events":e,"last":p.locator("#arch-morph-video").evaluate("(v)=>({paused:v.paused,ready:v.readyState,src:v.currentSrc,error:v.error?.code||null})")})
  except Exception as e:alternatives.append({"name":label,"error":str(e)[:300]})
  print("MOVIE_ALTERNATIVE",json.dumps(alternatives[-1])[:1200],flush=True)
  ctx.close()
 browser.close()
report={"origin":base,"measuredAt":time.strftime('%Y-%m-%d %H:%M:%S UTC',time.gmtime()),"note":"Synthetic GitHub Actions Chrome, unthrottled connection, cold context per page. Resource transferBytes excludes cross-origin timing restricted transfers.","pages":results,"sections":scene,"alternatives":alternatives}
(out/"performance-report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
print("AUDIT_TOTAL",json.dumps({"pages":len(results),"errors":sum(1 for x in results if x.get("error") or (x.get("status",200)>=400)),"medianFcp":statistics.median([x["fcp"] for x in results if x.get("fcp") and x["fcp"]>0]) if any(x.get("fcp") for x in results) else None}),flush=True)
