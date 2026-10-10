#!/usr/bin/env python3
"""Browser tests for the unified light 3D portfolio concept.

Tests the homepage, project, and article template at desktop/tablet/phone sizes.
Uses a local HTTP server so module imports and relative routing behave like Pages.
"""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screenshots" / "light-journey"
OUT.mkdir(parents=True, exist_ok=True)
PAGES = {
    "homepage": "concepts/light-journey/",
    "case-study": "concepts/light-journey/case-study/",
    "guide": "concepts/light-journey/guide/",
}
DEVICES = {
    "phone-small": (320, 720),
    "phone": (390, 844),
    "tablet": (768, 1024),
    "desktop": (1440, 900),
}
Handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
Thread(target=server.serve_forever, daemon=True).start()
base = "http://127.0.0.1:" + str(server.server_port) + "/"

failures = []
results = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, args=["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"])
    for kind, relative_url in PAGES.items():
        for device, (width, height) in DEVICES.items():
            page = browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
            exceptions = []
            page.on("pageerror",lambda e: exceptions.append(str(e)))
            response = page.goto(base + relative_url, wait_until="domcontentloaded", timeout=30000)
            page.locator("main").wait_for(timeout=10000)
            if response.status != 200:
                failures.append(f"{kind}/{device}: status {response.status}")
            if page.locator("h1").count() != 1:
                failures.append(f"{kind}/{device}: must contain exactly one H1")
            if not page.locator(".header").count():
                failures.append(f"{kind}/{device}: missing shared template header")
            if not page.locator(".footer").count():
                failures.append(f"{kind}/{device}: missing shared template footer")
            overflow = page.evaluate("document.documentElement.scrollWidth - innerWidth")
            if overflow > 2:
                failures.append(f"{kind}/{device}: horizontal overflow {overflow}px")
            if width <= 780:
                toggle = page.locator(".menu-button")
                if not toggle.is_visible():
                    failures.append(f"{kind}/{device}: mobile menu missing")
                else:
                    toggle.click()
                    if toggle.get_attribute("aria-expanded") != "true":
                        failures.append(f"{kind}/{device}: mobile menu failed to open")
                    page.keyboard.press("Escape")
                    if toggle.get_attribute("aria-expanded") != "false":
                        failures.append(f"{kind}/{device}: Escape did not close menu")
            else:
                if page.locator(".menu-button").is_visible():
                    failures.append(f"{kind}/{device}: mobile menu visible on desktop")
            if kind == "homepage":
                if page.locator(".chapter[data-stage]").count() != 4:
                    failures.append(f"{kind}/{device}: expected four chapters")
                if device in ("phone", "desktop"):
                    page.locator("#stage-3").evaluate("(el) => el.scrollIntoView({block: 'center', behavior: 'instant'})")
                    page.wait_for_timeout(700)
                    current = page.locator("[data-stage-index]").inner_text()
                    # WebGL loads only as the scene approaches the viewport.
                    # The CSS fallback is valid on devices without working WebGL.
                    try:
                        page.locator(".scene-view.webgl-active").wait_for(state="attached",timeout=12000)
                        webgl = "active"
                    except Exception:
                        webgl = "fallback"
                    print(f"3D scene on {device}: {webgl}")
                    page.screenshot(path=str(OUT / f"journey-stage3-{device}.png"), animations="disabled")
                    if current != "03 / 04":
                        failures.append(f"{kind}/{device}: scroll scene expected 03 / 04, got {current!r}")
                    btn = page.locator("[data-motion-toggle]")
                    btn.click()
                    if btn.get_attribute("aria-pressed") != "true":
                        failures.append(f"{kind}/{device}: reduce-motion toggle failed")
                    btn.click()
            if kind == "guide":
                if page.locator("[data-copy-target]").count() != 1:
                    failures.append(f"{kind}/{device}: missing copy code control")
            if exceptions:
                failures.append(f"{kind}/{device}: JS exception {exceptions}")
            if device in ("phone", "desktop"):
                if kind == "homepage":
                    page.goto(base + relative_url,wait_until="domcontentloaded")
                page.screenshot(path=str(OUT / f"{kind}-{device}.png"),full_page=True,animations="disabled")
            results.append({"page":kind,"device":device,"width":width,"height":height,"overflow_px":overflow,"js_exceptions":len(exceptions)})
            print(f"Checked: {kind} at {width}x{height}, overflow={overflow}px")
            page.close()
    browser.close()
server.shutdown()
(OUT / "results.json").write_text(json.dumps({"checks":results,"failures":failures},indent=2))
if failures:
    raise SystemExit("\n".join("FAIL " + reason for reason in failures))
print("PASS: all 12 responsive/browser checks, navigation and scroll interactions.")
