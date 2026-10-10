#!/usr/bin/env python3
"""Verify 11 live WordPress-MCP guides, all routes, useful UI and shared five-page DNA."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json
import sys

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"technical-guides"
CAT=json.loads((DIR/"guides.json").read_text("utf8"))["guides"]
OUT=ROOT/"screenshots"/"ai-technical-guides"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}"
VIEWPORTS={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
EXPECTED=["PROFILE","PORTFOLIO","SKILLS","GUIDES","Let's talk"]
DESTS=["/profile/","/portfolio/","/software-skills/","/technical-guides/","/contact/"]
issues=[]
record=[]
if len(CAT)<11:issues.append("Published guide catalog unexpectedly has fewer than 11 titles.")
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for device,(width,height) in VIEWPORTS.items():
        ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1)
        ctx.grant_permissions(["clipboard-read","clipboard-write"],origin=BASE)
        page=ctx.new_page()
        js_errors=[]
        page.on("pageerror",lambda e:js_errors.append(str(e)))
        res=page.goto(BASE+"/technical-guides/",wait_until="domcontentloaded",timeout=30000)
        if res.status!=200:issues.append(f"{device}: library HTTP {res.status}")
        page.wait_for_function("document.body.dataset.guidesReady==='true'",timeout=7000)
        if page.locator(".guide-card").count()!=len(CAT):
            issues.append(f"{device}: number of cards differs from published catalog")
        if page.locator("h1").count()!=1:issues.append(f"{device}: library needs one headline")
        if page.locator(".navigation a").all_inner_texts()!=EXPECTED:
            issues.append(f"{device}: shared navigation missing")
        if page.locator(".guide-card h3").count()!=len(CAT):
            issues.append(f"{device}: one or more guide headings missing")
        for item in CAT:
            if page.locator(f'.guide-card-link[href="{item["slug"]}/"]').count()!=1:
                issues.append(f"{device}: missing link to {item['slug']}")
        for i,path in enumerate(DESTS):
            actual=page.locator(".navigation a").nth(i).evaluate("el=>new URL(el.href).pathname")
            if actual!=path:issues.append(f"{device}: Guides header link {i} is {actual}")
        box=page.locator(".site-header").bounding_box()
        footer=page.locator(".site-footer").bounding_box()
        head_h=73 if width<=760 else 100
        foot_h=65 if width<=760 else 80
        if not box or abs(box["height"]-head_h)>1 or abs(box["y"])>1:
            issues.append(f"{device}: fixed header geometry {box}")
        if not footer or abs(footer["height"]-foot_h)>1 or abs(footer["y"]+footer["height"]-height)>1:
            issues.append(f"{device}: fixed footer geometry {footer}")
        if page.locator(".site-header").evaluate("el=>getComputedStyle(el).position")!="fixed":
            issues.append(f"{device}: header not fixed")
        if page.locator(".site-footer").evaluate("el=>getComputedStyle(el).position")!="fixed":
            issues.append(f"{device}: footer not fixed")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:issues.append(f"{device}: horizontal overflow {overflow}")
        headline=page.locator("h1").bounding_box()
        if not headline or headline["x"]<-2 or headline["x"]+headline["width"]>width+2:
            issues.append(f"{device}: library headline clipped {headline}")
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        page.screenshot(path=str(OUT/f"{device}-library.png"),animations="disabled")
        if width<=760:
            menu=page.locator("#menu-button")
            menu.click()
            if menu.get_attribute("aria-expanded")!="true":issues.append(f"{device}: menu not opened")
            page.keyboard.press("Escape")
            if menu.get_attribute("aria-expanded")!="false":issues.append(f"{device}: menu not closed")

        search=page.locator("#guides-search")
        search.fill("MongoDB")
        if page.locator("#guides-count").inner_text()!="1 GUIDE":
            issues.append(f"{device}: MongoDB search did not return one card")
        if page.locator(".guide-card:not([hidden])").count()!=1:
            issues.append(f"{device}: MongoDB search does not filter actual cards")
        page.locator("#guides-clear").click()
        if page.locator("#guides-count").inner_text()!=f"{len(CAT)} GUIDES":
            issues.append(f"{device}: clear did not restore all guides")
        page.get_by_role("button",name="AUTOMATION",exact=True).click()
        if page.locator("#guides-count").inner_text()!="1 GUIDE":
            issues.append(f"{device}: Automation filter should show only Ansible")
        page.get_by_role("button",name="ALL TOPICS").click()
        search.fill("unknown-guide-xxxx")
        if not page.locator("#guides-empty").is_visible():
            issues.append(f"{device}: no results message missing")
        page.locator("#guides-reset").click()
        if page.locator("#guides-count").inner_text()!=f"{len(CAT)} GUIDES":
            issues.append(f"{device}: reset did not restore all guides")
        listing_errors=js_errors[:]

        # Every published technical article gets its own static GitHub page.
        for i,item in enumerate(CAT):
            slug=item["slug"]
            detail=ctx.new_page()
            page_errors=[]
            detail.on("pageerror",lambda e:page_errors.append(str(e)))
            res=detail.goto(BASE+f"/technical-guides/{slug}/",wait_until="domcontentloaded",timeout=30000)
            if res.status!=200:issues.append(f"{device}: guide {slug} HTTP {res.status}")
            detail.wait_for_function("document.body.dataset.guideReady==='true'",timeout=6000)
            if detail.locator("h1").count()!=1:issues.append(f"{device}: article {slug} has wrong h1 count")
            if detail.locator("h1").inner_text().rstrip(" .\n")!=item["title"]:
                issues.append(f"{device}: guide title changed {slug}")
            if detail.locator(".guide-article-body").count()!=1:
                issues.append(f"{device}: missing article content on {slug}")
            if detail.locator("a.guide-contents-back").get_attribute("href")!="../":
                issues.append(f"{device}: {slug} missing back link")
            if detail.locator(".guide-article-body").inner_text().strip()=="":
                issues.append(f"{device}: article is empty: {slug}")
            if detail.locator(".guide-original a").get_attribute("href")!=item["source_url"]:
                issues.append(f"{device}: original WordPress source lost: {slug}")
            if detail.locator(".navigation a").all_inner_texts()!=EXPECTED:
                issues.append(f"{device}: guide header differs from published site {slug}")
            if detail.locator(".footer-specialties").inner_text()!="LINUX · ANSIBLE · ELASTICSEARCH · KAFKA":
                issues.append(f"{device}: guide footer differs {slug}")
            doc_overflow=detail.evaluate("document.documentElement.scrollWidth-innerWidth")
            if doc_overflow>2:issues.append(f"{device}: {slug} overflow {doc_overflow}")
            heading=detail.locator("h1").bounding_box()
            if not heading or heading["x"]<-2 or heading["x"]+heading["width"]>width+2:
                issues.append(f"{device}: {slug} heading clipped {heading}")
            if not detail.locator(f'a[href="../{CAT[(i+1)%len(CAT)]["slug"]}/"]').count():
                issues.append(f"{device}: {slug} next article link absent")
            if not detail.locator(f'a[href="../{CAT[(i-1)%len(CAT)]["slug"]}/"]').count():
                issues.append(f"{device}: {slug} previous article link absent")
            if i==4:
                detail.evaluate("window.scrollTo({top:0,behavior:'instant'})")
                detail.screenshot(path=str(OUT/f"{device}-ansible-article.png"),animations="disabled")
            if i==0:
                detail.locator("#guide-copy").click()
                detail.wait_for_function("document.querySelector('#guide-copy')?.dataset.copied==='true'",timeout=5000)
                copied=detail.evaluate("navigator.clipboard.readText()")
                if copied!=BASE+f"/technical-guides/{slug}/":
                    issues.append(f"{device}: copy link did not copy correct article URL")
            if page_errors:issues.append(f"{device}: {slug} script errors {page_errors}")
            detail.close()
        if listing_errors:issues.append(f"{device}: library script errors {listing_errors}")
        record.append({"device":device,"width":width,"height":height,"guides":len(CAT),"overflow":overflow})
        print(f"VERIFIED {device} {width}x{height}: catalog, filters, 11 articles, full navigation and clipboard")
        ctx.close()
    # The contents remain readable if JavaScript is disabled.
    ctx=browser.new_context(viewport={"width":390,"height":844},java_script_enabled=False)
    listing=ctx.new_page()
    listing.goto(BASE+"/technical-guides/",wait_until="domcontentloaded")
    if listing.locator(".guide-card:not([hidden])").count()!=len(CAT):
        issues.append("Without JS, not all article links are visible.")
    listing.close()
    guide=ctx.new_page()
    guide.goto(BASE+f"/technical-guides/{CAT[0]['slug']}/",wait_until="domcontentloaded")
    if not guide.locator(".guide-article-body").inner_text().strip():
        issues.append("Without JS, technical article content is missing.")
    ctx.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":record,"issues":issues},indent=2))
if issues:raise SystemExit("\n".join("FAIL "+issue for issue in issues))
print("PASS: all published AI Guides integrated across every viewport.")
