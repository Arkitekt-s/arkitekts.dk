#!/usr/bin/env python3
"""Check all five cinematic scenes, the dark gallery-to-contact transition,
and a *moving geographic globe* in Chromium at four viewport sizes.
This test never modifies any approved source baseline.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"frame-five-contact"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/concepts/frame-five-contact/"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
errors=[]
records=[]
def wheel(page,count):
    for _ in range(count):page.mouse.wheel(0,160)
def wait(page,p):
    page.wait_for_function(f"parseFloat(document.body.dataset.journeyProgress||0)>{p}",timeout=8000)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        crashes=[]
        page.on("pageerror",lambda error:crashes.append(str(error)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:errors.append(f"{name}: HTTP {response.status}")
        if page.locator("#panorama .arch").count()!=3:errors.append(f"{name}: approved arches changed")
        if page.locator(".twenty-piece").count()!=9:errors.append(f"{name}: approved '20' changed")
        if page.locator(".gallery-photo").count()!=7:errors.append(f"{name}: approved gallery missing")
        if page.locator("#frame-five-contact").get_attribute("aria-hidden")!="true":
            errors.append(f"{name}: contact appeared before Frame 05")
        head=page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top")
        foot=page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")
        page.screenshot(path=str(OUT/f"{name}-01-landing.png"),animations="allow")

        page.mouse.move(w*.58,h*.49)
        wheel(page,5);wait(page,.995)
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="false":
            errors.append(f"{name}: Frame 02 copy not visible")
        wheel(page,5);wait(page,1.995)
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="false":
            errors.append(f"{name}: Frame 03 not visible")
        if page.locator(".twenty-piece").first.evaluate("e=>getComputedStyle(e).animationName")!="none":
            errors.append(f"{name}: 20 automatically animates again")
        wheel(page,5);wait(page,2.995)
        gallery=page.locator("#frame-four-gallery")
        if gallery.get_attribute("aria-hidden")!="false":
            errors.append(f"{name}: Frame 04 photo gallery missing")

        # Move through gallery to final photo; same near-black approved ending.
        for _ in range(7):
            btn=page.locator("#gallery-next")
            if not btn.is_enabled():break
            btn.click(timeout=1800)
            page.wait_for_timeout(230)
        page.wait_for_function("parseFloat(document.body.dataset.galleryIndex||0)>5.98",timeout=7000)
        if float(page.locator("body").get_attribute("data-gallery-darkness") or 0)<.98:
            errors.append(f"{name}: last gallery picture did not darken background")
        page.screenshot(path=str(OUT/f"{name}-04-dark-gallery-end.png"),animations="allow")
        # Last extra downward wheel gestures now advance into the contact frame.
        wheel(page,7);wait(page,3.995)
        contact=page.locator("#frame-five-contact")
        if contact.get_attribute("aria-hidden")!="false" or not contact.is_visible():
            errors.append(f"{name}: final contact not visible")
        if page.locator("body").get_attribute("data-current-frame")!="5":
            errors.append(f"{name}: currentFrame should be 5")
        if page.locator(".frame-five-contact .contact-email").get_attribute("href") != "mailto:sohe@arkitekts.dk?subject=Let%27s%20work%20together":
            errors.append(f"{name}: contact email href missing")
        if page.locator("#copenhagen-globe").count()!=1:
            errors.append(f"{name}: 3D globe canvas missing")
        page.wait_for_function("document.body.dataset.globeReady==='true'",timeout=10000)
        page.wait_for_function("parseInt(document.body.dataset.globeFrames||0)>3",timeout=7000)
        if page.locator("#globe-shell").get_attribute("data-geography")!="natural-earth":
            errors.append(f"{name}: self-hosted geographic dataset not loaded")
        if page.locator("body").get_attribute("data-copenhagen-visible")!="true":
            errors.append(f"{name}: Copenhagen marker not visible on arrival")
        label=page.locator("#globe-location")
        if not label.is_visible():errors.append(f"{name}: Copenhagen label missing")
        rect=page.locator("#globe-shell").bounding_box()
        title=page.locator(".contact-heading").bounding_box()
        if not rect or rect["width"]<160 or rect["x"]<-5 or rect["x"]+rect["width"]>w+5:
            errors.append(f"{name}: globe clipped: {rect}")
        if not title or title["x"]<-5 or title["x"]+title["width"]>w+5:
            errors.append(f"{name}: contact headline clipped: {title}")
        # Layout regression: Back must not cover headline, recenter or footer.
        def overlaps(a,b):
            return (a and b and a["x"]<b["x"]+b["width"]
                    and a["x"]+a["width"]>b["x"]
                    and a["y"]<b["y"]+b["height"]
                    and a["y"]+a["height"]>b["y"])
        back=page.locator("#contact-back").bounding_box()
        reset_button=page.locator("#globe-recenter").bounding_box()
        footer_rect=page.locator(".site-footer").bounding_box()
        if overlaps(back,title) or overlaps(back,reset_button) or overlaps(back,footer_rect):
            errors.append(f"{name}: back control overlaps important content")
        if w<=760 and page.locator(".contact-signoff").is_visible():
            errors.append(f"{name}: mobile footer has duplicate crowded signoff")
        page.screenshot(path=str(OUT/f"{name}-05-copenhagen-globe.png"),animations="allow")

        # Globe must rotate slowly by itself and respond to direct manipulation.
        before=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
        page.wait_for_timeout(950)
        after=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
        if abs(after-before)<.003:errors.append(f"{name}: globe not auto-rotating ({before}->{after})")
        if rect:
            x=rect["x"]+rect["width"]*.48
            y=rect["y"]+rect["height"]*.51
            page.mouse.move(x,y)
            page.mouse.down()
            page.mouse.move(x+min(115,rect["width"]*.33),y+min(35,rect["height"]*.07),steps=9)
            page.mouse.up()
            moved=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
            if abs(moved-after)<.22:errors.append(f"{name}: dragging globe did not change orientation ({after}->{moved})")
            page.screenshot(path=str(OUT/f"{name}-06-globe-dragged.png"),animations="allow")
            page.locator("#globe-recenter").click()
            page.wait_for_timeout(80)
            reset=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
            if abs(reset+12.5683*3.141592653589793/180)>.04:
                errors.append(f"{name}: reset failed ({reset})")
        # Approved chrome and page geometry must not move.
        if abs(page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top")-head)>1:
            errors.append(f"{name}: header moved")
        if abs(page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")-foot)>1:
            errors.append(f"{name}: footer moved")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:errors.append(f"{name}: horizontal overflow {overflow}")
        if crashes:errors.append(f"{name}: JS runtime errors {crashes}")
        page.locator("#contact-back").click()
        page.wait_for_function("parseFloat(document.body.dataset.journeyProgress||4)<3.01",timeout=8000)
        if float(page.locator("body").get_attribute("data-gallery-index") or 0)<5.7:
            errors.append(f"{name}: returning to the gallery lost the last photo position")
        page.screenshot(path=str(OUT/f"{name}-07-return-gallery.png"),animations="allow")
        records.append({"screen":name,"size":[w,h],"globeDots":page.evaluate("window.soheilGlobe?.dotCount()"),
                        "firstYaw":before,"autoYaw":after,"overflow":overflow,"jsErrors":crashes})
        print(f"VERIFIED {name} {w}x{h}: five frames, self-hosted 3D globe, Copenhagen, slow rotation, drag, reset, back")
        ctx.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":records,"errors":errors},indent=2))
if errors:raise SystemExit("\n".join("FAIL "+e for e in errors))
print("PASS: final globe, contact, mobile, dark gallery, all previous frames.")
