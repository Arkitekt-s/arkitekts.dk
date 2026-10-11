#!/usr/bin/env python3
"""Chromium mobile/tablet layout and navigation checks on every public sitemap URL.

Screenshots and findings are uploaded by the GitHub Actions workflow.
External video/image services are best-effort, not part of core layout test.
"""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import json
import re
import sys
import xml.etree.ElementTree as ET

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "screenshots" / "responsive-site-audit"
OUT.mkdir(parents=True, exist_ok=True)
SIZES = {
    "small-phone": (320, 720),
    "phone": (390, 844),
    "large-phone": (430, 932),
    "tablet": (768, 1024),
    "large-tablet": (1024, 1366),
}
XML_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
urls = [
    (url.text or "") for url in
    ET.parse(ROOT / "sitemap.xml").findall(f".//{XML_NS}loc")
]
assert len(urls) == 23, f"Expected 23 public pages; got {len(urls)}"
server = ThreadingHTTPServer(
    ("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT))
)
Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_port}"

MEASURE = r"""() => {
  const vw = innerWidth;
  const root = document.documentElement;
  const body = document.body;
  const horizontal = Math.max(root.scrollWidth, body.scrollWidth) - vw;
  const visible = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' &&
      Number(cs.opacity) > .01 && r.width > 8 && r.height > 8;
  };
  const large = [...document.querySelectorAll('body *')]
    .filter(el => {
      if (!visible(el)) return false;
      const r=el.getBoundingClientRect();
      return r.right>vw+5 || r.left < -5;
    })
    .filter(el=>{
      const cs=getComputedStyle(el);
      // Record this even for decorative/animated objects, so the test report
      // can distinguish genuine document overflow from cinematic compositions.
      return true;
    })
    .sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right)
    .slice(0,12)
    .map(el=>{
      const r=el.getBoundingClientRect();
      return {tag:el.tagName.toLowerCase(),className:String(el.className?.baseVal??el.className??'').slice(0,110),
        text:(el.innerText||'').trim().slice(0,65),left:Math.round(r.left),right:Math.round(r.right),
        width:Math.round(r.width),position:getComputedStyle(el).position,
        overflowX:getComputedStyle(el).overflowX};
    });
  const clippedText=[...document.querySelectorAll('h1,h2,h3,p,button,a')]
    .filter(el=>visible(el) && el.clientWidth>=32 && el.scrollWidth>el.clientWidth+10
      && ['hidden','clip'].includes(getComputedStyle(el).overflowX))
    .slice(0,8)
    .map(el=>({tag:el.tagName.toLowerCase(),text:(el.innerText||'').trim().slice(0,65),
      width:el.clientWidth,scrollWidth:el.scrollWidth}));
  const title = document.querySelector('h1');
  const titleRect = title?.getBoundingClientRect();
  const headingVisible = !title || !visible(title) ||
    (titleRect.right > 0 && titleRect.left < vw && titleRect.width > 8);
  const header = document.querySelector('.site-header');
  return {vw,scrollWidth:Math.max(root.scrollWidth,body.scrollWidth),horizontal,
    pageHeight:Math.round(root.scrollHeight),headingVisible,
    clippedText,offscreenElements:large,
    headerVisible:!!(header && visible(header)),
    menuButtonVisible:!!(document.querySelector('#menu-button') && visible(document.querySelector('#menu-button'))),
    mainCount:document.querySelectorAll('main').length,
    h1Count:document.querySelectorAll('h1').length,
    images:document.images.length,
    videos:document.querySelectorAll('video').length,
    viewportMeta:!!document.querySelector('meta[name=viewport]')};
}"""

failures = []
records = []
with sync_playwright() as play:
    browser = play.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
    for name, (width, height) in SIZES.items():
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=1, is_mobile=(width <= 430),
            has_touch=(width <= 1024), reduced_motion="reduce",
        )
        page = context.new_page()
        page.set_default_timeout(3500)
        for url in urls:
            path = urlsplit(url).path
            slug = path.strip("/").replace("/", "__") or "home"
            errors = []
            local404 = []
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.on("response", lambda res: local404.append(res.url) if
                res.status >= 400 and res.url.startswith(BASE) else None)
            try:
                response = page.goto(BASE + path, wait_until="domcontentloaded", timeout=20000)
                page.wait_for_timeout(400)
                status = response.status if response else 0
                geom = page.evaluate(MEASURE)
                item = {"device":name,"width":width,"path":path,
                        "status":status,**geom}
                bad = []
                if status != 200:
                    bad.append(f"HTTP {status}")
                if geom["horizontal"]>4:
                    bad.append(f"horizontal overflow {geom['horizontal']}px")
                if not geom["viewportMeta"]:
                    bad.append("missing responsive viewport meta")
                if not geom["headingVisible"]:
                    bad.append("main H1 outside viewport")
                if geom["h1Count"]!=1:
                    bad.append(f"expected 1 H1, found {geom['h1Count']}")
                if geom["mainCount"]!=1:
                    bad.append(f"expected 1 main, found {geom['mainCount']}")
                if geom["clippedText"]:
                    bad.append("clipped text: "+str(geom["clippedText"][:3]))
                if local404:
                    bad.append("broken local resources "+str(local404[:3]))
                menu=page.locator('#menu-button')
                if width<=768 and menu.count() and menu.is_visible():
                    menu.click(force=True,timeout=2500)
                    page.wait_for_timeout(180)
                    if menu.get_attribute("aria-expanded")!="true":
                        bad.append("mobile menu button does not open")
                    elif not page.locator("nav.navigation a").first.is_visible():
                        bad.append("mobile menu links hidden after opening")
                    page.keyboard.press("Escape")
                if errors:
                    # Image/video CDNs can cause network console warnings.
                    # Actual runtime exceptions get recorded for follow-up.
                    item["jsErrors"]=errors[:4]
                    bad.append("JavaScript exceptions: "+str(errors[:2]))
                item["failures"]=bad
                records.append(item)
                if bad:
                    failures.append(f"{name} {path}: "+ " | ".join(bad))
                print("AUDIT "+json.dumps({
                    "device":name,"path":path,
                    "overflow":geom["horizontal"],
                    "h1":geom["h1Count"],"menu":geom["menuButtonVisible"],
                    "bad":bad,"offenders":geom["offscreenElements"][:5] if bad else [],
                },ensure_ascii=False),flush=True)
                if name in ("small-phone","phone","tablet","large-tablet"):
                    target=OUT / f"{slug}--{name}.png"
                    page.screenshot(path=str(target), full_page=False, animations="disabled",timeout=10000)
            except Exception as exc:
                failures.append(f"{name} {path}: browser error: {exc}")
                records.append({"device":name,"path":path,"error":str(exc)})
                print(f"ERROR {name} {path}: {exc}",flush=True)
        context.close()
    browser.close()
server.shutdown()
(OUT / "results.json").write_text(json.dumps({
    "screensTested":len(records),"pages":len(urls),"viewportSizes":SIZES,
    "failures":failures,"results":records},ensure_ascii=False,indent=2))
print(f"SUMMARY {len(records)} responsive page tests, {len(failures)} failures")
for failure in failures: print("FAIL "+failure)
sys.exit(1 if failures else 0)
