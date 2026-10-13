#!/usr/bin/env python3
"""Compare three isolated timings using a clone of the real homepage."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/section-2-to-3-timing"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/previews/section-2-to-3/"
failures=[]
records=[]
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for name,w,h in (("phone",390,844),("tablet",768,1024),("desktop",1440,900)):
        context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1,has_touch=(w<=768))
        page=context.new_page()
        for mode in "abc":
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            response=page.goto(URL+"?option="+mode,wait_until="domcontentloaded",timeout=25000)
            page.wait_for_function("""() => Number(document.body.dataset.journeyProgress)>.985 &&
               document.body.dataset.currentFrame==='2'""",timeout=12000)
            status=page.evaluate("""() => ({
              mode:document.documentElement.dataset.previewOption,
              progress:Number(document.body.dataset.journeyProgress),
              robots:document.querySelector('meta[name="robots"]')?.content,
              videoCount:document.querySelectorAll('#arch-morph-media video').length,
              masks:document.querySelectorAll('#live-arch-morph-path').length,
              overflow:document.documentElement.scrollWidth-innerWidth,
              selection:document.querySelector('#preview23-toolbar a[aria-current="page"]')?.textContent
            })""")
            if response.status!=200:failures.append(f"{name} {mode}: HTTP {response.status}")
            if status["mode"]!=mode or status["selection"]!=mode.upper():
                failures.append(f"{name} {mode}: wrong selected option")
            if status["videoCount"]!=1 or status["masks"]!=1:
                failures.append(f"{name} {mode}: real morph animation not present")
            if "noindex" not in (status["robots"] or ""):
                failures.append(f"{name} {mode}: previews should not be indexed")
            if status["overflow"]>3:
                failures.append(f"{name} {mode}: horizontal overflow {status['overflow']}")
            page.screenshot(path=str(OUT/f"{name}-option-{mode}-before.png"),animations="disabled")
            page.locator("#next-chapter").evaluate("(b)=>b.click()")
            page.wait_for_timeout(260)
            first=float(page.evaluate("Number(document.body.dataset.journeyProgress)"))
            if mode=="a":
                if first>1.025:failures.append(f"{name} A: moved during promised hold {first}")
                page.wait_for_timeout(1550)
                last=float(page.evaluate("Number(document.body.dataset.journeyProgress)"))
                if last<1.90:failures.append(f"{name} A: 0.8-second timer failed to resume {last}")
            elif mode=="b":
                if not (1.15<first<1.82):failures.append(f"{name} B: slow transition missing {first}")
                page.wait_for_timeout(2000)
                last=float(page.evaluate("Number(document.body.dataset.journeyProgress)"))
                if last<1.99:failures.append(f"{name} B: slow transition never completed {last}")
            else:
                page.wait_for_timeout(800)
                blocked=float(page.evaluate("Number(document.body.dataset.journeyProgress)"))
                if first>1.025 or blocked>1.025:
                    failures.append(f"{name} C: advanced without deliberate second scroll {first}/{blocked}")
                page.locator("#next-chapter").evaluate("(b)=>b.click()")
                page.wait_for_timeout(1100)
                last=float(page.evaluate("Number(document.body.dataset.journeyProgress)"))
                if last<1.98:failures.append(f"{name} C: second click did not advance {last}")
            page.screenshot(path=str(OUT/f"{name}-option-{mode}-after.png"),animations="disabled")
            if errors:failures.append(f"{name} {mode}: JS exceptions {errors[:2]}")
            records.append({"device":name,"mode":mode,"start":status["progress"],
                "after260ms":first,"result":last,"pageErrors":errors[:2]})
            print("CHECK "+json.dumps(records[-1]),flush=True)
        context.close()
    browser.close()
server.shutdown()
(OUT/"results.json").write_text(json.dumps({"checks":records,"failures":failures},indent=2))
for error in failures:print("FAIL "+error)
print("TIMING PREVIEWS: %s cases, %s failures"%(len(records),len(failures)))
sys.exit(1 if failures else 0)
