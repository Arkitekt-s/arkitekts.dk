#!/usr/bin/env python3
"""Four-viewport browser checks for the approved five-frame site's new light contact companion."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"bright-contact"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
results=[]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        response=page.goto(BASE+"/contact/",wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{name}: contact HTTP {response.status}")
        page.wait_for_function("document.body.classList.contains('has-js')",timeout=5000)
        page.wait_for_timeout(650)

        for text in ["Let’s", "connect.", "Call", "Write", "Strandlodsvej"]:
            if page.get_by_text(text,exact=False).count()==0:
                failures.append(f"{name}: missing '{text}'")

        if page.locator(".hero-subtitle").inner_text().strip()!="Let’s build, collaborate, and solve complex challenges together.":
            failures.append(f"{name}: contact headline wording changed")
        if page.locator(".site-nav a").count()!=4:
            failures.append(f"{name}: navigation incomplete")
        if page.locator("h1").count()!=1:failures.append(f"{name}: missing unique page heading")
        if page.locator('a[href="tel:+4550315137"]').count()<1:
            failures.append(f"{name}: phone call link missing")
        if page.locator('a[href^="mailto:sohe@arkitekts.dk"]').count()!=1:
            failures.append(f"{name}: email action missing")
        if page.locator('a[href="https://github.com/Arkitekt-s"]').count()!=1:
            failures.append(f"{name}: GitHub link missing")
        if page.locator('a[href^="https://www.linkedin.com/in/soheilfattahieh/"]').count()!=1:
            failures.append(f"{name}: LinkedIn link missing")
        if page.locator(".contact-atmosphere").evaluate("el=>getComputedStyle(el).backgroundImage")=="none":
            failures.append(f"{name}: bright gradient background missing")
        bg=page.locator("body").evaluate("el=>getComputedStyle(el).backgroundColor")
        if bg=="rgb(0, 0, 0)":failures.append(f"{name}: contact uses dark background")

        h1=page.locator("h1").bounding_box()
        if not h1 or h1["x"]<-5 or h1["x"]+h1["width"]>w+5:
            failures.append(f"{name}: heading is clipped {h1}")
        opts=page.locator(".options-grid").bounding_box()
        if not opts or opts["x"]<-5 or opts["x"]+opts["width"]>w+5:
            failures.append(f"{name}: contact cards clipped {opts}")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{name}: horizontal overflow {overflow}")

        if w<=710:
            toggle=page.locator("#menu-toggle")
            if not toggle.is_visible():failures.append(f"{name}: mobile menu toggle missing")
            toggle.click()
            if toggle.get_attribute("aria-expanded")!="true":
                failures.append(f"{name}: mobile menu didn't open")
            page.keyboard.press("Escape")
            if toggle.get_attribute("aria-expanded")!="false":
                failures.append(f"{name}: Escape didn't close mobile menu")
        else:
            if not page.locator("#site-nav").is_visible():
                failures.append(f"{name}: desktop nav not visible")
        page.screenshot(path=str(OUT/f"{name}-contact-top.png"),full_page=False,animations="disabled")
        page.locator(".contact-options").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT/f"{name}-contact-options.png"),full_page=False,animations="disabled")

        # Headline link on the untouched cinematic homepage must navigate
        # to the new light contact route, not to the WordPress installation.
        homepage=ctx.new_page()
        homepage_errors=[]
        homepage.on("pageerror",lambda e:homepage_errors.append(str(e)))
        home=homepage.goto(BASE+"/concepts/frame-five-contact/",wait_until="domcontentloaded",timeout=30000)
        if home.status!=200:failures.append(f"{name}: cinematic home HTTP {home.status}")
        links=homepage.locator('a[data-contact-transition]')
        if links.count()!=2:failures.append(f"{name}: missing Let's talk links")
        for link in links.all():
            href=link.evaluate("e=>new URL(e.getAttribute('href'),location.href).pathname")
            if href!="/contact/":failures.append(f"{name}: incorrect Contact destination {href}")
        if homepage_errors:failures.append(f"{name}: homepage JavaScript errors {homepage_errors}")

        # Verify the visible header CTA works, including menu-opening on mobile.
        if w<=760:
            homepage.locator("#menu-button").click()
        homepage.locator('a.contact[data-contact-transition]').click(timeout=7000)
        homepage.wait_for_url("**/contact/",timeout=7000)
        if homepage.locator("h1").inner_text().replace("\n"," ").find("connect.")<0:
            failures.append(f"{name}: Let's talk did not reach contact heading")
        if errors:failures.append(f"{name}: contact JS errors {errors}")
        results.append({"device":name,"width":w,"height":h,"overflow":overflow,"contactBackground":bg,"errors":errors})
        print(f"VERIFIED {name} {w}x{h}: new contact, correct links, navigation, no overflow")
        ctx.close()

    # Do not hide content for visitors who request reduced motion.
    reduced=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
    page=reduced.new_page()
    page.goto(BASE+"/contact/",wait_until="domcontentloaded")
    page.wait_for_timeout(100)
    visible=page.locator(".hero-copy").evaluate("el=>getComputedStyle(el).opacity")
    if float(visible)<.9:failures.append("reduced-motion: hero content hidden")
    reduced.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":results,"failures":failures},indent=2))
if failures:
    raise SystemExit("\n".join("FAIL "+x for x in failures))
print("PASS: bright responsive contact page + homepage Let's talk navigation.")
