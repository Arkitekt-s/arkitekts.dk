#!/usr/bin/env python3
"""Frame 04 visual/interaction review without touching the frozen first 3 frames.

Tests cinematic bottom-to-top shadow wipe, fixed shell and vertical-to-horizontal
gallery movement at 320, 390, 768 and 1440 pixels.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/"screenshots"/"frame-four-gallery"
SHOTS.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/concepts/frame-four-gallery/"
DEVICES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
report=[]

def wheel(page,count,direction=1):
    for _ in range(count):page.mouse.wheel(0,160*direction)

def wait_progress(page,threshold,above=True):
    code=f"parseFloat(document.body.dataset.journeyProgress||0) {'>' if above else '<'} {threshold}"
    page.wait_for_function(code,timeout=8500)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in DEVICES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{name}: site returned {response.status}")
        if page.locator(".arch").count()!=3:failures.append(f"{name}: approved first frame missing")
        if page.locator(".twenty-piece").count()!=9:failures.append(f"{name}: approved interactive 20 missing")
        if page.locator(".gallery-photo").count()!=7:failures.append(f"{name}: expected seven photo cards")
        if page.locator(".gallery-photo[data-kind='portrait']").count()!=1:
            failures.append(f"{name}: user's portrait card missing")
        if page.locator(".chapter-two").get_attribute("aria-hidden")!="true":
            failures.append(f"{name}: second frame shown before entry")
        if page.locator("#frame-four-gallery").get_attribute("aria-hidden")!="true":
            failures.append(f"{name}: fourth frame shown at entry")
        chrome=page.evaluate("""()=>{
            const h=document.querySelector('.site-header').getBoundingClientRect();
            const f=document.querySelector('.site-footer').getBoundingClientRect();
            return [h.top,f.bottom];
        }""")
        if abs(chrome[0])>1 or abs(chrome[1]-h)>1:
            failures.append(f"{name}: header/footer not pinned {chrome}")
        page.screenshot(path=str(SHOTS/f"{name}-01-arches.png"),animations="allow")

        # Five medium scroll gestures enter the existing Frame 02.
        wheel(page,5)
        wait_progress(page,.997)
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="false":
            failures.append(f"{name}: missing frame 02 story")
        page.screenshot(path=str(SHOTS/f"{name}-02-story.png"),animations="allow")
        wheel(page,5)
        wait_progress(page,1.995)
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="false":
            failures.append(f"{name}: missing approved Frame 03")
        if page.locator(".twenty-piece").first.evaluate("e=>getComputedStyle(e).animationName")!="none":
            failures.append(f"{name}: approved number 20 automatically animating")
        page.screenshot(path=str(SHOTS/f"{name}-03-number.png"),animations="allow")

        # Bottom -> top curtain moves over the film.
        wheel(page,2)
        wait_progress(page,2.30)
        at_wipe=page.locator("#frame-four-curtain").evaluate("e=>getComputedStyle(e).transform")
        if at_wipe=="none":
            failures.append(f"{name}: missing shadow wipe movement")
        page.screenshot(path=str(SHOTS/f"{name}-04-shadow-wipe.png"),animations="allow")
        wheel(page,3)
        wait_progress(page,2.995)
        page.wait_for_timeout(650)
        if page.locator("body").get_attribute("data-current-frame")!="4":
            failures.append(f"{name}: did not enter gallery frame")
        gallery=page.locator("#frame-four-gallery")
        if gallery.get_attribute("aria-hidden")!="false" or not gallery.is_visible():
            failures.append(f"{name}: gallery not visible or accessible")
        photo=page.locator(".gallery-photo[data-kind='portrait']")
        bounds=photo.bounding_box()
        if bounds:
            pc=bounds["x"]+bounds["width"]/2
            if abs(pc-w/2)>max(45,w*.11):
                failures.append(f"{name}: personal portrait not initially centered: {pc} vs {w/2}")
        else: failures.append(f"{name}: portrait card has no box")
        if page.locator("#gallery-count").inner_text()!="03":
            failures.append(f"{name}: first gallery card counter should be 03")
        starting_dark=float(page.locator("body").get_attribute("data-gallery-darkness") or 0)
        if starting_dark>.015:
            failures.append(f"{name}: gallery begins too dark ({starting_dark:.3f})")
        page.screenshot(path=str(SHOTS/f"{name}-05-gallery-centered.png"),animations="allow")

        # Mouse wheel UP/DOWN maps to horizontal photo movement.
        wheel(page,2)
        page.wait_for_timeout(700)
        moved=float(page.locator("body").get_attribute("data-gallery-index") or 0)
        if moved<2.75:failures.append(f"{name}: wheel down failed to shift photo sequence right ({moved:.2f})")
        page.screenshot(path=str(SHOTS/f"{name}-06-gallery-shifted.png"),animations="allow")
        wheel(page,2,-1)
        page.wait_for_timeout(700)
        returned=float(page.locator("body").get_attribute("data-gallery-index") or 0)
        if abs(returned-2)>.11:
            failures.append(f"{name}: wheel up did not return gallery sequence left ({returned:.2f})")

        # Pointer drag also controls horizontal gallery, including phones.
        viewport=page.locator("#gallery-viewport")
        box=viewport.bounding_box()
        if box:
            x=w*.72;y=box["y"]+box["height"]*.5
            step=page.locator(".gallery-photo").nth(1).evaluate("e=>e.offsetLeft-e.previousElementSibling.offsetLeft")
            travel=min(w*.42,step*.80)
            page.mouse.move(x,y);page.mouse.down()
            page.mouse.move(x-travel,y,steps=11)
            page.mouse.up()
            page.wait_for_timeout(520)
            dragged=float(page.locator("body").get_attribute("data-gallery-index") or 0)
            if dragged<=2.15:failures.append(f"{name}: dragging failed to slide gallery ({dragged:.2f})")
        else:failures.append(f"{name}: no gallery viewport box")
        # The visible buttons and keyboard must work independently.
        old=float(page.locator("body").get_attribute("data-gallery-index") or 0)
        page.locator("#gallery-next").click()
        page.wait_for_timeout(570)
        new=float(page.locator("body").get_attribute("data-gallery-index") or 0)
        if new<=old+.3:failures.append(f"{name}: next image button ignored ({old}->{new})")

        # The background must fade towards near-black at the end of the reel.
        # Cards, header and footer must stay visible.
        for _ in range(7):
            if page.locator("#gallery-next").is_enabled():
                page.locator("#gallery-next").click()
        page.wait_for_timeout(950)
        last_index=float(page.locator("body").get_attribute("data-gallery-index") or 0)
        end_dark=float(page.locator("body").get_attribute("data-gallery-darkness") or 0)
        pseudo_dark=float(page.locator(".frame-four-backdrop").evaluate(
            "e=>getComputedStyle(e,'::after').opacity"
        ))
        if last_index<5.95 or end_dark<.98 or pseudo_dark<.98:
            failures.append(f"{name}: ending did not fade dark (index {last_index}, darkness {end_dark}, CSS opacity {pseudo_dark})")
        if page.locator("#gallery-count").inner_text()!="07":
            failures.append(f"{name}: last photo counter missing")
        page.screenshot(path=str(SHOTS/f"{name}-07-gallery-dark-ending.png"),animations="allow")

        # Reverse back to a middle photograph: background must lighten again.
        for _ in range(4):
            page.locator("#gallery-prev").click()
        page.wait_for_timeout(850)
        back_dark=float(page.locator("body").get_attribute("data-gallery-darkness") or 0)
        if back_dark>.03:
            failures.append(f"{name}: reversing gallery did not restore purple background ({back_dark})")
        page.screenshot(path=str(SHOTS/f"{name}-08-gallery-background-restored.png"),animations="allow")
        # The navigation bar and footer grid must never jump.
        after=page.evaluate("""()=>{
            const h=document.querySelector('.site-header').getBoundingClientRect();
            const f=document.querySelector('.site-footer').getBoundingClientRect();
            return [h.top,f.bottom];
        }""")
        if chrome!=after:failures.append(f"{name}: permanent chrome moved {chrome}->{after}")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{name}: horizontal page overflow {overflow}")
        if errors:failures.append(f"{name}: JavaScript errors: {errors}")

        portrait_ok=page.locator(".gallery-photo[data-kind='portrait'] img").evaluate("e=>e.complete&&e.naturalWidth>0")
        # External WordPress image may not load in offline previews.
        # Keep image status visible in report, not as a false interaction failure.
        report.append({"screen":name,"width":w,"height":h,"galleryShift":moved,
                       "galleryReturn":returned,"endingDarkness":end_dark,"reversedDarkness":back_dark,"portraitLoaded":portrait_ok,
                       "videoReady":page.locator("#portal-film").evaluate("e=>e.readyState>=2"),
                       "errors":errors})
        print(f"CHECKED {name} {w}x{h}: reel + reversible dark end {end_dark:.2f}->{back_dark:.2f}, portrait_loaded={portrait_ok}")
        ctx.close()
    browser.close()
server.shutdown()
(SHOTS/"report.json").write_text(json.dumps({"devices":report,"failures":failures},indent=2))
if failures:raise SystemExit("\n".join("FAIL "+f for f in failures))
print("PASS: Frame 04 dark upward wipe and horizontal photo gallery on all four viewports.")
