#!/usr/bin/env python3
"""Smoke & responsive tests of immersive-studio standalone GitHub Pages concept.

This checks document structure, full-bleed hero, semantic content,
scroll chapter transitions, reduced-motion control, mobile menu, overflow,
and captures actual browser screenshots. WebGL is optional by design.
"""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screenshots" / "immersive-studio"
OUT.mkdir(parents=True, exist_ok=True)
server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{server.server_port}/concepts/immersive-studio/"
widths = {"small-mobile":(320,720),"mobile":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
results,failures=[],[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--enable-webgl","--use-gl=angle","--use-angle=swiftshader"])
    for device,(width,height) in widths.items():
        page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
        errors=[]
        page.on("pageerror",lambda error:errors.append(str(error) + " STACK: " + str(getattr(error,"stack",""))))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        page.locator(".story-panel.active").wait_for()
        if response.status != 200:
            failures.append(f"{device}: HTTP {response.status}")
        if page.locator("h1").count() != 1:
            failures.append(f"{device}: expected exactly one H1")
        if page.locator(".story-panel").count() != 4:
            failures.append(f"{device}: expected four story chapters")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{device}: horizontal overflow {overflow}px")
        if not page.locator("#world").count():
            failures.append(f"{device}: missing 3D canvas")
        if page.locator("#content .about-panel").count()!=3:
            failures.append(f"{device}: missing content cards")
        # Test stable HTML/CSS immediately, before optional 3D requests.
        page.screenshot(path=str(OUT/f"{device}-hero.png"),animations="disabled")
        if width<=740:
            toggle=page.locator("#menu-button")
            toggle.click()
            if toggle.get_attribute("aria-expanded")!="true":
                failures.append(f"{device}: mobile menu did not open")
            page.keyboard.press("Escape")
            if toggle.get_attribute("aria-expanded")!="false":
                failures.append(f"{device}: Escape did not close menu")
        # Reach the third chapter using actual scroll, without click hacks.
        progress=page.locator(".experience").evaluate("el => el.offsetHeight - innerHeight")
        page.evaluate("(v)=>scrollTo({top:v,behavior:'instant'})",progress*.70)
        page.wait_for_timeout(550)
        active=page.locator(".story-panel.active").get_attribute("data-story")
        if active!="2":failures.append(f"{device}: expected story 2 at 70% scroll, got {active}")
        # A screenshot here captures a real runtime 3D scene when available.
        page.screenshot(path=str(OUT/f"{device}-story.png"),animations="disabled")
        button=page.locator("#motion")
        button.click(force=True)
        if button.get_attribute("aria-pressed")!="true":failures.append(f"{device}: reduce motion toggle failed")
        button.click(force=True)
        # Verify that navigation reaches informative white sections.
        page.locator("#work").scroll_into_view_if_needed()
        overflow2=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow2>2:failures.append(f"{device}: white sections horizontal overflow {overflow2}px")
        if errors:failures.append(f"{device}: JavaScript exceptions {errors}")
        page.screenshot(path=str(OUT/f"{device}-content.png"),animations="disabled")
        gl=page.evaluate("document.documentElement.classList.contains('webgl-ready')")
        print(f"Reviewed {device} {width}x{height}; WebGL={'active' if gl else 'fallback'}; overflow={overflow}px")
        results.append({"device":device,"width":width,"height":height,"webgl":gl,"horizontal_overflow_px":max(0,overflow),"errors":errors})
        page.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"checks":results,"failures":failures},indent=2))
if failures:raise SystemExit("\n".join("FAIL "+f for f in failures))
print("PASS: four responsive sizes, scroll chapters, navigation, content and reduced-motion controls")
