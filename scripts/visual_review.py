#!/usr/bin/env python3
"""Responsive visual review for GitHub Pages concepts.

Runs against local static files. Tests key layouts and menu behavior.
Screenshots are published as a GitHub Actions artifact, not committed to source.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screenshots"
OUT.mkdir(exist_ok=True)
PAGES = {
    "comparison": ROOT / "concepts" / "index.html",
    "atlas": ROOT / "concepts" / "atlas" / "index.html",
    "nordic": ROOT / "concepts" / "nordic" / "index.html",
    "signal": ROOT / "concepts" / "signal" / "index.html",
}
DEVICES = {
    "small-mobile": (320, 720),
    "mobile": (390, 844),
    "tablet": (768, 1024),
    "desktop": (1440, 900),
}

errors = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for name, html in PAGES.items():
        for device, (width, height) in DEVICES.items():
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            console_errors = []
            page.on("pageerror", lambda e: console_errors.append(str(e)))
            page.goto(html.as_uri(), wait_until="load")
            page.locator("main").wait_for()
            actual_width = page.evaluate("document.documentElement.scrollWidth")
            if actual_width > width + 2:
                errors.append(f"{name}/{device}: horizontal scroll ({actual_width}px > {width}px)")
            if not page.locator("h1").count():
                errors.append(f"{name}/{device}: missing H1")
            style_ok = page.evaluate(
                "getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'"
            )
            if not style_ok:
                errors.append(f"{name}/{device}: stylesheet did not apply")
            if name != "comparison" and width <= 700:
                toggle = page.locator(".menu-toggle")
                toggle.click()
                if toggle.get_attribute("aria-expanded") != "true":
                    errors.append(f"{name}/{device}: mobile menu did not open")
                page.keyboard.press("Escape")
                if toggle.get_attribute("aria-expanded") != "false":
                    errors.append(f"{name}/{device}: Escape did not close mobile menu")
            if console_errors:
                errors.append(f"{name}/{device}: JS exceptions: {console_errors}")
            page.screenshot(path=str(OUT / f"{name}-{device}.png"), full_page=True, animations="disabled")
            print(f"CHECKED {name} at {width}×{height}")
            page.close()
    browser.close()

if errors:
    raise SystemExit("\n".join("FAIL " + e for e in errors))
print(f"PASS: {len(PAGES)*len(DEVICES)} responsive layout runs; screenshots at {OUT}")
