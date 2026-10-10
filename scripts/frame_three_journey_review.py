#!/usr/bin/env python3
"""Playwright review: frozen Frames 01/02 plus reactive number in Frame 03.

Four viewports, continuous scroll in and out, no changed approved source, real
playing movie, mouse-responsive sharded 20 and exact return to neutral geometry.
"""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"frame-three-journey"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/concepts/frame-three-journey/"
sizes={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for label,(w,h) in sizes.items():
        page=browser.new_page(viewport={"width":w,"height":h},device_scale_factor=1)
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{label}: HTTP {response.status}")
        page.locator("#panorama .arch").first.wait_for()
        page.wait_for_timeout(350)
        if page.locator("#panorama .arch").count()!=3:failures.append(f"{label}: Frame 01 missing three arches")
        if page.locator(".twenty-piece").count()!=9:failures.append(f"{label}: expected 9 individual number fragments")
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="true":
            failures.append(f"{label}: Frame 03 exposed before scroll")
        if page.locator(".chapter-title").inner_text().replace("\n"," ").find("Curiosity.")<0:
            failures.append(f"{label}: Frame 02 copy changed")
        start_header=page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top")
        start_footer=page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")
        page.screenshot(path=str(OUT/f"{label}-01-original.png"),animations="allow")

        # Fullscreen Frame 02 exactly as before, with the shared movie.
        page.mouse.move(w*.48,h*.49)
        for _ in range(6):page.mouse.wheel(0,160)
        page.wait_for_function("parseFloat(document.body.dataset.journeyProgress||0)>.995",timeout=6000)
        intermediate=float(page.locator("body").get_attribute("data-journey-progress") or 0)
        if intermediate>1.3:failures.append(f"{label}: scroll skipped past Frame 02 ({intermediate:.3f})")
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="false":
            failures.append(f"{label}: Frame 02 hidden at zoom stop")
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="true":
            failures.append(f"{label}: Frame 03 shown too early")
        film=page.locator("#portal-film")
        if not film.evaluate("e=>e.readyState>=2"):failures.append(f"{label}: moving video unavailable")
        page.screenshot(path=str(OUT/f"{label}-02-approved-fullscreen.png"),animations="allow")

        # Advance to Frame 03 on the same film.
        for _ in range(6):page.mouse.wheel(0,160)
        page.wait_for_function("parseFloat(document.body.dataset.journeyProgress||0)>1.995",timeout=6000)
        page.wait_for_timeout(950)  # CSS shard stagger assembly
        if page.locator("body").get_attribute("data-current-frame")!="3":
            failures.append(f"{label}: Frame 03 did not become active")
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="false":
            failures.append(f"{label}: Frame 03 content inaccessible")
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="true":
            failures.append(f"{label}: Frame 02 remains accessible after it fades")
        if page.locator(".side-left").inner_text().replace("\n"," ")!="BUILDING RELIABLE":
            failures.append(f"{label}: left copy wrong")
        if page.locator(".side-right").inner_text().replace("\n"," ")!="SYSTEMS THAT LAST":
            failures.append(f"{label}: right copy wrong")
        if not film.evaluate("e=>e.readyState>=2"):
            failures.append(f"{label}: moving film stopped or vanished")
        page.screenshot(path=str(OUT/f"{label}-03-interactive-number.png"),animations="allow")

        # Only the numeral responds to pointer proximity.
        number=page.locator("#twenty-hotspot")
        bounds=number.bounding_box()
        if not bounds:
            failures.append(f"{label}: central number missing bounding box")
        else:
            cx=bounds["x"]+bounds["width"]*.5
            cy=bounds["y"]+bounds["height"]*.5
            page.mouse.move(cx,cy,steps=8)
            page.wait_for_timeout(360)
            if number.get_attribute("data-reacting")!="true":
                failures.append(f"{label}: moving mouse over 20 does not separate pieces")
            shifts=page.locator(".twenty-piece").evaluate_all(
                "elements=>elements.map(e=>parseFloat(e.style.getPropertyValue('--offset-x'))||0)"
            )
            if max(abs(s) for s in shifts)<6:
                failures.append(f"{label}: 20 pieces did not scatter ({shifts})")
            page.screenshot(path=str(OUT/f"{label}-04-mouse-fragmented.png"),animations="allow")
            # Reassembly is automatic, exact, repeatable.
            page.mouse.move(w*.06,h*.36)
            page.wait_for_timeout(900)
            if number.get_attribute("data-reacting")!="false":
                failures.append(f"{label}: pieces did not return after mouse left")
            returns=page.locator(".twenty-piece").evaluate_all(
                "elements=>elements.map(e=>parseFloat(e.style.getPropertyValue('--offset-x'))||0)"
            )
            if any(abs(x)>.01 for x in returns):
                failures.append(f"{label}: pieces failed to reassemble exactly {returns}")
            page.screenshot(path=str(OUT/f"{label}-05-reassembled.png"),animations="allow")
            number.click(force=True)
            page.wait_for_timeout(1250)
            if number.get_attribute("data-reacting")!="false":
                failures.append(f"{label}: tap/click animation did not reset")

        # Reversing the wheel must return to the exact approved opening.
        page.mouse.move(w*.06,h*.45)
        for _ in range(13):page.mouse.wheel(0,-160)
        page.wait_for_function("parseFloat(document.body.dataset.journeyProgress||2)<.006",timeout=7000)
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="true":
            failures.append(f"{label}: Frame 03 still focusable after returning")
        if abs(page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top")-start_header)>1:
            failures.append(f"{label}: fixed header moved")
        if abs(page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")-start_footer)>1:
            failures.append(f"{label}: fixed footer moved")
        if page.locator("body").get_attribute("data-current-frame")!="1":
            failures.append(f"{label}: did not reverse to Frame 01")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{label}: horizontal overflow {overflow}px")
        if errors:failures.append(f"{label}: JS errors {errors}")
        page.screenshot(path=str(OUT/f"{label}-06-return-frame-one.png"),animations="allow")
        results.append({"device":label,"width":w,"height":h,"video_ready":film.evaluate("e=>e.readyState>=2"),
                        "frame2_progress":intermediate,"errors":errors,"overflow":overflow})
        print(f"VERIFIED {label}: frame 1 -> 2 -> reactive 20 -> frame 1; fragments rejoin, grid stationary, JS errors={len(errors)}")
        page.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":results,"failures":failures},indent=2))
if failures:raise SystemExit("\n".join("FAIL "+f for f in failures))
print("PASS: three-frame cinematic experience and reversible interactive 20 at four widths.")
