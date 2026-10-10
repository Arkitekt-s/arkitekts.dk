#!/usr/bin/env python3
"""Validate biography, education, shared chrome and meaningful navigation at 4 widths."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"profile-page"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
failures=[]
records=[]
EXPECTED_MENU=["PROFILE","PORTFOLIO","SKILLS","GUIDES","Let's talk"]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=context.new_page()
        js_errors=[]
        page.on("pageerror",lambda err:js_errors.append(str(err)))
        r=page.goto(BASE+"/profile/",wait_until="domcontentloaded",timeout=30000)
        if r.status!=200:failures.append(f"{name}: HTTP {r.status}")
        page.wait_for_function("document.body.dataset.profileReady==='true'",timeout=5000)
        if page.locator("h1").count()!=1:failures.append(f"{name}: expected unique profile heading")
        headline=page.locator("h1").inner_text()
        for term in ("Infrastructure", "Platform", "Integration", "Opportunities"):
            if term not in headline:failures.append(f"{name}: missing headline term {term}")
        for exact in (
            "KEA – Copenhagen School of Design and Technology",
            "I believe in collaboration, continuous learning, and sharing knowledge.",
            "I’ve been living in Denmark since 2014",
            "my Danish wife, Anja",
            "Cooking is another skill I’m proud of",
            "KEA", "Computer Science (Datamatiker)",
            "2020 – 2024",
            "University of Kent", "MA Architecture and Cities",
            "architecture, urban design, and analytical thinking"
        ):
            if exact not in page.locator("main").inner_text():
                failures.append(f"{name}: missing supplied profile content: {exact}")
        image=page.locator(".profile-portrait img")
        if image.get_attribute("src")!="assets/soheil-cutout.webp":
            failures.append(f"{name}: Profile must use the local transparent cutout")
        page.wait_for_function(
            "document.querySelector('.profile-portrait img')?.complete",
            timeout=5000
        )
        image_data=image.evaluate("""img=>{
            const c=document.createElement('canvas');
            c.width=img.naturalWidth;c.height=img.naturalHeight;
            const ctx=c.getContext('2d',{willReadFrequently:true});
            ctx.drawImage(img,0,0);
            const a=(x,y)=>ctx.getImageData(x,y,1,1).data[3];
            return {w:c.width,h:c.height,topLeft:a(0,0),
              topRight:a(c.width-1,0),
              center:a(Math.floor(c.width*.5),Math.floor(c.height*.55))};
        }""")
        if image_data["w"]<400 or image_data["h"]<300:
            failures.append(f"{name}: new portrait unavailable: {image_data}")
        if image_data["topLeft"]>30 or image_data["topRight"]>30:
            failures.append(f"{name}: checkerboard was not removed: {image_data}")
        if image_data["center"]<200:
            failures.append(f"{name}: subject was erased from portrait: {image_data}")
        portrait_style=page.locator(".profile-portrait").evaluate(
            "el=>({overflow:getComputedStyle(el).overflow,opacity:getComputedStyle(el).opacity})"
        )
        if portrait_style["overflow"]!="visible":
            failures.append(f"{name}: portrait still crops the subject")
        if w<=760 and float(portrait_style["opacity"])<.95:
            failures.append(f"{name}: mobile portrait is too faint")

        if page.locator(".education-logo-wrap img").count()!=1:
            failures.append(f"{name}: education school logo missing")
        if page.locator('a[href="https://studieordninger.kea.dk/2025/36/225"]').count()!=1:
            failures.append(f"{name}: KEA programme URL missing")
        if page.locator('a[href="https://www.kent.ac.uk/courses/postgraduate/182/architecture-and-the-sustainable-environment"]').count()!=1:
            failures.append(f"{name}: Kent programme URL missing")
        if page.locator('.navigation a').all_inner_texts()!=EXPECTED_MENU:
            failures.append(f"{name}: nav wording differs from approved homepage")
        # Every header shares four internal destinations; S. returns home.
        nav_links=page.locator(".navigation a")
        expected_paths=["/profile/","/portfolio/","/software-skills/","/technical-guides/","/contact/"]
        for index,dest in enumerate(expected_paths):
            # Contact's own CTA may use an anchor to its contact methods.
            href=nav_links.nth(index).evaluate("el=>new URL(el.href).pathname")
            if href!=dest:
                failures.append(f"{name}: header link {index} points to {href}, not {dest}")
        home_path=page.locator(".site-header .brand-icon").evaluate("el=>new URL(el.href).pathname")
        if home_path!="/concepts/frame-five-contact/":
            failures.append(f"{name}: S. logo does not return home")

        if page.locator(".profile-section").count()!=2:
            failures.append(f"{name}: Personal/Education sections missing")
        for destination in ("profile-personal","profile-education"):
            if page.locator(f'[data-section-link="{destination}"]').count()!=1:
                failures.append(f"{name}: missing jump link to {destination}")

        header=page.locator(".site-header")
        footer=page.locator(".site-footer")
        hrect=header.bounding_box()
        frect=footer.bounding_box()
        expected_header=73 if w<=760 else 100
        expected_footer=65 if w<=760 else 80
        if header.evaluate("el=>getComputedStyle(el).position")!="fixed":
            failures.append(f"{name}: header not fixed")
        if footer.evaluate("el=>getComputedStyle(el).position")!="fixed":
            failures.append(f"{name}: footer not fixed")
        if not hrect or abs(hrect["height"]-expected_header)>1 or abs(hrect["y"])>1:
            failures.append(f"{name}: header geometry differs: {hrect}")
        if not frect or abs(frect["height"]-expected_footer)>1 or abs(frect["y"]+frect["height"]-h)>1:
            failures.append(f"{name}: footer geometry differs: {frect}")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:failures.append(f"{name}: horizontal overflow {overflow}")
        hero=page.locator(".profile-hero h1").bounding_box()
        if not hero or hero["x"]<-3 or hero["x"]+hero["width"]>w+3:
            failures.append(f"{name}: headline clipped {hero}")
        if page.locator(".profile-page .contact-atmosphere").evaluate("el=>getComputedStyle(el).backgroundImage")=="none":
            failures.append(f"{name}: bright background missing")

        page.screenshot(path=str(OUT/f"{name}-hero.png"),animations="disabled")
        # Verify the new cutout when it appears further down on small screens.
        page.locator(".profile-portrait").scroll_into_view_if_needed()
        page.screenshot(path=str(OUT/f"{name}-portrait.png"),animations="disabled")
        page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
        if w<=760:
            menu=page.locator("#menu-button")
            menu.click()
            if menu.get_attribute("aria-expanded")!="true":
                failures.append(f"{name}: mobile navigation fails to open")
            page.keyboard.press("Escape")
            if menu.get_attribute("aria-expanded")!="false":
                failures.append(f"{name}: mobile navigation fails to close")
        page.locator('[data-section-link="profile-education"]').click()
        page.wait_for_function("location.hash==='#profile-education'",timeout=6000)
        page.wait_for_function("document.activeElement?.id==='profile-education'",timeout=6000)
        if page.locator('[data-section-link="profile-education"]').get_attribute("aria-current")!="location":
            failures.append(f"{name}: section index did not update")
        page.screenshot(path=str(OUT/f"{name}-education.png"),animations="disabled")

        # Compare shared fixed chrome content against approved homepage.
        original=context.new_page()
        original.goto(BASE+"/concepts/frame-five-contact/",wait_until="domcontentloaded")
        for selector in (".site-name",".footer-specialties",".footer-location"):
            if page.locator(selector).inner_text()!=original.locator(selector).inner_text():
                failures.append(f"{name}: shared chrome differs: {selector}")
        if not original.locator('a[href="../../profile/"]').count():
            failures.append(f"{name}: homepage PROFILE does not open local Profile")
        for index,dest in enumerate(["/profile/","/portfolio/","/software-skills/","/technical-guides/","/contact/"]):
            path=original.locator(".navigation a").nth(index).evaluate("el=>new URL(el.href).pathname")
            if path!=dest:
                failures.append(f"{name}: homepage nav {index} points to {path}, not {dest}")
        original.close()

        for route in ("contact","software-skills"):
            sub=context.new_page()
            sub.goto(BASE+f"/{route}/",wait_until="domcontentloaded")
            if not sub.locator('a[href="../profile/"]').count():
                failures.append(f"{name}: {route} PROFILE is not linked to Profile")
            expected_sub=["/profile/","/portfolio/","/software-skills/","/technical-guides/"]
            for index,dest in enumerate(expected_sub):
                path=sub.locator(".navigation a").nth(index).evaluate("el=>new URL(el.href).pathname")
                if path!=dest:
                    failures.append(f"{name}: {route} nav link {index} should be {dest}, got {path}")
            contact_href=sub.locator(".navigation .contact").get_attribute("href")
            if route=="contact":
                if contact_href!="#contact-methods":
                    failures.append(f"{name}: Contact's Let's talk should focus contact methods")
            else:
                if sub.locator(".navigation .contact").evaluate("el=>new URL(el.href).pathname")!="/contact/":
                    failures.append(f"{name}: Skills Let's talk does not reach Contact")
            sub.close()

        if js_errors:failures.append(f"{name}: JS errors {js_errors}")
        records.append({"device":name,"width":w,"height":h,"overflow":overflow,"errors":js_errors})
        print(f"VERIFIED {name} {w}x{h}: bio, education, fixed chrome, section links and responsive layout")
        context.close()

    nojs=browser.new_context(viewport={"width":390,"height":844},java_script_enabled=False)
    page=nojs.new_page()
    page.goto(BASE+"/profile/",wait_until="domcontentloaded")
    if page.locator(".personal-copy").count()!=1 or page.locator(".education-card").count()!=2:
        failures.append("Without JavaScript, profile story or education missing")
    nojs.close()
    reduced=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
    page=reduced.new_page()
    page.goto(BASE+"/profile/",wait_until="domcontentloaded")
    if page.locator(".profile-intro").evaluate("el=>getComputedStyle(el).opacity")=="0":
        failures.append("Reduced motion hides profile text")
    reduced.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"screens":records,"failures":failures},indent=2))
if failures:raise SystemExit("\n".join("FAIL "+f for f in failures))
print("PASS: Profile page matches approved design and preserves content.")
