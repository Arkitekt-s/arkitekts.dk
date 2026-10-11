#!/usr/bin/env python3
"""Validate live Option A transitions 01→02→03 and reverse at five screen widths.

Uses a local copy of the actual homepage and its unchanged production assets.
External media is optional; poster fallback must remain compositor-visible.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/option-a-live"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),
       "large-tablet":(1024,1366),"desktop":(1440,900)}
failures=[]
results=[]

METRICS=r"""() => {
 const pan=document.getElementById('panorama');
 const film=document.getElementById('portal-film');
 const videos=[...document.querySelectorAll('.arch-video')];
 return {
  progress:Number(document.body.dataset.journeyProgress||0),
  chapter:Number(document.body.dataset.currentFrame||0),
  panOpacity:Number(getComputedStyle(pan).opacity),
  filmOpacity:Number(getComputedStyle(film).opacity),
  filmVisible:getComputedStyle(film).visibility==='visible',
  filmPoster:film.getAttribute('poster'),
  panInlineWidth:pan.style.width,panInlineHeight:pan.style.height,
  panInlineGap:pan.style.gap,panInlineTransform:pan.style.transform,
  panScale:pan.style.getPropertyValue('--scene-zoom'),
  panWidth:pan.offsetWidth,panHeight:pan.offsetHeight,
  fullscreenReady:film.readyState>=2,
  videoRates:videos.map(v=>v.playbackRate),
  sceneryAnimation:getComputedStyle(document.querySelector('#panorama .scenery')).animationName,
  horizontalOverflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth,
  jsMode:getComputedStyle(document.querySelector('.site-header')).position
 }
}"""

def check_metrics(name,label,values,baseline):
    progress=values["progress"]
    if any(values[k] for k in ("panInlineWidth","panInlineHeight","panInlineGap","panInlineTransform")):
        failures.append(f"{name} {label}: expensive layout resize or transform override")
    if abs(values["panWidth"]-baseline["panWidth"])>2 or abs(values["panHeight"]-baseline["panHeight"])>2:
        failures.append(f"{name} {label}: arch geometry jumped: {values['panWidth']}x{values['panHeight']}")
    if values["horizontalOverflow"]>3:
        failures.append(f"{name} {label}: horizontal scroll overflow {values['horizontalOverflow']}")
    if values["sceneryAnimation"]!="none":
        failures.append(f"{name} {label}: background animation restarts while navigating")
    if not values["filmPoster"] or "18069232" not in values["filmPoster"]:
        failures.append(f"{name} {label}: missing full-screen fallback")
    if not all(abs(rate-.50)<.01 for rate in values["videoRates"]):
        failures.append(f"{name} {label}: film speed changed {values['videoRates']}")
    if progress>.96:
        if values["panOpacity"]>.05 or values["filmOpacity"]<.99 or not values["filmVisible"]:
            failures.append(f"{name} {label}: dissolve left a visible seam: {values['panOpacity']}/{values['filmOpacity']}")
    if progress<.04:
        if values["panOpacity"]<.98 or values["filmOpacity"]>.03:
            failures.append(f"{name} {label}: opening scene not restored: {values['panOpacity']}/{values['filmOpacity']}")

with sync_playwright() as play:
    browser=play.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for name,(width,height) in SIZES.items():
        ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1)
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{name}: homepage HTTP {response.status}")
        page.wait_for_function("document.body.dataset.journeyProgress!==undefined",timeout=6000)
        base=page.evaluate(METRICS)
        check_metrics(name,"01",base,base)
        page.screenshot(path=str(OUT/f"{name}-01.png"),animations="disabled")
        page.locator("#next-chapter").evaluate("(button)=>button.click()")
        page.wait_for_function("Number(document.body.dataset.journeyProgress)>.994",timeout=12000)
        a=page.evaluate(METRICS)
        check_metrics(name,"02",a,base)
        if a["chapter"]!=2:failures.append(f"{name}: chapter two label incorrect {a['chapter']}")
        page.screenshot(path=str(OUT/f"{name}-02.png"),animations="disabled")
        page.locator("#next-chapter").evaluate("(button)=>button.click()")
        page.wait_for_function("Number(document.body.dataset.journeyProgress)>1.994",timeout=12000)
        b=page.evaluate(METRICS)
        check_metrics(name,"03",b,base)
        if b["chapter"]!=3:failures.append(f"{name}: chapter three label incorrect {b['chapter']}")
        page.screenshot(path=str(OUT/f"{name}-03.png"),animations="disabled")
        page.locator("#previous-chapter").evaluate("(button)=>button.click()")
        page.wait_for_function("Number(document.body.dataset.journeyProgress)<1.006",timeout=12000)
        reverse2=page.evaluate(METRICS)
        check_metrics(name,"reverse-02",reverse2,base)
        page.locator("#previous-chapter").evaluate("(button)=>button.click()")
        page.wait_for_function("Number(document.body.dataset.journeyProgress)<.006",timeout=12000)
        reverse1=page.evaluate(METRICS)
        check_metrics(name,"reverse-01",reverse1,base)
        page.screenshot(path=str(OUT/f"{name}-return-01.png"),animations="disabled")
        if errors:failures.append(f"{name}: JS runtime errors {errors[:3]}")
        results.append({"device":name,"start":base,"at02":a,"at03":b,
                        "reverse02":reverse2,"reverse01":reverse1,"jsErrors":errors[:3]})
        print("SCENE "+name+" "+json.dumps({"start":base["progress"],
            "middle":a["progress"],"third":b["progress"],"return":reverse1["progress"],
            "archSize":[base["panWidth"],a["panWidth"],b["panWidth"]],
            "opacity":[a["panOpacity"],a["filmOpacity"]],
            "overflow":[base["horizontalOverflow"],a["horizontalOverflow"],b["horizontalOverflow"]],
            "jsErrors":len(errors)}),flush=True)
        ctx.close()
    browser.close()
server.shutdown()
(OUT/"results.json").write_text(json.dumps({"failures":failures,"results":results},indent=2))
for issue in failures:print("FAIL",issue)
print(f"RESULT: {len(SIZES)} viewport sizes, {len(SIZES)*5} checkpoints; {len(failures)} failures")
sys.exit(1 if failures else 0)
