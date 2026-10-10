#!/usr/bin/env python3
"""Frame 01 only: real Chromium review of moving landscape and fixed shell.

This tests first-frame behavior at four devices. No test of frames 2-4:
they are intentionally outside the current design review.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"frame-one-v3"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/concepts/frame-one-v3/"
viewports={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
reviews=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in viewports.items():
        page=browser.new_page(viewport={"width":w,"height":h},device_scale_factor=1)
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        response=page.goto(url,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{name}: HTTP {response.status}")
        page.locator(".arch").first.wait_for()
        if page.locator(".arch").count()!=3:failures.append(f"{name}: expected 3 arches")
        if page.locator(".scene").count()!=0:failures.append(f"{name}: should not show unapproved frames 2-4")
        if page.locator("h1").count()!=1:failures.append(f"{name}: expected one H1")
        title=page.locator(".hero-text").evaluate("""el=>{
            const r=el.getBoundingClientRect();
            return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
        }""")
        if title["left"]<-3 or title["right"]>w+3 or title["top"]<-2 or title["bottom"]>h+2:
            failures.append(f"{name}: headline clipped: {title}")
        overflow=page.evaluate("document.documentElement.scrollWidth - innerWidth")
        if overflow>2:failures.append(f"{name}: horizontal overflow {overflow}px")
        chrome=page.evaluate("""()=>{
           const head=document.querySelector('.site-header').getBoundingClientRect();
           const foot=document.querySelector('.site-footer').getBoundingClientRect();
           return {head:head.top,footer:foot.bottom,scroll:scrollY};
        }""")
        bg_animation=page.locator(".scenery").first.evaluate("el=>getComputedStyle(el).animationName")
        cloud_animation=page.locator(".light-haze").first.evaluate("el=>getComputedStyle(el).animationName")
        if bg_animation=="none" or cloud_animation=="none":
            failures.append(f"{name}: animated photo or moving clouds not running")
        # Give the landscape time to render; screenshot is actual page output.
        try:
            page.wait_for_function("document.body.dataset.landscapeLoaded !== undefined",timeout=8000)
        except Exception:
            pass
        page.wait_for_timeout(500)
        image_loaded=page.evaluate("document.body.dataset.landscapeLoaded")
        if image_loaded=="false":
            failures.append(f"{name}: background mountain image failed")
        page.screenshot(path=str(OUT/f"{name}-idle.png"),animations="allow")
        # Pointer interaction should move layers without ever moving the header/footer.
        px=w*.76;py=h*.60
        page.mouse.move(px,py,steps=7)
        page.wait_for_timeout(450)
        if w>760:
            depth=float(page.evaluate("document.body.dataset.mouseDepth || '0'"))
            if depth<.2:failures.append(f"{name}: pointer parallax missing ({depth})")
        page.mouse.down()
        page.wait_for_timeout(350)
        if not page.locator("body").evaluate("e=>e.classList.contains('is-holding')"):
            failures.append(f"{name}: hold-to-zoom did not activate")
        zoom=page.locator("#panorama").evaluate("el=>getComputedStyle(el).getPropertyValue('--scene-zoom').trim()")
        if zoom!="1.19":failures.append(f"{name}: hold depth not applied ({zoom})")
        page.screenshot(path=str(OUT/f"{name}-hold.png"),animations="allow")
        page.mouse.up()
        page.wait_for_timeout(180)
        if page.locator("body").evaluate("e=>e.classList.contains('is-holding')"):
            failures.append(f"{name}: hold did not release")
        # Pause motion: both still background and fog must have paused animations.
        page.locator("#motion-button").click()
        status=page.locator(".scenery").first.evaluate("el=>getComputedStyle(el).animationPlayState")
        if status!="paused":failures.append(f"{name}: pause failed ({status})")
        page.locator("#motion-button").click()
        if w<=760:
            menu=page.locator("#menu-button")
            menu.click()
            if menu.get_attribute("aria-expanded")!="true":failures.append(f"{name}: menu did not open")
            page.keyboard.press("Escape")
            if menu.get_attribute("aria-expanded")!="false":failures.append(f"{name}: menu did not close")
        chrome_after=page.evaluate("""()=>{
           const head=document.querySelector('.site-header').getBoundingClientRect();
           const foot=document.querySelector('.site-footer').getBoundingClientRect();
           return {head:head.top,footer:foot.bottom,scroll:scrollY};
        }""")
        if chrome_after!=chrome:failures.append(f"{name}: chrome moved {chrome} -> {chrome_after}")
        if errors:failures.append(f"{name}: JS exceptions {errors}")
        reviews.append({"viewport":name,"width":w,"height":h,"landscapeLoaded":image_loaded,
                        "photoAnimation":bg_animation,"cloudAnimation":cloud_animation,
                        "horizontalOverflow":overflow,"javascriptErrors":errors})
        print(f"CHECK {name}: {w}x{h}, photo={image_loaded}, panorama animation={bg_animation}, JS errors={len(errors)}")
        page.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"tests":reviews,"failures":failures},indent=2))
if failures:raise SystemExit("\n".join("FAIL "+error for error in failures))
print("PASS: Frame 01, three animated arches, cloud movement, pointer, hold, chrome, mobile navigation.")
