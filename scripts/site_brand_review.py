#!/usr/bin/env python3
"""Check one reference S. mark and canonical 01..05 sequence throughout the site.

The order is Profile, Portfolio, Skills, Guides, Let's talk. Project 01–06
and tutorial guide 01–11 counters are intentionally separate.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SCREENS=ROOT/"screenshots"/"brand-and-sequence"
SCREENS.mkdir(parents=True,exist_ok=True)
SERVER=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=SERVER.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{SERVER.server_port}"

PAGES=[
 ("/concepts/frame-five-contact/",None,None,True),
 ("/profile/",".profile-kicker","01 / PROFILE",False),
 ("/portfolio/",".portfolio-kicker","02 / PORTFOLIO",False),
 ("/software-skills/",".skills-kicker","03 / SKILLS",False),
 ("/technical-guides/",".guides-kicker","04 / TECHNICAL GUIDES",False),
 ("/contact/",".eyebrow","05 / CONTACT",False),
]
ROUTES=["/profile/","/portfolio/","/software-skills/","/technical-guides/","/contact/"]
LABELS=["PROFILE","PORTFOLIO","SKILLS","GUIDES","Let's talk"]
VIEWPORTS={"phone-small":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
stats=[]

guide_catalog=json.loads((ROOT/"technical-guides"/"guides.json").read_text("utf8"))["guides"]
MORE=[
  *[f"/portfolio/{p}/" for p in ("web-development","copenhagen-valuation",
    "full-stack-application","basecamp-response","shopflow-mobile","camp-booking")],
  *[f"/technical-guides/{g['slug']}/" for g in guide_catalog]
]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for device,(w,h) in VIEWPORTS.items():
        context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        for path,selector,number,is_home in PAGES:
            page=context.new_page()
            js_errors=[]
            page.on("pageerror",lambda x:js_errors.append(str(x)))
            res=page.goto(BASE+path,wait_until="domcontentloaded",timeout=30000)
            if res.status!=200:failures.append(f"{device} {path}: HTTP {res.status}")
            nav=page.locator(".site-header nav.navigation a")
            if nav.all_inner_texts()!=LABELS:
                failures.append(f"{device} {path}: header not in 01→05 order")
            for i,expected in enumerate(ROUTES):
                route=nav.nth(i).evaluate("x=>new URL(x.href).pathname")
                if route!=expected:
                    failures.append(f"{device} {path}: nav link {i} is {route}, expected {expected}")
            logo=page.locator(".site-header .brand-icon")
            footer=page.locator(".site-footer .footer-mark")
            for element,label in ((logo,"header"),(footer,"footer")):
                css=element.evaluate("""x=>{
                  const s=getComputedStyle(x);
                  const b=x.getBoundingClientRect();
                  return {image:s.backgroundImage,width:b.width,height:b.height,visible:s.visibility,display:s.display};
                }""")
                expected_asset="soheil-logo-inverse.svg" if is_home else "soheil-logo.svg"
                if expected_asset not in css["image"]:
                    failures.append(f"{device} {path}: {label} mark not using approved SVG: {css}")
                if css["width"]<25 or css["height"]<26:
                    failures.append(f"{device} {path}: {label} mark too small: {css}")
                if css["visible"]!="visible" or css["display"]=="none":
                    failures.append(f"{device} {path}: {label} logo not visible")
            if page.locator('link[rel="icon"]').get_attribute("href") is None or "soheil-favicon.svg" not in page.locator('link[rel="icon"]').get_attribute("href"):
                failures.append(f"{device} {path}: page still uses the protected old favicon")
            if selector:
                content=page.locator(selector).inner_text()
                if number not in content:
                    failures.append(f"{device} {path}: wrong page chapter {content!r}; want {number}")
            if path=="/portfolio/":
                if "02—01" not in page.locator(".portfolio-section-number").inner_text():
                    failures.append(f"{device}: wrong Portfolio subsection number")
            if path=="/technical-guides/":
                if "04—01" not in page.locator(".guides-section-heading").inner_text():
                    failures.append(f"{device}: wrong technical guides subsection number")
            if w>760:
                header=page.locator(".site-header").bounding_box()
                for a in nav.all():
                    link=a.bounding_box()
                    if link and (link["x"]<0 or link["x"]+link["width"]>w+1):
                        failures.append(f"{device} {path}: menu item outside viewport {link}")
                if header and abs(header["height"]-100)>1:
                    failures.append(f"{device} {path}: fixed header height changed")
            else:
                button=page.locator("#menu-button")
                button.click()
                if button.get_attribute("aria-expanded")!="true":
                    failures.append(f"{device} {path}: menu failed to open")
                if not nav.first.is_visible():
                    failures.append(f"{device} {path}: Profile not visible in mobile menu")
                page.keyboard.press("Escape")
                if button.get_attribute("aria-expanded")!="false":
                    failures.append(f"{device} {path}: menu failed to close")
            if page.evaluate("document.documentElement.scrollWidth-innerWidth")>3:
                failures.append(f"{device} {path}: horizontal page overflow")
            if js_errors:failures.append(f"{device} {path}: JS errors {js_errors}")
            if w==1440:
                page.screenshot(path=str(SCREENS/(path.strip("/").replace("/","-")+".png")),animations="disabled")
            page.close()
        context.close()
        stats.append(f"{device}: checked all six main pages")
    # Every individual Portfolio and AI article also shares the same header.
    ctx=browser.new_context(viewport={"width":1280,"height":840})
    for path in MORE:
        page=ctx.new_page()
        res=page.goto(BASE+path,wait_until="domcontentloaded",timeout=30000)
        if res.status!=200:failures.append(f"{path}: missing subpage")
        if page.locator(".site-header nav.navigation a").all_inner_texts()!=LABELS:
            failures.append(f"{path}: chapter order differs")
        if "soheil-favicon.svg" not in page.locator('link[rel="icon"]').get_attribute("href"):
            failures.append(f"{path}: article/project favicon differs")
        if "soheil-logo.svg" not in page.locator(".site-header .brand-icon").evaluate(
            "x=>getComputedStyle(x).backgroundImage"):
            failures.append(f"{path}: brand identity differs")
        page.close()
    ctx.close()
    browser.close()

# The automated WordPress article rebuild must not undo the site navigation.
sync=(ROOT/"scripts"/"sync_technical_guides.py").read_text("utf8")
if 'routes=[("PROFILE","profile/"),("PORTFOLIO","portfolio/")' not in sync:
    failures.append("Guide generator would overwrite the canonical 01→05 order")
if "04 / TECHNICAL GUIDES" not in sync or "04—01" not in sync:
    failures.append("Guide generator would overwrite the technical guides number")
if len(MORE)<17:
    failures.append("Expected six projects and eleven articles")
for asset in ("soheil-logo.svg","soheil-logo-inverse.svg"):
    body=(ROOT/"assets"/asset).read_text("utf8")
    if "<path " not in body or '<rect fill="#b02ecb"' not in body:
        failures.append("Approved logo shape or magenta period is missing: "+asset)
favicon=(ROOT/"assets"/"soheil-favicon.svg").read_text("utf8")
if "#b02ecb" not in favicon:
    failures.append("New website favicon does not match approved magenta logo")
legacy=(ROOT/"assets"/"favicon.svg").read_text("utf8")
if 'M13 41l10-21' not in legacy:
    failures.append("Protected original Frame 01 favicon has changed")
SERVER.shutdown()
(SCREENS/"report.json").write_text(json.dumps({"devices":stats,"subpages":len(MORE),"issues":failures},indent=2))
if failures:
    raise SystemExit("\n".join("FAIL "+msg for msg in failures))
print(f"PASS: one S. logo, 01–05 order, six main pages, {len(MORE)} project/guide pages.")
