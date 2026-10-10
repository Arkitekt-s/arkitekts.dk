#!/usr/bin/env python3
"""Six dedicated project pages: routes, content, working controls, and shared DNA."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"portfolio-details"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
CASES=[
 ("web-development","Web Development"),
 ("copenhagen-valuation","Machine Learning-Based Apartment Valuation"),
 ("full-stack-application","Full-Stack Application"),
 ("basecamp-response","Basecamp Response Monitor"),
 ("shopflow-mobile","ShopFlow Mobile"),
 ("camp-booking","CAMP Booking System")
]
MENU=["PORTFOLIO","PROFILE","SKILLS","GUIDES","Let's talk"]
LINKS=["/portfolio/","/profile/","/software-skills/","/technical-guides/","/contact/"]
errors=[]
report=[]
# Extra media appears only when the original WordPress import has completed.
MANIFEST_FILE=ROOT/"portfolio"/"media-manifest.json"
MEDIA=json.loads(MANIFEST_FILE.read_text("utf8"))["projects"] if MANIFEST_FILE.exists() else {}
if MEDIA:
    for slug,record in MEDIA.items():
        for asset in record["files"]:
            if not (ROOT/"portfolio"/asset["path"]).exists():
                errors.append(f"{slug}: archived original file missing: {asset['path']}")
            if asset["kind"]=="pdf":
                if not (ROOT/"portfolio"/asset["path"]).read_bytes().startswith(b"%PDF-"):
                    errors.append(f"{slug}: archived file is not a valid PDF")
                for image in asset.get("previews",[]):
                    if not (ROOT/"portfolio"/image).exists():
                        errors.append(f"{slug}: PDF preview missing: {image}")

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        ctx.grant_permissions(["clipboard-read","clipboard-write"],origin=BASE)
        listing=ctx.new_page()
        listing.goto(BASE+"/portfolio/",wait_until="domcontentloaded")
        listing.wait_for_function("document.body.dataset.portfolioReady==='true'",timeout=6000)
        for slug,title in CASES:
            card=listing.locator("#"+slug)
            if not card.locator(f'a.project-visual[href="{slug}/"]').count():
                errors.append(f"{name}: {slug} image is not linked to project page")
            if not card.locator(f'h3 a[href="{slug}/"]').count():
                errors.append(f"{name}: {slug} heading not linked to project")
            if not card.locator(f'a.project-open[href="{slug}/"]').count():
                errors.append(f"{name}: {slug} main action not linked")

        # Test the actual click from the Portfolio listing into a case study.
        image_link=listing.locator("#basecamp-response a.project-visual")
        image_link.click()
        listing.wait_for_url("**/portfolio/basecamp-response/",timeout=6000)
        if listing.locator("h1").inner_text().strip(" \n.")!="Basecamp Response Monitor":
            errors.append(f"{name}: clicking portfolio card reached wrong destination")
        listing.close()
        # Ordinary clicks on the project summary must also open that project.
        card_click=ctx.new_page()
        card_click.goto(BASE+"/portfolio/",wait_until="domcontentloaded")
        card_click.wait_for_function("document.body.dataset.portfolioReady==='true'",timeout=5000)
        card_click.locator("#camp-booking .project-summary").click()
        card_click.wait_for_url("**/portfolio/camp-booking/",timeout=6000)
        if "CAMP Booking System" not in card_click.locator("h1").inner_text():
            errors.append(f"{name}: clicking project summary did not open its full page")
        card_click.close()

        for i,(slug,title) in enumerate(CASES):
            page=ctx.new_page()
            js_errors=[]
            page.on("pageerror",lambda e:js_errors.append(str(e)))
            route=f"/portfolio/{slug}/"
            response=page.goto(BASE+route,wait_until="domcontentloaded",timeout=25000)
            if response.status!=200:errors.append(f"{name}: {slug} returned {response.status}")
            page.wait_for_function("document.body.dataset.caseReady==='true'",timeout=5000)
            if page.locator("h1").count()!=1:errors.append(f"{name}: {slug} should have one h1")
            if page.locator("h1").inner_text().replace("\n"," ").rstrip(". ")!=title:
                errors.append(f"{name}: {slug} has wrong project title")
            if page.locator(".case-main-paragraph").count()!=2:
                errors.append(f"{name}: {slug} missing challenge or outcome")
            if page.locator(".case-steps .case-step").count()!=3:
                errors.append(f"{name}: {slug} missing original project work steps")
            if not page.locator(".case-stack li").count():
                errors.append(f"{name}: {slug} missing technology stack")
            if page.locator(".case-resource-links a").count()<1:
                errors.append(f"{name}: {slug} missing original project link")
            external=page.locator(".case-resource-links a").first.get_attribute("href")
            if not external.startswith("https://arkitekts.dk/portfolio/"):
                errors.append(f"{name}: {slug} original project reference missing")
            if page.locator(".navigation a").all_inner_texts()!=MENU:
                errors.append(f"{name}: {slug} navigation differs from approved DNA")
            for n,expected in enumerate(LINKS):
                dest=page.locator(".navigation a").nth(n).evaluate("el=>new URL(el.href).pathname")
                if dest!=expected:errors.append(f"{name}: {slug} nav link {n} wrong: {dest}")
            for sel in (".site-name",".footer-specialties",".footer-location"):
                if page.locator(sel).count()!=1:
                    errors.append(f"{name}: {slug} missing shared {sel}")
            head=page.locator(".site-header").bounding_box()
            foot=page.locator(".site-footer").bounding_box()
            header_expected=73 if w<=760 else 100
            footer_expected=65 if w<=760 else 80
            if not head or abs(head["y"])>1 or abs(head["height"]-header_expected)>1:
                errors.append(f"{name}: {slug} header changed {head}")
            if not foot or abs(foot["y"]+foot["height"]-h)>1 or abs(foot["height"]-footer_expected)>1:
                errors.append(f"{name}: {slug} footer changed {foot}")
            overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
            if overflow>2:errors.append(f"{name}: {slug} horizontal overflow {overflow}")
            heading=page.locator("h1").bounding_box()
            if not heading or heading["x"]<-3 or heading["x"]+heading["width"]>w+3:
                errors.append(f"{name}: {slug} clipped heading {heading}")
            if not page.locator(f'a.case-related-next[href="../{CASES[(i+1)%6][0]}/"]').count():
                errors.append(f"{name}: {slug} next project link missing")
            if not page.locator(f'a.case-related-prev[href="../{CASES[(i-1)%6][0]}/"]').count():
                errors.append(f"{name}: {slug} previous project link missing")
            if not page.locator('a.case-return[href="../"]').count():
                errors.append(f"{name}: {slug} back to portfolio missing")

            cover=page.locator(".case-cover")
            cover.scroll_into_view_if_needed()
            img=cover.locator("img")
            if slug=="full-stack-application":
                if not cover.locator(".case-app").count():
                    errors.append(f"{name}: {slug} conceptual UI absent")
            else:
                if img.count()!=1:
                    errors.append(f"{name}: {slug} missing original screenshot")
                else:
                    img.evaluate("e=>e.loading='eager'")
                    page.wait_for_function(
                        "()=>document.querySelector('.case-cover img')?.complete",timeout=7000
                    )
                    natural=img.evaluate("e=>({w:e.naturalWidth,h:e.naturalHeight,src:e.getAttribute('src')})")
                    if natural["w"]<200 or natural["h"]<200 or not natural["src"].startswith("../assets/"):
                        errors.append(f"{name}: {slug} local image broken {natural}")
            if slug=="basecamp-response":
                original_source="https://arkitekts.dk/portfolio/basecamp-customer-response-monitor/"
                if page.locator(f'.case-resource-links a[href="{original_source}"]').count()!=1:
                    errors.append(f"{name}: Basecamp source case study link missing")
                if page.locator(f'.basecamp-original-story a[href="{original_source}"]').count()!=1:
                    errors.append(f"{name}: Basecamp original project shortcut missing")
                if page.locator('.basecamp-cover-link[href="../assets/basecamp-response.webp"]').count()!=1:
                    errors.append(f"{name}: Original Basecamp application screenshot cannot open full size")
                if page.locator(".basecamp-sprints>div").count()!=2:
                    errors.append(f"{name}: Basecamp original Scrum timeline missing")
                timeline=page.locator(".basecamp-delivery").inner_text()
                for term in ("15 JUL", "15 SEP", "15 JAN 2024"):
                    if term not in timeline:errors.append(f"{name}: missing Basecamp milestone {term}")
                full_text=page.locator("main").inner_text()
                for term in ("UrgencyBot","Bitbucket","Node.js","Slack","Basecamp"):
                    if term not in full_text:errors.append(f"{name}: original project detail missing {term}")
                logo=page.locator(".basecamp-original-brand img")
                if logo.count()!=1:
                    errors.append(f"{name}: original TwentyFour logo missing")
                else:
                    logo.scroll_into_view_if_needed()
                    logo.evaluate("e=>e.loading='eager'")
                    logo.evaluate("e=>e.complete||new Promise(done=>{e.addEventListener('load',done,{once:true});e.addEventListener('error',done,{once:true})})")
                    value=logo.evaluate("e=>({w:e.naturalWidth,h:e.naturalHeight,src:e.getAttribute('src')})")
                    if value["w"]<400 or value["h"]<400 or value["src"]!="../assets/original/basecamp-response/twentyfour-brand.webp":
                        errors.append(f"{name}: Original TwentyFour logo failed: {value}")
                    page.screenshot(path=str(OUT/f"{name}-basecamp-original.png"),animations="disabled")
            original_gallery={"web-development":1,"copenhagen-valuation":2}.get(slug,0)
            gallery=page.locator(".case-gallery img")
            if gallery.count()!=original_gallery:
                errors.append(f"{name}: {slug} original project gallery mismatch")
            for gallery_image in gallery.all():
                gallery_image.scroll_into_view_if_needed(timeout=7000)
                gallery_image.evaluate("img=>img.loading='eager'")
                page.wait_for_function(
                  "()=>[...document.querySelectorAll('.case-gallery img')].every(img=>img.complete)",
                  timeout=7000
                )
                image_info=gallery_image.evaluate("e=>({w:e.naturalWidth,h:e.naturalHeight})")
                if image_info["w"]<400 or image_info["h"]<300:
                    errors.append(f"{name}: {slug} original gallery image broken {image_info}")
            if MEDIA:
                originals=MEDIA.get(slug,{}).get("files",[])
                archived_images=[x for x in originals if x["kind"]=="image"]
                archived_pdfs=[x for x in originals if x["kind"]=="pdf"]
                if (archived_images or archived_pdfs) and page.locator(".original-media-archive").count()!=1:
                    errors.append(f"{name}: {slug} missing original media archive section")
                if page.locator(".original-media-photo img").count()!=len(archived_images):
                    errors.append(f"{name}: {slug} imported photos not connected to project page")
                if page.locator(".original-pdf-file").count()!=len(archived_pdfs):
                    errors.append(f"{name}: {slug} original PDF not connected")
                for original_img in page.locator(".original-media-photo img").all():
                    original_img.scroll_into_view_if_needed(timeout=7000)
                    original_img.evaluate("e=>e.loading='eager'")
                    original_img.evaluate("e=>e.complete||new Promise(r=>{e.addEventListener('load',r,{once:true});e.addEventListener('error',r,{once:true})})")
                    data=original_img.evaluate("e=>({w:e.naturalWidth,h:e.naturalHeight})")
                    if data["w"]<230 or data["h"]<175:
                        errors.append(f"{name}: {slug} imported image is broken: {data}")
                if archived_pdfs:
                    if not page.locator('.original-pdf-links a[download]').count():
                        errors.append(f"{name}: {slug} PDF download button missing")
                    first_preview=page.locator(".original-pdf-preview img").first
                    first_preview.scroll_into_view_if_needed(timeout=7000)
                    first_preview.evaluate("e=>e.loading='eager'")
                    first_preview.evaluate("e=>e.complete||new Promise(r=>{e.addEventListener('load',r,{once:true});e.addEventListener('error',r,{once:true})})")
                    if first_preview.evaluate("e=>e.naturalWidth")<200:
                        errors.append(f"{name}: {slug} PDF preview not visible")
                if archived_images or archived_pdfs:
                    page.screenshot(path=str(OUT/f"{name}-{slug}-original-media.png"),animations="disabled")
            page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
            page.screenshot(path=str(OUT/f"{name}-{slug}-top.png"),animations="disabled")

            if w<=760 and i==0:
                menu=page.locator("#menu-button")
                menu.click()
                if menu.get_attribute("aria-expanded")!="true":
                    errors.append(f"{name}: {slug} mobile menu fails open")
                page.keyboard.press("Escape")
                if menu.get_attribute("aria-expanded")!="false":
                    errors.append(f"{name}: {slug} mobile menu fails closed")

            if i==0:
                # Real link copy, not decorative JS.
                page.locator("#case-copy").click()
                page.wait_for_function(
                    "document.querySelector('#case-copy')?.dataset.copied==='true'",timeout=6000
                )
                copied=page.evaluate("navigator.clipboard.readText()")
                if copied!=BASE+route:errors.append(f"{name}: copy project link wrong: {copied}")
                page.locator('.case-chapters a[href="#approach"]').click()
                page.wait_for_function("location.hash==='#approach'",timeout=6000)
                page.wait_for_function("document.activeElement?.id==='approach'",timeout=6000)
                if page.locator('.case-chapters a[href="#approach"]').get_attribute("aria-current")!="location":
                    errors.append(f"{name}: active chapter did not update")
            if js_errors:errors.append(f"{name}: {slug} JavaScript errors {js_errors}")
            report.append({"device":name,"slug":slug,"overflow":overflow,"jsErrors":js_errors})
            page.close()
        print(f"VERIFIED {name} {w}x{h}: all six case pages, full navigation, image and controls")
        ctx.close()

    # Core writing and original links stay readable without JavaScript.
    nojs=browser.new_context(viewport={"width":390,"height":844},java_script_enabled=False)
    for slug,title in CASES:
        page=nojs.new_page()
        page.goto(BASE+f"/portfolio/{slug}/",wait_until="domcontentloaded")
        if page.locator(".case-steps li").count()!=3:
            errors.append(f"no JS: {slug} loses meaningful content")
        page.close()
    nojs.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":report,"errors":errors},indent=2))
if errors:raise SystemExit("\n".join("FAIL "+e for e in errors))
print("PASS: six standalone project pages, links, copy, mobile and content.")
