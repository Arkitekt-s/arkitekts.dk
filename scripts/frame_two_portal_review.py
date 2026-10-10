#!/usr/bin/env python3
"""Review frame 01 -> 02 cinematic portal in a real Chromium browser.

The source Frame 01 is frozen; only the new isolated portal is tested.
Screenshots: initial -> 25% -> 65% -> full screen -> returned initial.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json, time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"screenshots"/"frame-two-portal"
OUTPUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/concepts/frame-two-portal/"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
problems=[]
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(width,height) in SIZES.items():
        context=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1,has_touch=width<=390)
        page=context.new_page()
        exceptions=[]
        page.on("pageerror",lambda e:exceptions.append(str(e)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:problems.append(f"{name}: HTTP {response.status}")
        page.locator("#panorama .arch").first.wait_for()
        page.wait_for_timeout(300)
        if page.locator("#panorama .arch").count()!=3:
            problems.append(f"{name}: expected original three arches")
        first={
          "top":page.locator("#frame").evaluate("e=>e.getBoundingClientRect().top"),
          "bottom":page.locator("#frame").evaluate("e=>e.getBoundingClientRect().bottom"),
          "header":page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top"),
          "footer":page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom"),
        }
        if abs(first["header"])>1 or abs(first["footer"]-height)>1:
            problems.append(f"{name}: chrome not pinned initially {first}")
        title=page.locator(".hero-text").evaluate("""e=>{
          let r=e.getBoundingClientRect();
          return {x:r.left,right:r.right,top:r.top,bottom:r.bottom};
        }""")
        if title["x"]<-4 or title["right"]>width+4:
            problems.append(f"{name}: clipped first-frame headline {title}")
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="true":
            problems.append(f"{name}: chapter 02 should be hidden initially")
        page.screenshot(path=str(OUTPUT/f"{name}-01-approved-start.png"),animations="allow")

        # Hold zoom is not the chapter transition. Wheel continuously grows windows.
        page.mouse.move(width*.52,height*.55)
        page.mouse.wheel(0,150)
        page.mouse.wheel(0,150)
        page.wait_for_timeout(1100)
        fraction=float(page.locator("body").get_attribute("data-portal-progress") or 0)
        if not (.27<=fraction<=.55):
            problems.append(f"{name}: wheel progress was not continuous: {fraction}")
        page.screenshot(path=str(OUTPUT/f"{name}-02-morph.png"),animations="allow")
        page.mouse.wheel(0,160)
        page.mouse.wheel(0,160)
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUTPUT/f"{name}-03-expanding.png"),animations="allow")
        page.mouse.wheel(0,160)
        page.mouse.wheel(0,160)
        page.mouse.wheel(0,160)
        page.wait_for_function("parseFloat(document.body.dataset.portalProgress||0)>.995",timeout=6500)
        fraction=float(page.locator("body").get_attribute("data-portal-progress") or 0)
        if fraction<.995:
            problems.append(f"{name}: failed to enter full video scene ({fraction})")
        rect=page.locator("#panorama").bounding_box()
        stage=page.locator("#frame").bounding_box()
        if rect is None or stage is None:
            problems.append(f"{name}: missing final geometry")
        else:
            if abs(rect["width"]-width)>8 or abs(rect["height"]-height)>8:
                problems.append(f"{name}: film did not expand to full viewport {rect}")
            if abs(stage["y"])>5 or abs(stage["height"]-height)>6:
                problems.append(f"{name}: film frame did not grow behind fixed header/footer {stage}")
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="false":
            problems.append(f"{name}: next chapter copy not accessible")
        if not page.locator("#chapter-two").evaluate("e=>e.classList.contains('is-visible')"):
            problems.append(f"{name}: animated title did not enter")
        chrome={
          "header":page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top"),
          "footer":page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")
        }
        if chrome["header"]!=first["header"] or chrome["footer"]!=first["footer"]:
            problems.append(f"{name}: header/footer moved in zoom: {chrome}")
        page.screenshot(path=str(OUTPUT/f"{name}-04-expanded-movie.png"),animations="allow")
        # Video should continue playing during transition where possible.
        status=page.locator("body").get_attribute("data-video-status")
        if name in ("desktop","phone"):
            try:
                page.wait_for_function(
                  "document.querySelector('.arch-video').readyState>=2",timeout=8500)
                v=page.locator(".arch-video").first
                t0=v.evaluate("e=>e.currentTime")
                page.wait_for_timeout(650)
                t1=v.evaluate("e=>e.currentTime")
                if t1-t0<.12:problems.append(f"{name}: movie did not advance ({t0}->{t1}) status={status}")
            except Exception as e:
                problems.append(f"{name}: no movie playback: {str(e)[:300]}")
        for _ in range(7):page.mouse.wheel(0,-160)
        page.wait_for_function("parseFloat(document.body.dataset.portalProgress||1)<.006",timeout=6500)
        pos=float(page.locator("body").get_attribute("data-portal-progress") or -1)
        if pos>.006:problems.append(f"{name}: reverse transition did not fully restore Frame 01 ({pos})")
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="true":
            problems.append(f"{name}: chapter 02 was not hidden after return")
        if abs(page.locator("#frame").evaluate("e=>e.getBoundingClientRect().top")-first["top"])>2:
            problems.append(f"{name}: approved frame was not restored")
        overflow=page.evaluate("document.documentElement.scrollWidth - innerWidth")
        if overflow>2:problems.append(f"{name}: horizontal overflow {overflow}px")
        if exceptions:problems.append(f"{name}: JS errors: {exceptions}")
        page.screenshot(path=str(OUTPUT/f"{name}-05-returned.png"),animations="allow")
        results.append({"size":name,"viewport":[width,height],"video_status":status,
                        "full_progress":fraction,"restored_progress":pos,
                        "fixed_chrome":chrome,"overflow":overflow,"js_errors":exceptions})
        print(f"VERIFIED {name} {width}x{height}: progress={fraction:.3f}, reverse={pos:.3f}, video={status}, errors={len(exceptions)}")
        context.close()
    browser.close()
server.shutdown()
(OUTPUT/"report.json").write_text(json.dumps({"results":results,"failures":problems},indent=2))
if problems:raise SystemExit("\n".join("FAIL "+problem for problem in problems))
print("PASS: zoom-frame animation, full-screen video, animated next chapter and reversible scroll on all four sizes.")
