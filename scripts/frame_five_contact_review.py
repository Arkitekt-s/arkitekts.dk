#!/usr/bin/env python3
"""Check all five cinematic scenes, the dark gallery-to-contact transition,
and a *moving geographic globe* in Chromium at four viewport sizes.
This test never modifies any approved source baseline.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots"/"frame-five-contact"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/concepts/frame-five-contact/"
SIZES={"small-phone":(320,720),"phone":(390,844),"tablet":(768,1024),"desktop":(1440,900)}
errors=[]
records=[]
def wheel(page,count):
    for _ in range(count):page.mouse.wheel(0,160)
def wait(page,p):
    page.wait_for_function(f"parseFloat(document.body.dataset.journeyProgress||0)>{p}",timeout=8000)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for name,(w,h) in SIZES.items():
        ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        page=ctx.new_page()
        crashes=[]
        page.on("pageerror",lambda error:crashes.append(str(error)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        if response.status!=200:errors.append(f"{name}: HTTP {response.status}")
        if page.locator("#panorama .arch").count()!=3:errors.append(f"{name}: approved arches changed")
        if page.locator("#portal-current").inner_text().strip()!="01":
            errors.append(f"{name}: section counter must start at 01")
        if not page.locator("#next-chapter").evaluate("e=>e.classList.contains('is-scroll-invite')"):
            errors.append(f"{name}: section 01 is missing the animated down-arrow cue")
        if page.locator(".twenty-piece").count()!=9:errors.append(f"{name}: number 10 lost a piece")
        if page.locator(".gallery-photo").count()!=7:errors.append(f"{name}: approved gallery missing")
        if page.locator("#frame-five-contact").get_attribute("aria-hidden")!="true":
            errors.append(f"{name}: contact appeared before Frame 05")
        head=page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top")
        foot=page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")
        page.screenshot(path=str(OUT/f"{name}-01-landing.png"),animations="allow")

        # Only Scene 01 uses Silver Glass. Scenes 02–05 use native cursors.
        # Mouse movement must never tilt, zoom or hold the landscape.
        if page.locator("#pointer-pattern").count()!=1:
            errors.append(f"{name}: cursor-light canvas missing")
        scene=page.locator("#panorama")
        initial_pan=scene.evaluate("e=>[e.style.getPropertyValue('--pan-x'),e.style.getPropertyValue('--tilt-y')]")
        # Validate the approved Silver Glass interaction, not the old
        # magenta smoke. Video and elastic arch geometry must not change.
        if not page.locator("body").evaluate("e=>e.classList.contains('paint-cursor-active')"):
            errors.append(f"{name}: white cursor missing in scene 01")
        if page.locator(".paint-cursor").count()!=1:
            errors.append(f"{name}: white cursor shell missing")
        dot=page.locator(".paint-cursor-core")
        if dot.count()!=1:
            errors.append(f"{name}: white cursor core missing")
        else:
            if dot.evaluate("e=>getComputedStyle(e).backgroundColor")!="rgb(255, 255, 255)":
                errors.append(f"{name}: cursor is not white")
            if dot.evaluate("e=>getComputedStyle(e).borderRadius") not in ("50%","4.5px"):
                errors.append(f"{name}: cursor is not round")
            page.mouse.move(2,h*.44,steps=4)
            page.wait_for_timeout(260)
            resting_scale=dot.evaluate(
                "e=>parseFloat(e.style.getPropertyValue('--cursor-scale'))")
            wordmark=page.locator(".site-header .site-name")
            wordmark.hover(force=True)
            page.wait_for_timeout(260)
            heading_scale=dot.evaluate(
                "e=>parseFloat(e.style.getPropertyValue('--cursor-scale'))")
            if not 1.48<=heading_scale<=1.83 or heading_scale-resting_scale<.38:
                errors.append(f"{name}: cursor hover should stay modest ({resting_scale},{heading_scale})")
        arch_middle=page.locator("#panorama .arch").nth(1)
        region=arch_middle.bounding_box()
        if region:
            mx=region["x"]+region["width"]*.50
            my=region["y"]+region["height"]*.55
            page.mouse.move(mx,my,steps=12)
            page.wait_for_timeout(380)
            lens=arch_middle.locator(".arch-color-lens")
            glass_inside=page.locator("body").get_attribute("data-arch-glass-inside")
            lens_opacity=lens.evaluate("e=>parseFloat(getComputedStyle(e).opacity)")
            filter_text=lens.evaluate("e=>getComputedStyle(e).backdropFilter")
            if glass_inside!="true" or lens_opacity<.68:
                errors.append(f"{name}: Silver Glass did not activate ({glass_inside},{lens_opacity})")
            if "brightness" not in filter_text or "hue-rotate" in filter_text:
                errors.append(f"{name}: lens recolors video instead of preserving natural tones")
            if page.locator("#pointer-pattern").get_attribute("data-ambient-active")!="false":
                errors.append(f"{name}: violet smoke still active in Silver Glass")
            page.mouse.move(2,2,steps=5)
            page.wait_for_timeout(950)
            if lens.evaluate("e=>parseFloat(getComputedStyle(e).opacity)")>.035:
                errors.append(f"{name}: glass lens did not fade on mouse exit")
            if page.locator("body").get_attribute("data-arch-glass-inside")!="false":
                errors.append(f"{name}: cursor did not leave the arch")
        page.mouse.down()
        page.wait_for_timeout(120)
        if page.locator("body").evaluate("e=>e.classList.contains('is-holding')"):
            errors.append(f"{name}: press and hold still zooms the landscape")
        page.mouse.up()
        # Desktop: each real press-and-hold triggers exactly ONE new art world.
        # 00 mountain → 01 tidal ink → 02 liquid aurora → 00 mountain.
        # The liquid wipe must finish before another hold is counted.
        if name=="desktop":
            control=page.locator("#hold-scene-control")
            if control.count()!=1:
                errors.append("desktop: press-and-hold scene control missing")
            else:
                for expected in (1,2,0):
                    page.mouse.move(w*.62,h*.63)
                    page.mouse.down()
                    page.wait_for_timeout(410)
                    page.mouse.up()
                    page.wait_for_function(
                        "(v)=>document.getElementById('panorama')?.dataset.artScene===String(v)",
                        arg=expected, timeout=2500)
                    page.wait_for_timeout(950)
                    if page.locator("#panorama .hold-scene-paint").count()!=3:
                        errors.append("desktop: cinematic artwork not present in all three arches")
                    if expected in (1,2):
                        selected_url=page.locator("#hold-scene-film").get_attribute("src") or ""
                        if "videos.pexels.com/video-files/" not in selected_url:
                            errors.append(f"desktop: scene {expected} is not photographic video")
                # Select the ocean again and confirm it follows through
                # the entire scroll-controlled editorial journey.
                page.mouse.move(w*.62,h*.63)
                page.mouse.down()
                page.wait_for_timeout(410)
                page.mouse.up()
                page.wait_for_function(
                    "document.getElementById('panorama')?.dataset.artScene==='1'",
                    timeout=2500)
                page.wait_for_timeout(900)
        after_pan=scene.evaluate("e=>[e.style.getPropertyValue('--pan-x'),e.style.getPropertyValue('--tilt-y')]")
        if after_pan!=initial_pan:
            errors.append(f"{name}: moving the mouse still changes the landscape")
        # The new silhouette bends in/out WITHOUT translating the rigid arch.
        # An always-present REST mask avoids jumping on first contact.
        if page.evaluate("matchMedia('(hover: hover) and (pointer: fine)').matches"):
            import re, math
            arch=page.locator("#panorama .arch").first
            region=arch.bounding_box()
            if region:
                mask=page.locator("#elastic-arch-0 path")
                def points():
                    return [(float(x),float(y)) for x,y in re.findall(
                        r"[ML]([0-9.]+) ([0-9.]+)",mask.get_attribute("d") or "")]
                def shift(before,after):
                    if not before or len(before)!=len(after):return -1
                    return max(math.hypot((x-u)*region["width"],(y-v)*region["height"])
                               for (x,y),(u,v) in zip(before,after))
                page.mouse.move(2,2,steps=5)
                page.wait_for_timeout(900)
                rest=points()
                page.mouse.move(region["x"]+region["width"]*.77,
                                region["y"]+region["height"]*.30,steps=8)
                page.wait_for_timeout(370)
                bent=points()
                distortion=shift(rest,bent)
                if distortion<6 or distortion>54:
                    errors.append(f"{name}: arch did not flex enough without tearing ({distortion:.1f}px)")
                if "elastic-arch-0" not in arch.evaluate("e=>e.style.clipPath"):
                    errors.append(f"{name}: new arch silhouette mask missing")
                if arch.evaluate("e=>e.style.getPropertyValue('--arch-x')"):
                    errors.append(f"{name}: rigid arch translation reappeared")
                page.mouse.move(2,2,steps=5)
                page.wait_for_timeout(1100)
                returned=points()
                residual=shift(rest,returned)
                if residual<0 or residual>1.3:
                    errors.append(f"{name}: arch contour did not restore ({residual:.1f}px)")
        page.mouse.move(w*.58,h*.49)
        # 01–03 now have deliberately longer scroll travel.
        wheel(page,7);wait(page,.995)
        if page.locator("#portal-current").inner_text().strip()!="02":
            errors.append(f"{name}: section counter did not reach 02")
        if name=="desktop" and page.locator("#panorama").get_attribute("data-art-scene")!="1":
            errors.append("desktop: selected ocean animation lost entering Section 02")
        if name=="desktop" and "853862" not in (page.locator("#hold-scene-film").get_attribute("src") or ""):
            errors.append("desktop: ocean video lost from Section 02 full-screen film")
        # Once the arches become one film, masks must not separate.
        if page.evaluate("matchMedia('(hover: hover) and (pointer: fine)').matches"):
            opened_arch=page.locator("#panorama .arch").first
            opened_x=opened_arch.evaluate("e=>parseFloat(e.style.getPropertyValue('--arch-x')||'0')")
            if abs(opened_x)>.6:
                errors.append(f"{name}: arch displacement survived full-screen expansion ({opened_x})")
        if page.locator("#next-chapter").evaluate("e=>e.classList.contains('is-scroll-invite')"):
            errors.append(f"{name}: section 01 arrow cue did not disappear in section 02")
        if page.locator("#chapter-two").get_attribute("aria-hidden")!="false":
            errors.append(f"{name}: Frame 02 copy not visible")
        # Frames 02–05 must use the browser's normal pointer.
        page.mouse.move(w*.42,h*.37,steps=5)
        page.wait_for_timeout(120)
        if page.locator("body").evaluate("e=>e.classList.contains('paint-cursor-active')"):
            errors.append(f"{name}: Silver Glass cursor persists in Frame 02")
        if page.locator(".paint-cursor").evaluate("e=>getComputedStyle(e).display")!="none":
            errors.append(f"{name}: custom cursor visible in Frame 02")
        if page.locator("#pointer-pattern").get_attribute("data-ambient-active")!="false":
            errors.append(f"{name}: painter effect persists in Frame 02")
        wheel(page,7);wait(page,1.995)
        if page.locator("#portal-current").inner_text().strip()!="03":
            errors.append(f"{name}: section counter did not reach 03")
        if name=="desktop" and page.locator("#panorama").get_attribute("data-art-scene")!="1":
            errors.append("desktop: selected ocean animation lost entering Section 03")
        if name=="desktop" and "853862" not in (page.locator("#hold-scene-film").get_attribute("src") or ""):
            errors.append("desktop: ocean video lost from Section 03 full-screen film")
        if page.locator("#chapter-three").get_attribute("aria-hidden")!="false":
            errors.append(f"{name}: Frame 03 not visible")
        page.mouse.move(w*.68,h*.44,steps=5)
        page.wait_for_timeout(120)
        if page.locator("body").evaluate("e=>e.classList.contains('paint-cursor-active')"):
            errors.append(f"{name}: Silver Glass cursor persists in Frame 03")
        if page.locator(".paint-cursor").evaluate("e=>getComputedStyle(e).display")!="none":
            errors.append(f"{name}: custom cursor visible in Frame 03")
        if page.locator("#pointer-pattern").get_attribute("data-ambient-active")!="false":
            errors.append(f"{name}: painter effect persists in Frame 03")
        if page.locator(".twenty-piece").first.evaluate("e=>getComputedStyle(e).animationName")!="none":
            errors.append(f"{name}: 10 auto-animates before hover")
        # Reverse interaction: scattered before hover, assembled on entry,
        # and scattered again after leaving, on every responsive viewport.
        ten=page.locator("#twenty-hotspot")
        pieces=page.locator(".twenty-piece")
        if any(value.strip()!="10" for value in pieces.locator("text").all_text_contents()):
            errors.append(f"{name}: number is not 10")
        first=pieces.first
        # The pointer may already be inside the hotspot after scrolling
        # into Frame 03. Move outside to inspect the true resting state.
        page.mouse.move(1,1)
        page.wait_for_timeout(50)
        scatter=first.evaluate("e=>parseFloat(e.style.getPropertyValue('--offset-x'))")
        ten.hover(force=True)
        assembled=first.evaluate("e=>parseFloat(e.style.getPropertyValue('--offset-x'))")
        page.mouse.move(1,1)
        scattered_again=first.evaluate("e=>parseFloat(e.style.getPropertyValue('--offset-x'))")
        if abs(scatter)<1 or abs(assembled)>.05 or abs(scattered_again)<1:
            errors.append(f"{name}: reversed hover failed ({scatter},{assembled},{scattered_again})")
        wheel(page,5);wait(page,2.995)
        page.wait_for_timeout(280)
        if page.locator("body").evaluate("e=>e.classList.contains('paint-cursor-active')"):
            errors.append(f"{name}: browser cursor did not return in Frame 04")
        if page.locator(".paint-cursor").evaluate("e=>getComputedStyle(e).opacity")!="0":
            errors.append(f"{name}: custom cursor visible in Frame 04")
        if page.locator("#pointer-pattern").get_attribute("data-ambient-active")!="false":
            errors.append(f"{name}: paint remains active in Frame 04")
        if page.locator("#portal-current").inner_text().strip()!="04":
            errors.append(f"{name}: section counter did not reach 04")
        gallery=page.locator("#frame-four-gallery")
        if gallery.get_attribute("aria-hidden")!="false":
            errors.append(f"{name}: Frame 04 photo gallery missing")
        # Frame 04 must first present photo 01, including its counter.
        if float(page.locator("body").get_attribute("data-gallery-index") or -1)>0.03:
            errors.append(f"{name}: gallery does not begin at photo 01")
        if page.locator("#gallery-count").inner_text().strip()!="01":
            errors.append(f"{name}: gallery counter does not start at 01")
        if not page.locator("#gallery-prev").is_disabled():
            errors.append(f"{name}: gallery previous arrow should start disabled")
        page.screenshot(path=str(OUT/f"{name}-04-first-photo.png"),animations="allow")

        for selector in (".supporting-line",".chapter-kicker",".chapter-footnote",
                         ".gallery-kicker","#gallery-back",".gallery-caption","#contact-back"):
            if page.locator(selector).count():
                errors.append(f"{name}: unwanted content still present: {selector}")
        # One downward gesture triggers an automatic visual trip through
        # the remaining photographs, pausing on the dark final picture,
        # and only THEN crossfading to the contact globe.
        page.mouse.wheel(0,160)
        page.wait_for_function("document.body.dataset.galleryAutoExit==='moving'",timeout=4000)
        page.wait_for_function("document.body.dataset.galleryAutoPhoto==='04'",timeout=7000)
        # The gallery is still on-screen halfway through the sequence.
        if float(page.locator("body").get_attribute("data-journey-progress") or 0)>3.05:
            errors.append(f"{name}: Frame 05 appeared before photo 04")
        page.wait_for_function("parseFloat(document.body.dataset.galleryIndex||0)>5.98",timeout=10000)
        if float(page.locator("body").get_attribute("data-gallery-darkness") or 0)<.98:
            errors.append(f"{name}: last gallery picture did not darken background")
        if float(page.locator("body").get_attribute("data-journey-progress") or 0)>3.05:
            errors.append(f"{name}: Frame 05 appeared before last photo")
        page.screenshot(path=str(OUT/f"{name}-04-dark-gallery-end.png"),animations="allow")
        page.wait_for_function("document.body.dataset.galleryAutoExit==='complete'",timeout=7000)
        wait(page,3.995)
        if page.locator("#portal-current").inner_text().strip()!="05":
            errors.append(f"{name}: section counter did not reach 05")
        if page.locator("body").evaluate("e=>e.classList.contains('paint-cursor-active')"):
            errors.append(f"{name}: custom cursor active in Frame 05")
        if not page.locator(".portal-navigation").is_visible():
            errors.append(f"{name}: navigation disappeared in final section")
        contact=page.locator("#frame-five-contact")
        if contact.get_attribute("aria-hidden")!="false" or not contact.is_visible():
            errors.append(f"{name}: final contact not visible")
        if page.locator("body").get_attribute("data-current-frame")!="5":
            errors.append(f"{name}: currentFrame should be 5")
        if page.locator(".frame-five-contact .contact-email").get_attribute("href") != "mailto:sohe@arkitekts.dk?subject=Let%27s%20work%20together":
            errors.append(f"{name}: contact email href missing")
        if page.locator("#copenhagen-globe").count()!=1:
            errors.append(f"{name}: 3D globe canvas missing")
        page.wait_for_function("document.body.dataset.globeReady==='true'",timeout=10000)
        page.wait_for_function("parseInt(document.body.dataset.globeFrames||0)>3",timeout=7000)
        if page.locator("#globe-shell").get_attribute("data-geography")!="natural-earth":
            errors.append(f"{name}: self-hosted geographic dataset not loaded")
        if page.locator("body").get_attribute("data-copenhagen-visible")!="true":
            errors.append(f"{name}: Copenhagen marker not visible on arrival")
        label=page.locator("#globe-location")
        if not label.is_visible():errors.append(f"{name}: Copenhagen label missing")
        rect=page.locator("#globe-shell").bounding_box()
        title=page.locator(".contact-heading").bounding_box()
        if not rect or rect["width"]<160 or rect["x"]<-5 or rect["x"]+rect["width"]>w+5:
            errors.append(f"{name}: globe clipped: {rect}")
        if not title or title["x"]<-5 or title["x"]+title["width"]>w+5:
            errors.append(f"{name}: contact headline clipped: {title}")
        for selector in (".contact-eyebrow","#globe-recenter",".contact-signoff"):
            if page.locator(selector).count():
                errors.append(f"{name}: removed Frame 05 content still exists: {selector}")
        if rect:
            radius=float(page.locator("#globe-shell").get_attribute("data-radius") or 0)
            if radius < rect["width"]*.412:
                errors.append(f"{name}: globe drawing radius did not increase")
            if name=="desktop" and rect["width"]<620:
                errors.append(f"{name}: desktop globe too small: {rect['width']}")
            if name=="tablet" and rect["width"]<490:
                errors.append(f"{name}: tablet globe too small: {rect['width']}")
        page.screenshot(path=str(OUT/f"{name}-05-copenhagen-globe.png"),animations="allow")
        # Regression: the last gallery gradient and contact gradient must
        # match exactly. The globe must have no shell halo or opaque canvas fill.
        transparency=page.evaluate("""() => {
            const gallery=getComputedStyle(document.querySelector(".frame-four-backdrop"),"::after").backgroundImage;
            const contact=getComputedStyle(document.querySelector(".frame-five-backdrop")).backgroundImage;
            const shell=document.querySelector("#globe-shell");
            const cs=getComputedStyle(shell);
            const pseudo=getComputedStyle(shell,"::before");
            const canvas=document.querySelector("#copenhagen-globe");
            const ctx=canvas.getContext("2d");
            const w=canvas.width,h=canvas.height;
            const pixel=(x,y)=>ctx.getImageData(Math.round(x),Math.round(y),1,1).data[3];
            let opaque=0,count=0;
            for(let row=-6;row<=6;row++){
                for(let col=-6;col<=6;col++){
                    const x=w/2+col*(w*.385*.7/6);
                    const y=h/2+row*(h*.385*.7/6);
                    if(Math.hypot(col,row)>6)continue;
                    if(pixel(x,y)>245)opaque++;
                    count++;
                }
            }
            return {
                gradientMatched:gallery===contact,
                shellTransparent:cs.backgroundColor==="rgba(0, 0, 0, 0)"||cs.backgroundColor==="transparent",
                pseudoGone:pseudo.content==="none"||pseudo.display==="none",
                noOutsideGlow:pixel(w*.95,h*.5)===0,
                opaqueRatio:opaque/count
            };
        }""")
        if not transparency["gradientMatched"]:
            errors.append(f"{name}: Frame 04 ending and Frame 05 gradient differ")
        if not transparency["shellTransparent"] or not transparency["pseudoGone"]:
            errors.append(f"{name}: globe shell still paints a glow or background")
        if not transparency["noOutsideGlow"] or transparency["opaqueRatio"]>.25:
            errors.append(f"{name}: globe canvas is not transparent ({transparency})")


        # Globe must rotate slowly by itself and respond to direct manipulation.
        before=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
        page.wait_for_timeout(950)
        after=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
        if abs(after-before)<.009:errors.append(f"{name}: globe rotation is too slow ({before}->{after})")
        if rect:
            x=rect["x"]+rect["width"]*.48
            y=rect["y"]+rect["height"]*.51
            page.mouse.move(x,y)
            page.mouse.down()
            page.mouse.move(x+min(115,rect["width"]*.33),y+min(35,rect["height"]*.07),steps=9)
            page.mouse.up()
            moved=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
            if abs(moved-after)<.22:errors.append(f"{name}: dragging globe did not change orientation ({after}->{moved})")
            page.screenshot(path=str(OUT/f"{name}-06-globe-dragged.png"),animations="allow")
            # Preserve internal centering without exposing a visible button.
            page.evaluate("window.soheilGlobe.center()")
            page.wait_for_timeout(80)
            reset=float(page.locator("body").get_attribute("data-globe-yaw") or 0)
            if abs(reset+12.5683*3.141592653589793/180)>.04:
                errors.append(f"{name}: reset failed ({reset})")
        # Approved chrome and page geometry must not move.
        if abs(page.locator(".site-header").evaluate("e=>e.getBoundingClientRect().top")-head)>1:
            errors.append(f"{name}: header moved")
        if abs(page.locator(".site-footer").evaluate("e=>e.getBoundingClientRect().bottom")-foot)>1:
            errors.append(f"{name}: footer moved")
        overflow=page.evaluate("document.documentElement.scrollWidth-innerWidth")
        if overflow>2:errors.append(f"{name}: horizontal overflow {overflow}")
        if crashes:errors.append(f"{name}: JS runtime errors {crashes}")
        # Back controls were intentionally removed. Scroll backward to the
        # gallery instead, which must retain its last-photo position.
        for _ in range(5):
            page.mouse.wheel(0,-160)
        page.wait_for_function("parseFloat(document.body.dataset.journeyProgress||4)<3.02",timeout=8000)
        if float(page.locator("body").get_attribute("data-gallery-index") or 0)<5.7:
            errors.append(f"{name}: returning to the gallery lost the last photo position")
        page.screenshot(path=str(OUT/f"{name}-07-return-gallery.png"),animations="allow")
        # Manual arrow controls must remain usable after returning.
        page.locator("#gallery-prev").click(timeout=1800)
        page.wait_for_function("parseFloat(document.body.dataset.galleryIndex||0)<5.1",timeout=5000)
        page.locator("#gallery-next").click(timeout=1800)
        page.wait_for_function("parseFloat(document.body.dataset.galleryIndex||0)>5.9",timeout=5000)

        # The last section's UP arrow should return through 04, 03, 02, 01,
        # rather than teleporting to the beginning. Check on every viewport.
        page.evaluate("document.activeElement?.blur()")
        page.keyboard.press("End")
        page.wait_for_function("parseFloat(document.body.dataset.journeyProgress||0)>3.995",timeout=8000)
        page.locator("#previous-chapter").click(timeout=2500)
        page.wait_for_function("document.body.dataset.returnTour==='active'",timeout=2200)
        for section in ("4","3","2","1"):
            page.wait_for_function(
                f"document.body.dataset.currentFrame==='{section}'",timeout=7500)
        page.wait_for_function("document.body.dataset.returnTour==='complete'",timeout=8500)
        if abs(float(page.locator("body").get_attribute("data-journey-progress") or 5))>.005:
            errors.append(f"{name}: return tour did not reach the intro")
        if not page.locator("#next-chapter").evaluate("e=>e.classList.contains('is-scroll-invite')"):
            errors.append(f"{name}: the invitation did not return in section 01")
        records.append({"screen":name,"size":[w,h],"globeDots":page.evaluate("window.soheilGlobe?.dotCount()"),
                        "firstYaw":before,"autoYaw":after,"overflow":overflow,"jsErrors":crashes})
        print(f"VERIFIED {name} {w}x{h}: five frames, self-hosted 3D globe, Copenhagen, slow rotation, drag, reset, scroll return")
        ctx.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"results":records,"errors":errors},indent=2))
if errors:raise SystemExit("\n".join("FAIL "+e for e in errors))
print("PASS: final globe, contact, mobile, dark gallery, all previous frames.")
