#!/usr/bin/env python3
"""Live real-video liquid portal: desktop pointer, elastic return, phone demo."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
root=Path(__file__).resolve().parents[1]
out=root/"screenshots/liquid-video-portal"
out.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/previews/liquid-video-portal/"
failures=[];results=[]
def inspect(page):
 return page.evaluate("""() => {
 const c=document.getElementById('liquid-splash-canvas');
 const v=document.getElementById('arch-morph-video');
 return {active:c?.dataset.liquidActive,
  extent:Number(c?.dataset.liquidExtent||0),
  sample:c?.dataset.sampleSource,
  rgb:c?.dataset.sampleRgb,
  movie:document.body.dataset.archMorphScene,
  videoSrc:v?.currentSrc,
  videoWidth:v?.videoWidth,
  videoPlaying:!v?.paused,
  currentTime:v?.currentTime,
  playable:v?.readyState>=2,
  muted:v?.muted,
  code:document.querySelector('meta[name="robots"]')?.content,
  overflow:document.documentElement.scrollWidth-innerWidth,
  progress:Number(document.body.dataset.journeyProgress||0),
  stage:!!document.querySelector('.arch-morph-media'),
  canvasSize:[c?.width,c?.height]
 }
}""")
with sync_playwright() as p:
 browser=p.chromium.launch(channel="chrome",headless=True,args=["--disable-dev-shm-usage"])
 for device,w,h in (("desktop",1440,900),("phone",390,844)):
  ctx=browser.new_context(viewport={"width":w,"height":h},
   device_scale_factor=1,has_touch=device=="phone",is_mobile=device=="phone")
  page=ctx.new_page()
  errs=[]
  page.on("pageerror",lambda e:errs.append(str(e)))
  response=page.goto(url,wait_until="domcontentloaded",timeout=30000)
  page.wait_for_function("document.body.dataset.archMorphEnabled==='true' && !!document.getElementById('liquid-splash-canvas')",timeout=15000)
  page.wait_for_function("document.getElementById('arch-morph-video')?.readyState>=2",timeout=15000)
  before=inspect(page)
  page.screenshot(path=str(out/f"{device}-normal.png"),animations="disabled")
  if device=="desktop":
   middle=page.locator("#panorama .arch").nth(1).bounding_box()
   xy=(middle["x"]+middle["width"]*.68,middle["y"]+middle["height"]*.52)
   page.mouse.move(*xy)
  else:
   page.locator("#liquid-demo").click()
  page.wait_for_timeout(1350)
  during=inspect(page)
  page.screenshot(path=str(out/f"{device}-liquid-escaping.png"),animations="disabled")
  if device=="desktop":
   page.mouse.move(5,10)
   page.wait_for_timeout(1900)
  else:
   page.wait_for_timeout(5800)
  after=inspect(page)
  page.screenshot(path=str(out/f"{device}-returned.png"),animations="disabled")
  if response.status!=200:failures.append(f"{device} HTTP {response.status}")
  if "noindex" not in (before["code"] or ""):failures.append(f"{device}: preview indexable")
  if before["movie"]!="1" or before["videoWidth"]!=1920 or not before["videoPlaying"]:
   failures.append(f"{device} movie broken {before}")
  if not during["videoPlaying"] or during["currentTime"]<=before["currentTime"]:
   failures.append(f"{device}: video stopped while liquid escaped")
  if during["active"]!="true" or during["extent"]<60:
   failures.append(f"{device}: no elastic spill {during}")
  if during["sample"]!="playing-video" or not during["rgb"]:
   failures.append(f"{device}: fluid is not colored by sampled video {during}")
  if after["extent"]>10 or after["active"]!="false":
   failures.append(f"{device}: liquid didn't return to original arch {after}")
  if after["videoPlaying"] is not True:
   failures.append(f"{device}: video stopped after effect")
  if before["overflow"]>4 or during["overflow"]>4:
   failures.append(f"{device}: horizontal overflow")
  if errs:failures.append(f"{device}: JS errors {errs[:3]}")
  results.append({"device":device,"before":before,"during":during,"after":after,"errors":errs})
  print("LIQUID-"+device.upper(),json.dumps({"initial":before,"during":during,"after":after}),flush=True)
  ctx.close()
 browser.close()
server.shutdown()
(out/"results.json").write_text(json.dumps({"checks":results,"failures":failures},indent=2))
for error in failures:print("FAIL:",error)
print("LIQUID PORTAL:",len(results),"interactive browser paths,",len(failures),"failures")
sys.exit(bool(failures))
