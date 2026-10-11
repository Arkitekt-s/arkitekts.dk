#!/usr/bin/env python3
"""Visual smoke checks for the private motion studies; never touches production."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json, sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/transition-studies"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f"http://127.0.0.1:{server.server_port}/previews/transitions/"
issues=[]
records=[]
with sync_playwright() as play:
    browser=play.chromium.launch(headless=True)
    for name,w,h in [("small-phone",320,720),("phone",390,844),("tablet",768,1024),("desktop",1440,900)]:
        context=browser.new_context(viewport={"width":w,"height":h},reduced_motion="no-preference")
        page=context.new_page()
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        res=page.goto(BASE,wait_until="domcontentloaded")
        page.wait_for_timeout(300)
        if res.status!=200:issues.append(f"{name}: HTTP {res.status}")
        if page.locator("button.choice").count()!=3:issues.append(f"{name}: missing concept choices")
        if page.locator('meta[name="robots"]').get_attribute("content")!="noindex,nofollow,noarchive":
            issues.append(f"{name}: preview must be noindex")
        for mode,kind,expected in [("a","12","2"),("b","23","3"),("c","12","2")]:
            page.locator(f'button.choice[data-mode="{mode}"]').click()
            page.locator("#replay-"+kind).click()
            page.wait_for_timeout(2220)
            scene=page.locator("#stage").get_attribute("data-scene")
            if scene!=expected:issues.append(f"{name}, mode {mode}, {kind}: ended in {scene}, not {expected}")
            if page.locator(f'button.choice[data-mode="{mode}"]').get_attribute("aria-pressed")!="true":
                issues.append(f"{name}, mode {mode}: selection state missing")
            page.screenshot(path=str(OUT/f"{mode}-{name}.png"),animations="disabled")
            geo=page.evaluate("({vw:innerWidth,sw:document.documentElement.scrollWidth})")
            if geo["sw"]>geo["vw"]+2:
                issues.append(f"{name}, mode {mode}: horizontal page overflow {geo}")
            records.append({"device":name,"mode":mode,"scene":scene,**geo})
        if errors:issues.append(f"{name}: JavaScript errors: {errors[:3]}")
        context.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"issues":issues,"records":records},indent=2))
print("PREVIEW TESTS",len(records),"ERRORS",len(issues))
for issue in issues: print("FAIL",issue)
sys.exit(1 if issues else 0)
