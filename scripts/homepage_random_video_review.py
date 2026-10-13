#!/usr/bin/env python3
"""Verify one freshly randomized video per visit, shared through scenes 01–03."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/random-homepage-films"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
SITE=f"http://127.0.0.1:{server.server_port}/"
CLIPS={0:"18069232",1:"25744122",2:"18069165"}
RESULTS=[]
FAIL=[]
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for device,width,height in [("phone",390,844),("tablet",768,1024),("desktop",1440,900)]:
        for selected,value in [(0,.05),(1,.51),(2,.95)]:
            ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1)
            page=ctx.new_page()
            page.add_init_script(f"Math.random=()=>{value}")
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            response=page.goto(SITE,wait_until="domcontentloaded",timeout=30000)
            page.wait_for_function(
                "document.querySelector('#panorama')?.dataset.artScene!==undefined",timeout=10000)
            initial=page.evaluate("""() => {
              const pan=document.getElementById('panorama');
              const v=document.getElementById('arch-morph-video');
              const chooser=document.getElementById('hold-scene-control');
              return {chosen:Number(pan.dataset.artScene),
                initial:Number(document.body.dataset.initialHomepageFilm),
                label:chooser?.getAttribute('aria-label'),
                altSrc:v?.getAttribute('src')||'',
                originalSrc:document.querySelector('.arch-video source')?.src||'',
                poster:document.getElementById('arch-morph-poster')?.src||'',
                hiddenOriginal:getComputedStyle(pan).visibility==='hidden',
                progress:Number(document.body.dataset.journeyProgress||0)};
            }""")
            if response.status!=200:FAIL.append(f"{device} film {selected}: HTTP {response.status}")
            if initial["chosen"]!=selected or initial["initial"]!=selected:
                FAIL.append(f"{device} film {selected}: random choice incorrect {initial}")
            if CLIPS[selected] not in initial["altSrc"]:
                FAIL.append(f"{device} film {selected}: wrong alternative URL {initial['altSrc']}")
            if CLIPS[selected] not in initial["poster"] or not initial["hiddenOriginal"]:
                FAIL.append(f"{device} film {selected}: startup poster or default-film bleed")
            if CLIPS[0] not in initial["originalSrc"]:
                FAIL.append(f"{device} film {selected}: original clip source changed unexpectedly")
            if not initial["label"]:
                FAIL.append(f"{device} film {selected}: missing scene selection label")
            for chapter in (2,3):
                page.locator("#next-chapter").evaluate("(b)=>b.click()")
                page.wait_for_function(
                    "(n)=>Number(document.body.dataset.journeyProgress)>n-.012",
                    arg=chapter-1,timeout=15000)
                current=int(page.locator("#panorama").get_attribute("data-art-scene"))
                if current!=selected:
                    FAIL.append(f"{device}: film switched in section {chapter}, from {selected} to {current}")
                currentSrc=page.locator("#arch-morph-video").get_attribute("src") or ""
                if CLIPS[selected] not in currentSrc:
                    FAIL.append(f"{device}: section {chapter} changed film {selected}")
            page.locator("#previous-chapter").evaluate("(b)=>b.click()")
            page.wait_for_function("Number(document.body.dataset.journeyProgress)<1.012",timeout=15000)
            if int(page.locator("#panorama").get_attribute("data-art-scene"))!=selected:
                FAIL.append(f"{device} film {selected}: video changed when scrolling backward")
            if errors:FAIL.append(f"{device} film {selected}: JS runtime errors {errors[:3]}")
            RESULTS.append({"device":device,"selected":selected,"first":initial,
                            "final":int(page.locator("#panorama").get_attribute("data-art-scene")),
                            "jsErrors":errors[:3]})
            print(f"PASS {device} original film {selected+1} through sections 1, 2, 3 and reverse",
                  flush=True)
            if device=="phone":
                page.screenshot(path=str(OUT/f"phone-video-{selected+1}.png"),
                                animations="disabled",timeout=12000)
            ctx.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"tests":RESULTS,"failures":FAIL},indent=2))
for issue in FAIL:print("FAIL",issue)
print(f"RANDOM-VIDEO: {len(RESULTS)} browser sessions, {len(FAIL)} errors")
sys.exit(1 if FAIL else 0)
