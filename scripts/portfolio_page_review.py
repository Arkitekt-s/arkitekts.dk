#!/usr/bin/env python3
"""Four-viewport review of portfolio, real six projects, image assets and navigation."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"portfolio"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
TITLES=[
 "Web Development","Machine Learning-Based Apartment Valuation",
 "Full-Stack Application","Basecamp Response Monitor",
 "ShopFlow Mobile","CAMP Booking System"
]
PATHS=["/profile/","/portfolio/","/software-skills/","/technical-guides/","/contact/"]
MENU=["PROFILE","PORTFOLIO","SKILLS","GUIDES","Let's talk"]
failures=[]
results=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        r=page.goto(BASE+"/portfolio/",wait_until="domcontentloaded",timeout=25000)
        if r.status!=200:failures.append(f"{name}: portfolio HTTP {r.status}")
        page.wait_for_function("document.body.dataset.portfolioReady==='true'",timeout=5000)

        if page.locator("h1").count()!=1:
            failures.append(f"{name}: portfolio needs one heading")
        if page.locator(".project-card").count()!=6:
            failures.append(f"{name}: missing one of six original projects")
        if page.locator("#portfolio-count").inner_text()!="6 PROJECTS":
            failures.append(f"{name}: initial count wrong")
        if page.locator(".project-card h3").all_inner_texts()!=TITLES:
            failures.append(f"{name}: original project titles differ")
        if page.locator(".project-card .project-details").count()!=6:
            failures.append(f"{name}: native case study sections absent")
        if page.locator('.case-actions a[href^="https://arkitekts.dk/portfolio/"]').count()!=6:
            failures.append(f"{name}: original case study links missing")
        if page.locator(".project-card img").count()!=5:
            failures.append(f"{name}: expected five actual screenshot images")
        if page.locator(".app-mockup").count()!=1:
            failures.append(f"{name}: missing conceptual grocery app illustration")
        # Real screenshots are lazy-loaded, so scroll each into view before
        # verifying local image availability. A first-screen wait is insufficient.
        for img in page.locator(".project-card img").all():
            img.scroll_into_view_if_needed(timeout=7000)
            img.evaluate("img=>img.loading='eager'")
            img.evaluate("img=>img.complete||new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})")
            details=img.evaluate("e=>({src:e.getAttribute('src'),w:e.naturalWidth,h:e.naturalHeight})")
            if not details["src"].startswith("assets/") or details["w"]<200 or details["h"]<200:
                failures.append(f"{name}: self-hosted screenshot unavailable {details}")
        if page.locator("nav.navigation a").all_inner_texts()!=MENU:
            failures.append(f"{name}: shared header wording changed")
        for i,expected in enumerate(PATHS):
            path=page.locator(".navigation a").nth(i).evaluate("el=>new URL(el.href).pathname")
            if path!=expected:failures.append(f"{name}: header link {i} is {path}, not {expected}")
        if page.locator(".navigation a").nth(1).get_attribute("aria-current")!="page":
            failures.append(f"{name}: Portfolio should be active in header")
        head=page.locator(".site-header")
        foot=page.locator(".site-footer")
        hrect=head.bounding_box()
        frect=foot.bounding_box()
        head_height=73 if w<=760 else 100
        foot_height=65 if w<=760 else 80
        if not hrect or abs(hrect["height"]-head_height)>1 or abs(hrect["y"])>1:
            failures.append(f"{name}: header layout changed {hrect}")
        if not frect or abs(frect["height"]-foot_height)>1 or abs(frect["y"]+frect["height"]-h)>1:
            failures.append(f"{name}: footer layout changed {frect}")
        if head.evaluate("e=>getComputedStyle(e).position")!="fixed":
            failures.append(f"{name}: header is not fixed")
        if foot.evaluate("e=>getComputedStyle(e).position")!="fixed":
            failures.append(f"{name}: footer is not fixed")
        if page.locator(".footer-specialties").inner_text()!="LINUX · ANSIBLE · ELASTICSEARCH · KAFKA":
            failures.append(f"{name}: shared footer technologies changed")

        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{name}: horizontal overflow {overflow}")
        title=page.locator("h1").bounding_box()
        if not title or title["x"]<-4 or title["x"]+title["width"]>w+4:
            failures.append(f"{name}: hero text clipped {title}")
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        page.wait_for_timeout(100)
        page.screenshot(path=str(OUT/f"{name}-top.png"),animations="disabled")

        if w<=760:
            menu=page.locator("#menu-button")
            menu.click()
            if menu.get_attribute("aria-expanded")!="true":
                failures.append(f"{name}: mobile nav did not open")
            page.keyboard.press("Escape")
            if menu.get_attribute("aria-expanded")!="false":
                failures.append(f"{name}: mobile nav did not close")

        # Search must return actual matches, not just a cosmetic animation.
        search=page.locator("#portfolio-search")
        search.fill("Basecamp")
        if page.locator("#portfolio-count").inner_text()!="1 PROJECT":
            failures.append(f"{name}: Basecamp search should return one project")
        if page.locator(".project-card:not([hidden])").count()!=1:
            failures.append(f"{name}: search still shows unrelated cards")
        page.locator("#portfolio-clear").click()
        if page.locator("#portfolio-count").inner_text()!="6 PROJECTS":
            failures.append(f"{name}: clear did not restore six cards")
        page.get_by_role("button",name="APPLICATIONS",exact=True).click()
        if page.locator("#portfolio-count").inner_text()!="2 PROJECTS":
            failures.append(f"{name}: app category must return full-stack and CAMP")
        if page.locator(".project-card:not([hidden])").count()!=2:
            failures.append(f"{name}: app category did not filter actual cards")
        page.get_by_role("button",name="DATA",exact=True).click()
        if page.locator("#portfolio-count").inner_text()!="1 PROJECT":
            failures.append(f"{name}: data category should return one project")
        page.get_by_role("button",name="ALL PROJECTS").click()
        search.fill("this-is-not-a-project")
        if not page.locator("#portfolio-empty").is_visible():
            failures.append(f"{name}: no-match message missing")
        page.locator("#portfolio-reset").click()
        if page.locator("#portfolio-count").inner_text()!="6 PROJECTS":
            failures.append(f"{name}: reset filter did not restore all")

        # Real expandable project details work on all devices, even without JS.
        card=page.locator("#basecamp-response")
        card.locator("summary").click()
        if card.locator(".project-details").get_attribute("open") is None:
            failures.append(f"{name}: case study expansion not working")
        if not card.locator(".project-extra").is_visible():
            failures.append(f"{name}: expanded case study is not visible")
        page.screenshot(path=str(OUT/f"{name}-project.png"),animations="disabled")

        # All five pages share navigation and footer content.
        for route in ("/concepts/frame-five-contact/","/profile/","/software-skills/","/contact/"):
            sub=ctx.new_page()
            sub.goto(BASE+route,wait_until="domcontentloaded")
            nav=sub.locator(".navigation a")
            if nav.all_inner_texts()!=MENU:
                failures.append(f"{name}: {route} not using shared navigation")
            for i,expected in enumerate(PATHS):
                dest=nav.nth(i).evaluate("el=>new URL(el.href).pathname")
                if dest!=expected:
                    failures.append(f"{name}: {route} nav {i} points to {dest}, not {expected}")
            if sub.locator(".footer-specialties").inner_text()!=page.locator(".footer-specialties").inner_text():
                failures.append(f"{name}: {route} footer DNA mismatch")
            sub.close()
        if errors:failures.append(f"{name}: JavaScript errors {errors}")
        results.append({"device":name,"size":[w,h],"overflow":overflow,"errors":errors})
        print(f"CHECKED {name}: six original projects, all assets, full navigation, search, filters, case study")
        ctx.close()

    nojs=browser.new_context(viewport={"width":390,"height":844},java_script_enabled=False)
    pg=nojs.new_page()
    pg.goto(BASE+"/portfolio/",wait_until="domcontentloaded")
    if pg.locator(".project-card:not([hidden])").count()!=6:
        failures.append("NoJS: original case studies were hidden")
    pg.locator("#web-development summary").click()
    if pg.locator("#web-development .project-details").get_attribute("open") is None:
        failures.append("NoJS: project details must remain available")
    nojs.close()
    reduced=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
    pg=reduced.new_page()
    pg.goto(BASE+"/portfolio/",wait_until="domcontentloaded")
    if float(pg.locator(".portfolio-hero-text").evaluate("e=>getComputedStyle(e).opacity"))<.9:
        failures.append("Reduced-motion visitors cannot see project overview")
    reduced.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":results,"failures":failures},indent=2))
if failures:
    raise SystemExit("\n".join("FAIL "+msg for msg in failures))
print("PASS: six real case studies, four-device layout, shared five-page nav, filters, image cache.")
