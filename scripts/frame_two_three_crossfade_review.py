#!/usr/bin/env python3
"""Frame 02→03 slow, reversible, scroll-driven editorial handoff.

Four real browser viewport sizes. Verifies reading time, fading copy,
staggered new text and working interaction with the original assembled 10.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"frame-two-three-crossfade"
OUT.mkdir(parents=True,exist_ok=True)
SERVER=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=SERVER.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{SERVER.server_port}/concepts/frame-five-contact/"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
STEP=160/1030
issues=[]
report=[]

def state(page):
    return page.evaluate("""()=>{
      const outgoing=document.querySelector("#chapter-two");
      const incoming=document.querySelector("#chapter-three");
      const parts=[...incoming.querySelectorAll(".side-statement span")];
      const alpha=e=>Number(getComputedStyle(e).opacity);
      return {progress:Number(document.body.dataset.journeyProgress||0),
        outgoing:alpha(outgoing),incoming:alpha(incoming),
        kicker:alpha(incoming.querySelector(".chapter-three-kicker")),
        words:parts.map(alpha),
        oldY:getComputedStyle(outgoing).translate,
        oldBlur:getComputedStyle(outgoing).filter,
        secondAccessible:outgoing.getAttribute("aria-hidden"),
        thirdAccessible:incoming.getAttribute("aria-hidden"),
        thirdInert:incoming.inert,
        scene:Number(document.body.dataset.currentFrame||0),
        head:document.querySelector(".site-header").getBoundingClientRect().top,
        foot:document.querySelector(".site-footer").getBoundingClientRect().bottom,
        scrollY:scrollY};
    }""")

def wheel(page,number):
    for _ in range(number):page.mouse.wheel(0,160 if number>0 else -160)

def reverse(page,number):
    for _ in range(number):page.mouse.wheel(0,-160)

def wait(page,steps):
    page.wait_for_function(
        "(want)=>Math.abs(Number(document.body.dataset.journeyProgress||0)-want)<.012",
        arg=steps*STEP,timeout=9500
    )

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        failures=[]
        page.on("pageerror",lambda error:failures.append(str(error)))
        page.goto(URL,wait_until="domcontentloaded")
        page.mouse.move(w*.52,h*.47)
        wheel(page,7);wait(page,7)
        frame_two=state(page)
        if frame_two["outgoing"]<.99 or frame_two["incoming"]>.01:
            issues.append(f"{name}: Frame 02 should be readable at first stop: {frame_two}")
        if page.locator(".chapter-title").inner_text().replace("\n"," ")!="Curiosity. Code. Delivery.":
            issues.append(f"{name}: original Frame 02 text changed")
        page.screenshot(path=str(OUT/f"{name}-01-frame-two-readable.png"),animations="disabled")
        # Two extra scroll gestures should still give visitors time to read.
        wheel(page,2);wait(page,9)
        hold=state(page)
        if hold["outgoing"]<.97 or hold["incoming"]>.03:
            issues.append(f"{name}: Frame 02 content does not hold long enough: {hold}")
        wheel(page,1);wait(page,10)
        beginning=state(page)
        if not .40<beginning["outgoing"]<.91 or not .01<beginning["incoming"]<.5:
            issues.append(f"{name}: new Frame 03 text is not entering gently: {beginning}")
        if beginning["outgoing"]<=beginning["incoming"]:
            issues.append(f"{name}: outgoing title should still dominate early transition: {beginning}")
        page.screenshot(path=str(OUT/f"{name}-02-two-to-three-overlap.png"),animations="disabled")
        wheel(page,1);wait(page,11)
        middle=state(page)
        if not 0<middle["outgoing"]<beginning["outgoing"]:
            issues.append(f"{name}: outgoing Frame 02 is not fading: {middle}")
        if not beginning["incoming"]<middle["incoming"]<1:
            issues.append(f"{name}: Frame 03 does not fade in progressively: {middle}")
        if not middle["words"][0]>middle["words"][-1]:
            issues.append(f"{name}: Frame 03 words lack staggered entrance: {middle}")
        if middle["secondAccessible"]!="false" or middle["thirdAccessible"]!="false":
            issues.append(f"{name}: overlapping chapters do not remain accessible: {middle}")
        page.screenshot(path=str(OUT/f"{name}-03-matched-text-transition.png"),animations="disabled")
        wheel(page,2);wait(page,13)
        final=state(page)
        if final["outgoing"]>.01 or final["incoming"]<.99:
            issues.append(f"{name}: Frame 03 should be fully visible at second stop: {final}")
        if final["thirdAccessible"]!="false" or final["thirdInert"]:
            issues.append(f"{name}: Frame 03 interaction is not accessible")
        if page.locator("#twenty-svg").get_attribute("viewBox")!="0 0 600 390":
            issues.append(f"{name}: interactive 10 artwork has changed")
        if page.locator(".twenty-piece").count()!=9:
            issues.append(f"{name}: the interactive 10 lost pieces")
        hotspot=page.locator("#twenty-hotspot")
        first=page.locator(".twenty-piece").first
        page.mouse.move(0,0)
        page.wait_for_timeout(50)
        scattered=first.evaluate("e=>parseFloat(e.style.getPropertyValue('--offset-x'))")
        hotspot.hover(force=True)
        assembled=first.evaluate("e=>parseFloat(e.style.getPropertyValue('--offset-x'))")
        page.mouse.move(0,0)
        again=first.evaluate("e=>parseFloat(e.style.getPropertyValue('--offset-x'))")
        if abs(scattered)<1 or abs(assembled)>.1 or abs(again)<1:
            issues.append(f"{name}: interactive 10 hover no longer responds: {scattered},{assembled},{again}")
        page.screenshot(path=str(OUT/f"{name}-04-third-frame-and-10.png"),animations="disabled")
        # The whole scroll journey must also work backwards.
        reverse(page,3);wait(page,10)
        back=state(page)
        if not back["outgoing"]>final["outgoing"]+.4 or not back["incoming"]<final["incoming"]-.4:
            issues.append(f"{name}: reverse transition does not restore Frame 02: {back}")
        reverse(page,3);wait(page,7)
        restored=state(page)
        if restored["outgoing"]<.99 or restored["incoming"]>.02:
            issues.append(f"{name}: Frame 02 fails to return fully: {restored}")
        if restored["thirdAccessible"]!="true" or restored["secondAccessible"]!="false":
            issues.append(f"{name}: Frame 02 accessibility not restored")
        if abs(restored["head"])>1 or abs(restored["foot"]-h)>1 or abs(restored["scrollY"])>1:
            issues.append(f"{name}: fixed header/footer moved during fade")
        if page.evaluate("document.documentElement.scrollWidth-innerWidth")>2:
            issues.append(f"{name}: horizontal overflow")
        if failures:issues.append(f"{name}: JavaScript error: {failures}")
        report.append({"device":name,"hold":hold,"start":beginning,"middle":middle,"final":final,"reverse":back})
        print(f"CHECKED {name}: slower 01–02 & 02–03, readable titles, reversible motion, interactive 10")
        ctx.close()
    browser.close()
SERVER.shutdown()
(OUT/"report.json").write_text(json.dumps({"checks":report,"issues":issues},indent=2))
if issues:raise SystemExit("\n".join("FAIL "+error for error in issues))
print("PASS: Frame 02→03 slow, accessible, and fully reversible across all devices.")
