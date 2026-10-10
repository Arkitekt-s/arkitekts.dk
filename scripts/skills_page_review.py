#!/usr/bin/env python3
"""Test light Skills page, functional filtering and preserved header/footer at four sizes."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"skills-page"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
results=[]
EXPECTED=["PORTFOLIO","ABOUT","SKILLS","Let's talk"]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        js_errors=[]
        page.on("pageerror",lambda err:js_errors.append(str(err)))
        response=page.goto(BASE+"/software-skills/",wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{name}: Skills returned {response.status}")
        page.wait_for_function("document.body.dataset.skillsReady==='true'",timeout=7000)
        if "Infrastructure" not in page.locator("h1").inner_text() or "Platform" not in page.locator("h1").inner_text():
            failures.append(f"{name}: main title missing")
        if page.locator(".skill").count()!=37:failures.append(f"{name}: expected 37 supplied skills")
        if page.locator(".stack-group").count()!=4:failures.append(f"{name}: expected 4 groups")
        if page.locator(".stack-intro h2").all_inner_texts()!=["Platforms.","Execution."]:
            failures.append(f"{name}: Platform / Execution sections missing")
        if page.locator("#result-count").inner_text()!="37 SKILLS":
            failures.append(f"{name}: initial skills count wrong")
        for expected in ["Linux","Red Hat","Elasticsearch","Kafka","Logstash","React Native","Spring Boot",
                         "Cross-Team Collaboration","Certificate Management","Zabbix","ILM"]:
            if page.locator(".skill").filter(has_text=expected).count()<1:
                failures.append(f"{name}: skill missing {expected}")
        if page.locator('.navigation a').all_inner_texts()!=EXPECTED:
            failures.append(f"{name}: header navigation differs from approved site")
        for selector in [".site-name",".footer-specialties",".footer-location"]:
            # Compare exact visible text against the approved five-frame homepage.
            if not page.locator(selector).count():failures.append(f"{name}: missing chrome {selector}")
        header=page.locator(".site-header")
        footer=page.locator(".site-footer")
        head=header.bounding_box()
        foot=footer.bounding_box()
        header_height=73 if w<=760 else 100
        footer_height=65 if w<=760 else 80
        if not head or abs(head["y"])>1 or abs(head["height"]-header_height)>1:
            failures.append(f"{name}: header geometry {head}")
        if not foot or abs(foot["y"]+foot["height"]-h)>1 or abs(foot["height"]-footer_height)>1:
            failures.append(f"{name}: footer geometry {foot}")
        if header.evaluate("e=>getComputedStyle(e).position")!="fixed":
            failures.append(f"{name}: header not fixed")
        if footer.evaluate("e=>getComputedStyle(e).position")!="fixed":
            failures.append(f"{name}: footer not fixed")

        title=page.locator("h1").bounding_box()
        if not title or title["x"]<-2 or title["x"]+title["width"]>w+2:
            failures.append(f"{name}: headline clipped {title}")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{name}: horizontal overflow {overflow}")
        page.screenshot(path=str(OUT/f"{name}-hero.png"),animations="disabled")
        if w<=760:
            toggle=page.locator("#menu-button")
            toggle.click()
            if toggle.get_attribute("aria-expanded")!="true":
                failures.append(f"{name}: menu did not open")
            page.keyboard.press("Escape")
            if toggle.get_attribute("aria-expanded")!="false":
                failures.append(f"{name}: Escape did not close menu")

        # Category buttons filter real content, not simply change a visual indicator.
        page.get_by_role("button",name="DATA & LOGGING").click()
        if page.locator("#result-count").inner_text()!="8 SKILLS":
            failures.append(f"{name}: logging filter count incorrect")
        if page.locator(".skill:not([hidden])").count()!=8:
            failures.append(f"{name}: logging filter still shows unrelated skills")
        if page.locator(".stack-group:not([hidden])").count()!=1:
            failures.append(f"{name}: logging filter leaves unrelated groups open")
        if not page.locator(".execution-intro").is_hidden():
            failures.append(f"{name}: Execution heading remains when filtering logging")
        page.get_by_role("button",name="ALL",exact=True).click()
        if page.locator("#result-count").inner_text()!="37 SKILLS":
            failures.append(f"{name}: All did not restore full stack")
        search=page.locator("#skill-search")
        search.fill("React")
        if page.locator("#result-count").inner_text()!="2 SKILLS":
            failures.append(f"{name}: React search should match React and React Native")
        if not page.locator(".stack-section[data-section='platform']").is_hidden():
            failures.append(f"{name}: Platform should hide when searching React")
        search.fill("deliberately-unmatched")
        if not page.locator("#no-results").is_visible():
            failures.append(f"{name}: missing empty-state message")
        page.locator("#reset-filters").click()
        if page.locator("#result-count").inner_text()!="37 SKILLS":
            failures.append(f"{name}: reset did not restore full list")
        search.fill("Kafka")
        if page.locator("#result-count").inner_text()!="1 SKILL":
            failures.append(f"{name}: Kafka search did not isolate one tool")
        page.locator("#clear-search").click()
        if search.input_value()!="":
            failures.append(f"{name}: clear search did not clear text")
        page.screenshot(path=str(OUT/f"{name}-stack.png"),animations="disabled")

        # Shared chrome is the same as the approved five-frame homepage.
        home=ctx.new_page()
        home.goto(BASE+"/concepts/frame-five-contact/",wait_until="domcontentloaded")
        for selector in [".site-name",".footer-specialties",".footer-location"]:
            if page.locator(selector).inner_text()!=home.locator(selector).inner_text():
                failures.append(f"{name}: Skills header/footer differs from homepage: {selector}")
        if not home.locator('a[href="../../software-skills/"]').count():
            failures.append(f"{name}: homepage has no Skills navigation")
        home.close()
        contact=ctx.new_page()
        contact.goto(BASE+"/contact/",wait_until="domcontentloaded")
        if not contact.locator('a[href="../software-skills/"]').count():
            failures.append(f"{name}: Contact page has no Skills navigation")
        contact.close()

        if js_errors:failures.append(f"{name}: JS errors {js_errors}")
        results.append({"device":name,"dimensions":[w,h],"overflow":overflow,"errors":js_errors})
        print(f"VERIFIED {name} {w}x{h}: fixed chrome, all 37 skills, actual search, category filters")
        ctx.close()

    # No JavaScript required to read the full technology list.
    context=browser.new_context(viewport={"width":390,"height":844},java_script_enabled=False)
    page=context.new_page()
    page.goto(BASE+"/software-skills/",wait_until="domcontentloaded")
    if page.locator(".skill").count()!=37 or page.locator(".skill:not([hidden])").count()!=37:
        failures.append("without JS: some skill names are hidden")
    context.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":results,"failures":failures},indent=2))
if failures:raise SystemExit("\n".join("FAIL "+f for f in failures))
print("PASS: Skills page design, shared chrome and meaningful interactions.")
