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
        # Headless Chromium requires explicit clipboard permissions in CI.
        ctx.grant_permissions(["clipboard-read","clipboard-write"],origin=BASE)
        page=ctx.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        response=page.goto(BASE+"/contact/",wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:failures.append(f"{name}: contact HTTP {response.status}")
        page.wait_for_function("document.body.dataset.contactReady==='true'",timeout=5000)
        page.wait_for_timeout(650)

        for text in ["Let’s", "connect.", "Call", "Write", "Strandlodsvej"]:
            if page.get_by_text(text,exact=False).count()==0:
                failures.append(f"{name}: missing '{text}'")

        if page.locator(".hero-subtitle").inner_text().strip()!="Let’s build, collaborate, and solve complex challenges together.":
            failures.append(f"{name}: contact headline wording changed")
        if page.locator(".navigation a").count()!=5:
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

        # Identical chrome proportions, labels, placement and responsive menu.
        header=page.locator(".site-header")
        footer=page.locator(".site-footer")
        header_rect=header.bounding_box()
        footer_rect=footer.bounding_box()
        expected_header=73 if w<=760 else 100
        expected_footer=65 if w<=760 else 80
        if header.evaluate("e=>getComputedStyle(e).position")!="fixed":
            failures.append(f"{name}: shared header is not fixed")
        if footer.evaluate("e=>getComputedStyle(e).position")!="fixed":
            failures.append(f"{name}: shared footer is not fixed")
        if not header_rect or abs(header_rect["height"]-expected_header)>1 or abs(header_rect["y"])>1:
            failures.append(f"{name}: header differs from baseline {header_rect}")
        if not footer_rect or abs(footer_rect["height"]-expected_footer)>1 or abs(footer_rect["y"]+footer_rect["height"]-h)>1:
            failures.append(f"{name}: footer differs from baseline {footer_rect}")
        if page.locator(".site-name").inner_text().strip()!="S O H E I L":
            failures.append(f"{name}: fixed wordmark missing")
        if page.locator(".footer-specialties").inner_text().strip().replace("  "," ")!="LINUX · ANSIBLE · ELASTICSEARCH · KAFKA":
            failures.append(f"{name}: shared footer specialties changed")
        if page.locator(".footer-location").inner_text().strip()!="COPENHAGEN · DENMARK":
            failures.append(f"{name}: footer location differs from approved baseline")
        if [a.strip() for a in page.locator(".navigation a").all_text_contents()]!=[
          "PORTFOLIO","PROFILE","SKILLS","GUIDES","Let's talk"
        ]:failures.append(f"{name}: navigation labels differ from homepage")
        if w<=760:
            toggle=page.locator("#menu-button")
            if not toggle.is_visible():failures.append(f"{name}: matching mobile menu missing")
            toggle.click()
            if toggle.get_attribute("aria-expanded")!="true":
                failures.append(f"{name}: mobile menu didn't open")
            page.keyboard.press("Escape")
            if toggle.get_attribute("aria-expanded")!="false":
                failures.append(f"{name}: Escape didn't close mobile menu")
        else:
            if not page.locator("#navigation").is_visible():
                failures.append(f"{name}: desktop nav not visible")
        # Let's talk takes the visitor to actual working contact cards.
        if w<=760:page.locator("#menu-button").click()
        page.locator('.navigation .contact').click(timeout=5000)
        page.wait_for_function("location.hash==='#contact-methods'",timeout=5000)
        page.wait_for_function("document.activeElement?.id==='contact-methods'",timeout=5000)
        if w<=760 and page.locator("#menu-button").get_attribute("aria-expanded")!="false":
            failures.append(f"{name}: contact navigation left mobile menu open")
        # Clipboard JS must actually copy the supplied details.
        for selector,expected in [
            ('[data-copy-contact="sohe@arkitekts.dk"]',"sohe@arkitekts.dk"),
            ('[data-copy-contact="+45 50 31 51 37"]',"+45 50 31 51 37")
        ]:
            button=page.locator(selector)
            if button.count()!=1:failures.append(f"{name}: copy button missing: {expected}")
            else:
                button.click(timeout=5000)
                page.wait_for_function(
                    "(value)=>[...document.querySelectorAll('[data-copy-contact]')].find(el=>el.dataset.copyContact===value)?.dataset.copied==='true'",
                    arg=expected,timeout=5000
                )
                if expected not in page.locator("#copy-status").inner_text():
                    failures.append(f"{name}: copy status did not report actual contact")
                actual=page.evaluate("navigator.clipboard.readText()")
                if actual!=expected:
                    failures.append(f"{name}: clipboard content mismatch: {actual}")
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
        # Compare the shared wording directly with the preserved homepage.
        for selector in (".site-name",".footer-specialties",".footer-location"):
            if homepage.locator(selector).inner_text()!=page.locator(selector).inner_text():
                failures.append(f"{name}: chrome copy differs from approved homepage: {selector}")

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
