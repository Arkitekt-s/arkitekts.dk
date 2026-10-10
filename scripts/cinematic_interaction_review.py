#!/usr/bin/env python3
"""Frame Studio acceptance tests: pinned chrome and mouse-controlled episode transitions.

Browser-based checks on real 320, 390, 768 and 1440px viewports.
Full-page scroll must never occur; header & footer must stay pixel-stationary.
Screenshots from every frame are saved as a CI artifact.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/"screenshots"/"stage-deck-v2"
SHOTS.mkdir(parents=True, exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/concepts/stage-deck-v2/"
sizes={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
errors=[]
report=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--enable-webgl","--use-gl=angle","--use-angle=swiftshader"])
    for name,(w,h) in sizes.items():
        page=browser.new_page(viewport={"width":w,"height":h},device_scale_factor=1)
        exceptions=[]
        page.on("pageerror",lambda e:exceptions.append(str(e)))
        response=page.goto(URL,wait_until="load",timeout=30000)
        page.wait_for_timeout(350)
        if response.status!=200:errors.append(f"{name}: HTTP {response.status}")
        if page.locator(".scene").count()!=4:errors.append(f"{name}: expected 4 fixed frames")
        if page.locator(".scene.is-current").get_attribute("data-scene")!="0":
            errors.append(f"{name}: initial frame not 0")
        if page.locator("h1").count()!=1:errors.append(f"{name}: expected one H1")
        headline=page.locator(".hero-title").evaluate("""el => {
            const r=el.getBoundingClientRect();
            return {left:r.left,right:r.right,overflow:[...el.querySelectorAll('span')].some(s=>s.scrollWidth>s.clientWidth+2)};
        }""")
        if headline["left"]<-2 or headline["right"]>w+2 or headline["overflow"]:
            errors.append(f"{name}: clipped hero headline {headline}")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:errors.append(f"{name}: horizontal overflow {overflow}px")
        start=page.evaluate("""() => {
          const h=document.querySelector('.header').getBoundingClientRect();
          const f=document.querySelector('.footer').getBoundingClientRect();
          return {headTop:h.top,footBottom:f.bottom,scrollY:scrollY};
        }""")
        page.screenshot(path=str(SHOTS/f"{name}-01-arches.png"),animations="disabled")
        page.mouse.move(w*.45,h*.5)
        # Pointer moves the arches in depth, but the fixed shell stays still.
        if w>760:
            drift=page.locator("#arched-world").evaluate("e => getComputedStyle(e).getPropertyValue('--camera-x')")
            if not drift or drift.strip()=="0px":
                errors.append(f"{name}: mouse-driven arch parallax missing")
        page.mouse.wheel(0,145)
        page.wait_for_timeout(250)
        if page.locator(".scene.is-current").get_attribute("data-scene")!="1":
            errors.append(f"{name}: wheel failed to advance from intro to photo frame")
        try:
            page.wait_for_function(
                "document.querySelector('.reel-card:first-child img').naturalWidth > 0",
                timeout=8500,
            )
        except Exception:
            errors.append(f"{name}: portrait image failed to load")
        page.screenshot(path=str(SHOTS/f"{name}-02-photos.png"),animations="disabled")
        # The photograph strip must be draggable, independent of the scene selector.
        reel=page.locator("#photo-reel")
        reelbox=reel.bounding_box()
        if reelbox:
            x=reelbox["x"]+reelbox["width"]*.55
            y=reelbox["y"]+reelbox["height"]*.45
            page.mouse.move(x,y)
            page.mouse.down()
            page.mouse.move(x-85,y,steps=8)
            page.mouse.up()
            tx=reel.evaluate("e => e.style.translate")
            if not tx or tx.startswith("0px"):
                errors.append(f"{name}: photo reel did not respond to dragging")
        # Explicit frame button is fast and accessible even while wheel is locked.
        page.locator(".episode-progress [data-jump='2']").click()
        page.wait_for_timeout(120)
        if page.locator(".scene.is-current").get_attribute("data-scene")!="2":
            errors.append(f"{name}: scene button failed to show work/profile")
        page.screenshot(path=str(SHOTS/f"{name}-03-work.png"),animations="disabled")
        page.locator(".episode-progress [data-jump='3']").click()
        page.wait_for_timeout(380)
        if page.locator(".scene.is-current").get_attribute("data-scene")!="3":
            errors.append(f"{name}: scene button failed to show contact globe")
        if page.locator("#globe").evaluate("e => e.width<40 || e.height<40"):
            errors.append(f"{name}: globe canvas failed to size")
        globe=page.locator("#globe")
        page.wait_for_timeout(350)
        if globe.get_attribute("data-copenhagen-visible")!="true":
            errors.append(f"{name}: Copenhagen pin is not visible at the default orientation")
        yaw_before=float(globe.get_attribute("data-yaw") or 0)
        bbox=globe.bounding_box()
        if bbox:
            gx=bbox["x"]+bbox["width"]*.45
            gy=bbox["y"]+bbox["height"]*.45
            page.mouse.move(gx,gy)
            page.mouse.down()
            # Keep the pointer within the viewport on narrow phones.
            drag_delta=max(25,min(110,w-gx-16))
            page.mouse.move(gx+drag_delta,gy-35,steps=12)
            page.mouse.up()
            page.wait_for_timeout(260)
            yaw_after=float(globe.get_attribute("data-yaw") or 0)
            if abs(yaw_after-yaw_before)<.02:
                errors.append(f"{name}: globe did not rotate after pointer drag")
            page.locator("#globe-zoom-in").click(force=True)
            page.wait_for_timeout(230)
            zoom=float(globe.get_attribute("data-zoom") or 0)
            if zoom<1.02:errors.append(f"{name}: globe zoom button failed ({zoom})")
            page.locator("#globe-home").click(force=True)
            page.wait_for_timeout(400)
            if globe.get_attribute("data-copenhagen-visible")!="true":
                errors.append(f"{name}: Copenhagen marker not visible after home")
        else:
            errors.append(f"{name}: globe not interactive because canvas box missing")
        page.screenshot(path=str(SHOTS/f"{name}-04-globe.png"),animations="disabled")
        end=page.evaluate("""() => {
          const h=document.querySelector('.header').getBoundingClientRect();
          const f=document.querySelector('.footer').getBoundingClientRect();
          return {headTop:h.top,footBottom:f.bottom,scrollY:scrollY};
        }""")
        if start!=end:errors.append(f"{name}: fixed chrome moved {start} -> {end}")
        page.keyboard.press("Home")
        if page.locator(".scene.is-current").get_attribute("data-scene")!="0":
            errors.append(f"{name}: Home key failed")
        if w<=760:
            toggle=page.locator(".menu-trigger")
            toggle.click()
            if toggle.get_attribute("aria-expanded")!="true":
                errors.append(f"{name}: mobile menu failed to open")
            page.keyboard.press("Escape")
            if toggle.get_attribute("aria-expanded")!="false":
                errors.append(f"{name}: mobile menu failed to close")
        if exceptions:errors.append(f"{name}: JS errors: {exceptions}")
        # External image errors don't break the structural prototype, but are reported.
        photo=page.locator(".reel-card:first-child img").evaluate("img => ({complete:img.complete,valid:img.naturalWidth>0})")
        report.append({"size":name,"width":w,"height":h,"chrome":start,"overflow":overflow,"portrait":photo,"js_exceptions":exceptions})
        print(f"CHECKED {name} {w}x{h} | fixed header/footer | four frames | globe | JS errors={len(exceptions)}")
        page.close()
    browser.close()
server.shutdown()
(SHOTS/"report.json").write_text(json.dumps({"checks":report,"errors":errors},indent=2))
if errors:raise SystemExit("\n".join("FAIL "+e for e in errors))
print("PASS: four frame-accurate interactive scenes at 320/390/768/1440px; fixed header and footer.")
