#!/usr/bin/env python3
"""Verify a reversible, scroll-driven Frame 01 → Frame 02 text transition.

Checks the original intro, visible overlap, timed scroll stops, complete Frame
02 story and scroll back. Doesn't alter the locked original frame assets.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"frame-one-to-two-crossfade"
OUT.mkdir(parents=True,exist_ok=True)
SERVER=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=SERVER.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{SERVER.server_port}/concepts/frame-five-contact/"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
issues=[]
snapshots=[]

def read(page):
    return page.evaluate("""() => {
      const title=document.querySelector('.hero-text');
      const chapter=document.querySelector('#chapter-two');
      const spans=[...document.querySelectorAll('#chapter-two .chapter-title > span')];
      const alpha=el=>Number(getComputedStyle(el).opacity);
      return {
        progress:Number(document.body.dataset.journeyProgress||0),
        first:alpha(title),incoming:alpha(chapter),
        firstLine:alpha(spans[0]),secondLine:alpha(spans[1]),
        thirdLine:alpha(spans[2]),
        description:alpha(chapter.querySelector('.chapter-description')),
        link:alpha(chapter.querySelector('.chapter-link')),
        firstOffset:getComputedStyle(title).translate,
        visibility:getComputedStyle(chapter).visibility,
        accessible:chapter.getAttribute('aria-hidden'),
        header:document.querySelector('.site-header').getBoundingClientRect().top,
        footer:document.querySelector('.site-footer').getBoundingClientRect().bottom,
        scrollY:scrollY
      };
    }""")

def step(page,n):
    for _ in range(n):
        page.mouse.wheel(0,160)
    expected=n*.2025316456
    return expected

def wait_for(page,expected):
    page.wait_for_function(
       "(n) => Math.abs(Number(document.body.dataset.journeyProgress||0)-n) < .008",
       expected,timeout=9500
    )

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        js_errors=[]
        page.on("pageerror",lambda err:js_errors.append(str(err)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:
            issues.append(f"{name}: unavailable Frame 01: {response.status}")
        page.wait_for_function("document.body.hasAttribute('data-journey-progress')",timeout=5000)
        initial=read(page)
        if initial["first"]<.98 or initial["incoming"]>.015:
            issues.append(f"{name}: approved initial headline is not clean: {initial}")
        if initial["accessible"]!="true":
            issues.append(f"{name}: future chapter should be hidden at start")
        if page.locator("#panorama .arch").count()!=3:
            issues.append(f"{name}: original mountain arches missing")
        if page.locator("#frame-five-contact").get_attribute("aria-hidden")!="true":
            issues.append(f"{name}: Frame 05 altered")
        page.screenshot(path=str(OUT/f"{name}-01-original.png"),animations="disabled")
        page.mouse.move(w*.53,h*.48)
        step(page,2);wait_for(page,2*.2025316456)
        early=read(page)
        if not .46<early["first"]<.92:
            issues.append(f"{name}: headline should be fading, not cutting out: {early}")
        if early["incoming"]>.04:
            issues.append(f"{name}: next text arrives before first scene opens: {early}")
        step(page,1);wait_for(page,3*.2025316456)
        middle=read(page)
        if not 0<middle["first"]<early["first"]:
            issues.append(f"{name}: original headline does not keep fading: {middle}")
        if not 0<middle["incoming"]<.6:
            issues.append(f"{name}: second headline does not enter during first's exit: {middle}")
        if not 0<middle["firstLine"]<.8:
            issues.append(f"{name}: first word is not progressively revealed: {middle}")
        if middle["accessible"]!="false":
            issues.append(f"{name}: incoming text inaccessible while fading: {middle}")
        page.screenshot(path=str(OUT/f"{name}-02-overlap.png"),animations="disabled")
        step(page,1);wait_for(page,4*.2025316456)
        late=read(page)
        if late["first"]>=middle["first"] or late["incoming"]<=middle["incoming"]:
            issues.append(f"{name}: crossfade is not moving in opposite directions: {late}")
        if not late["firstLine"]>late["thirdLine"]:
            issues.append(f"{name}: lines do not appear with scroll-based staggering: {late}")
        page.screenshot(path=str(OUT/f"{name}-03-blend.png"),animations="disabled")
        step(page,1);wait_for(page,5*.2025316456)
        full=read(page)
        if full["first"]>.01 or full["incoming"]<.99:
            issues.append(f"{name}: Frame 02 still shows first headline: {full}")
        if any(full[field]<.99 for field in ("firstLine","secondLine","thirdLine","description","link")):
            issues.append(f"{name}: Frame 02 text or link incomplete: {full}")
        if full["accessible"]!="false":
            issues.append(f"{name}: full Frame 02 should be accessible")
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="true":
            issues.append(f"{name}: entering Frame 02 skipped Frame 03")
        page.screenshot(path=str(OUT/f"{name}-04-full-frame-two.png"),animations="disabled")

        # Reverse exactly: the new text fades out; original words return.
        page.mouse.wheel(0,-160)
        wait_for(page,4*.2025316456)
        back=read(page)
        if not back["first"]>full["first"]+.04 or not back["incoming"]<full["incoming"]-.04:
            issues.append(f"{name}: reverse crossfade is not symmetric: {back}")
        for _ in range(4):
            page.mouse.wheel(0,-160)
        wait_for(page,0)
        restored=read(page)
        if restored["first"]<.99 or restored["incoming"]>.02:
            issues.append(f"{name}: initial text did not return: {restored}")
        if restored["accessible"]!="true":
            issues.append(f"{name}: future text still accessible at Frame 01")
        if abs(restored["header"])>1 or abs(restored["footer"]-h)>1 or abs(restored["scrollY"])>1:
            issues.append(f"{name}: transition moved fixed site chrome: {restored}")
        if page.evaluate("document.documentElement.scrollWidth-innerWidth")>2:
            issues.append(f"{name}: horizontal overflow")
        if js_errors:
            issues.append(f"{name}: JavaScript error: {js_errors}")
        snapshots.append({"device":name,"initial":initial,"early":early,"middle":middle,"late":late,"full":full,"reverse":back,"restored":restored})
        print(f"CHECKED {name}: gradual exit, overlapping new words, reverse and fixed header/footer")
        ctx.close()

    # Reduced motion still allows keyboard-based scene traversal.
    ctx=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
    page=ctx.new_page()
    page.goto(URL,wait_until="domcontentloaded")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("ArrowDown")
    page.keyboard.press("ArrowDown")
    page.wait_for_function("Number(document.body.dataset.journeyProgress)>0.98",timeout=5000)
    state=read(page)
    if state["first"]>.02 or state["incoming"]<.99:
        issues.append("Reduced-motion users cannot read the second chapter")
    if page.locator(".hero-text").evaluate("el=>getComputedStyle(el).filter")!="none":
        issues.append("Reduced-motion users still get text blur")
    ctx.close()
    browser.close()

SERVER.shutdown()
(OUT/"report.json").write_text(json.dumps({"snapshots":snapshots,"issues":issues},indent=2))
if issues:
    raise SystemExit("\n".join("FAIL "+issue for issue in issues))
print("PASS: Frame 01–02 text handoff is smooth, scroll-controlled and fully reversible.")
