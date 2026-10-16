#!/usr/bin/env python3
"""Test the public-design comparison page locally in real Chromium."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys

root=Path(__file__).resolve().parents[1]
out=root/"screenshots/liquid-arch-compare"
out.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/previews/liquid-arch-compare/"
fails=[];results=[]

def data(frame):
    return frame.evaluate("""() => {
      const c=document.getElementById('liquid-splash-canvas');
      const v=document.getElementById('arch-morph-video');
      const lens=document.getElementById('arch-morph-lens');
      return {
        active:c?.dataset.liquidActive,extent:Number(c?.dataset.liquidExtent||0),
        source:c?.dataset.sampleSource,model:document.body.dataset.liquidMode,
        cursorGlow:c?.dataset.cursorGlowDisabled,renderVersion:c?.dataset.liquidVariant,
        moviePlaying:!!v&&!v.paused,movieTime:v?.currentTime||0,movieWidth:v?.videoWidth||0,
        pointerCanvas:!!document.body.querySelector('.paint-cursor'),
        glassHidden:!lens||getComputedStyle(lens).display==='none',
        mask:!!document.getElementById('live-arch-morph-path')
      };
    }""")

try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
    for variant in ("a","b","c"):
        ctx=browser.new_context(viewport={"width":1440,"height":900},device_scale_factor=1)
        page=ctx.new_page()
        exceptions=[]
        page.on("pageerror",lambda err:exceptions.append(str(err)))
        response=page.goto(base+"?model="+variant,wait_until="domcontentloaded",timeout=25000)
        page.wait_for_function("""() => {
          const f=document.getElementById('home');
          return f && f.contentDocument && f.contentDocument.querySelector('#liquid-splash-canvas') &&
            f.contentDocument.querySelector('#arch-morph-video')?.readyState>=2;
        }""",timeout=24000)
        child=page.frame_locator("#home")
        page.wait_for_timeout(300)
        before=child.locator("body").evaluate("""() => ({
          source:document.body.dataset.archMorphScene,
          ambientScript:!!document.querySelector('script[src*="scene-pointer-ambient"]'),
          lensHidden:getComputedStyle(document.getElementById('arch-morph-lens')).display === 'none'
        })""")
        rect=child.locator("#panorama .arch").nth(1).bounding_box()
        page.mouse.move(rect["x"]+rect["width"]*.68,rect["y"]+rect["height"]*.52)
        page.wait_for_timeout(1850)
        inside=data(page.frames[-1])
        page.screenshot(path=str(out/f"{variant}-liquid-active.png"),animations="disabled")
        page.mouse.move(5,5)
        page.wait_for_timeout(2100)
        after=data(page.frames[-1])
        page.screenshot(path=str(out/f"{variant}-liquid-returned.png"),animations="disabled")
        results.append({"variant":variant,"before":before,"inside":inside,"after":after,"errors":exceptions})
        if response.status!=200:fails.append(f"{variant}: outer page status {response.status}")
        if inside["model"]!=variant:fails.append(f"{variant}: wrong model {inside}")
        if before["ambientScript"] or not before["lensHidden"] or inside["pointerCanvas"]:
            fails.append(f"{variant}: competing pointer radiation still exists")
        if before["source"]!="1" or not inside["mask"]:
            fails.append(f"{variant}: original homepage movie/mask missing")
        if inside["active"]!="true" or inside["extent"]<90:
            fails.append(f"{variant}: liquid not extruding {inside}")
        if inside["source"]!="playing-video" or not inside["moviePlaying"]:
            fails.append(f"{variant}: live video pixels unavailable {inside}")
        if inside["renderVersion"]!="iridescent-flowing-membrane-v3" or inside["cursorGlow"]!="true":
            fails.append(f"{variant}: expected isolation or renderer not loaded")
        if after["active"]!="false" or after["extent"]>15:
            fails.append(f"{variant}: liquid did not return {after}")
        if not after["moviePlaying"] or after["movieTime"]<=inside["movieTime"]:
            fails.append(f"{variant}: base movie playback stopped")
        if exceptions:fails.append(f"{variant}: JavaScript errors {exceptions[:3]}")
        print(f"MODEL {variant.upper()}",json.dumps({"inside":inside,"returned":after}),flush=True)
        ctx.close()
    browser.close()
finally:
    server.shutdown()
(out/"results.json").write_text(json.dumps({"checks":results,"failures":fails},indent=2))
for f in fails:print("FAIL:",f,flush=True)
print(f"Liquid arch compare: {len(results)} models, {len(fails)} failures",flush=True)
sys.exit(bool(fails))
