#!/usr/bin/env python3
"""Visual + interaction tests for 3 original-video GPU liquid materials."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
root=Path(__file__).resolve().parents[1]
output=root/"screenshots/realistic-liquid"
output.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/previews/realistic-liquid/"
errors=[];records=[]
def metrics(page):
 return page.evaluate("""() => {const c=document.getElementById('real-liquid-canvas');
  const v=document.getElementById('arch-morph-video');
  return {
    ready:c?.dataset.fluidReady,
    model:c?.dataset.fluidModel,
    error:c?.dataset.fluidError,
    drawCalls:Number(c?.dataset.drawCalls||0),
    active:c?.dataset.fluidActive,
    energy:Number(c?.dataset.fluidEnergy||0),
    extent:Number(c?.dataset.fluidExtent||0),
    source:c?.dataset.frameTexture,
    videoPlaying:!v?.paused,
    videoTime:v?.currentTime,
    videoWidth:v?.videoWidth,
    videoSrc:v?.currentSrc,
    mask:!!document.getElementById('live-arch-morph-path'),
    poster:!!document.getElementById('arch-morph-poster'),
    scroll:Number(document.body.dataset.journeyProgress),
    overflow:document.documentElement.scrollWidth-innerWidth,
    robots:document.querySelector('meta[name="robots"]')?.content
  };}""")
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel="chrome",headless=True,args=["--disable-dev-shm-usage"])
 for device,w,h in (("desktop",1440,900),("phone",390,844)):
  for mode in "abc":
   ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1,
    is_mobile=device=="phone",has_touch=device=="phone")
   page=ctx.new_page()
   jsErrors=[]
   page.on("pageerror",lambda e:jsErrors.append(str(e)))
   resp=page.goto(base+"?model="+mode,wait_until="domcontentloaded",timeout=30000)
   page.wait_for_function("""() => document.getElementById('real-liquid-canvas')?.dataset.fluidReady==='true' ||
     !!document.getElementById('real-liquid-canvas')?.dataset.fluidError""",timeout=20000)
   page.wait_for_function("document.getElementById('arch-morph-video')?.readyState>=2",timeout=15000)
   first=metrics(page)
   page.screenshot(path=str(output/f"{device}-{mode}-before.png"),animations="disabled",timeout=12000)
   if device=="desktop":
    box=page.locator("#panorama .arch").nth(2).bounding_box()
    page.mouse.move(box["x"]+box["width"]*.64,box["y"]+box["height"]*.52)
   else:
    page.locator("#real-liquid-demo").click()
   page.wait_for_timeout(2200)
   during=metrics(page)
   page.screenshot(path=str(output/f"{device}-{mode}-splash.png"),animations="disabled",timeout=15000)
   if device=="desktop":page.mouse.move(5,12)
   else:page.locator("#real-liquid-reset").click()
   page.wait_for_timeout(1650)
   last=metrics(page)
   page.screenshot(path=str(output/f"{device}-{mode}-return.png"),animations="disabled",timeout=12000)
   records.append({"device":device,"mode":mode,"first":first,"during":during,"last":last})
   print("REALISTIC",json.dumps({"device":device,"mode":mode,"ready":first["ready"],
     "during":{"drawCalls":during["drawCalls"],"active":during["active"],"energy":during["energy"],"source":during["source"],"time":during["videoTime"]},
     "last":{"active":last["active"],"energy":last["energy"],"playing":last["videoPlaying"]},
     "error":last["error"]}),flush=True)
   if resp.status!=200:errors.append(f"{device}/{mode}: HTTP {resp.status}")
   if first["ready"]!="true" or last["error"]:errors.append(f"{device}/{mode}: GPU compile/runtime {last['error']}")
   if during["drawCalls"]<1 or during["energy"]<.1 or during["source"]!="playing-video":
    errors.append(f"{device}/{mode}: not rendering actual video pixels: {during}")
   if during["videoWidth"]!=1920 or not during["videoPlaying"] or during["videoTime"]<=first["videoTime"]:
    errors.append(f"{device}/{mode}: underlying movie failed or paused")
   if first["mask"]!=True or first["poster"]!=True or last["scroll"]!=0:
    errors.append(f"{device}/{mode}: existing arch or scroll changed")
   if last["energy"]>.20 or last["active"]=="true":
    errors.append(f"{device}/{mode}: paint did not retract")
   if "noindex" not in (first["robots"] or ""):errors.append("Preview indexed")
   if first["overflow"]>3:errors.append(f"{device}/{mode}: page horizontal overflow")
   if jsErrors:errors.append(f"{device}/{mode}: browser runtime {jsErrors[:3]}")
   ctx.close()
 browser.close()
server.shutdown()
(output/"results.json").write_text(json.dumps({"records":records,"errors":errors},indent=2))
for e in errors:print("FAIL",e)
print("REALISTIC LIQUID: ",len(records),"scenarios,",len(errors),"failures")
sys.exit(bool(errors))
