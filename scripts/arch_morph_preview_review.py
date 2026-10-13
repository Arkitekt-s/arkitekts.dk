#!/usr/bin/env python3
"""Browser-review real arch-morph paths, timeline, and mobile layout.

Uses a single clipped media layer. Screenshots are retained for review.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/arch-to-film"
OUT.mkdir(parents=True,exist_ok=True)
http=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=http.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%s/previews/arch-to-film/" % http.server_port
fails=[]
rows=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for device,w,h in [("small-phone",320,720),("phone",390,844),("tablet",768,1024),("desktop",1440,900)]:
        ctx=browser.new_context(viewport={"width":w,"height":h},reduced_motion="reduce")
        page=ctx.new_page()
        page.on("pageerror",lambda e: fails.append("JavaScript: %s" % str(e)))
        response=page.goto(URL,wait_until="domcontentloaded",timeout=20000)
        if response.status!=200:fails.append("%s: HTTP %s"%(device,response.status))
        if page.locator('meta[name=robots]').get_attribute("content")!="noindex,nofollow,noarchive":
            fails.append("Preview must not appear in Google")
        if page.locator("#film").count()!=1:fails.append("%s: expected one real video" % device)
        for mode in ("a","b","c"):
            page.locator(".choice[data-mode='%s']"%mode).click()
            for chapter,val in ((1,0),('transition',550),(2,1000),(3,2000)):
                page.locator("#scrub").evaluate("(el, val) => {el.value=String(val);el.dispatchEvent(new Event('input',{bubbles:true}));}",val)
                page.wait_for_timeout(90)
                item=page.evaluate("""() => ({
                  mode:document.querySelector('.choice[aria-pressed=true]')?.dataset.mode,
                  mask:document.getElementById('mask-shape').getAttribute('d'),
                  clip:getComputedStyle(document.getElementById('media')).clipPath,
                  label:document.getElementById('frame-indicator').textContent,
                  videoCount:document.querySelectorAll('.media video').length,
                  scroll:document.documentElement.scrollWidth,
                  width:innerWidth,
                  stageWidth:document.getElementById('stage').clientWidth
                })""")
                if item["mode"]!=mode:fails.append("%s mode mismatch %s"%(device,mode))
                if not item["mask"] or item["mask"].count("M")!=3:
                    fails.append("%s %s chapter %s: missing three separate arch paths"%(device,mode,chapter))
                if item["clip"]=="none":
                    fails.append("%s %s: actual media mask not applied"%(device,mode))
                if item["scroll"]>item["width"]+2:
                    fails.append("%s %s: overflow %s"%(device,mode,item["scroll"]))
                if item["videoCount"]!=1:fails.append("Duplicate video render layer")
                page.screenshot(path=str(OUT/("%s-%s-chapter-%s.png"%(device,mode,chapter))),animations="disabled",timeout=12000)
                rows.append({"device":device,"mode":mode,"chapter":chapter,"path":item["mask"][:110],"clip":item["clip"],"scroll":item["scroll"]})
            page.locator("#play-all").click()
            page.wait_for_timeout(100)
            if page.locator("#status").text_content().find("PLAYING")==-1:
                fails.append("%s %s: replay control does not play"%(device,mode))
            page.locator("#scrub").evaluate("(el) => {el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));}")
        for film in (0,1,2):
            page.locator("[data-video='%s']"%film).click()
            source=page.locator("#film").get_attribute("src") or ""
            if (str((18069232,25744122,18069165)[film]) not in source):
                fails.append("%s: wrong selected film %s"%(device,film))
        ctx.close()
    browser.close()
http.shutdown()
(OUT/"report.json").write_text(json.dumps({"tests":rows,"failures":fails},indent=2))
for error in fails:print("FAIL",error)
print("ARCH PREVIEWS: %d screen/option/checkpoint tests, %d failures"%(len(rows),len(fails)))
sys.exit(1 if fails else 0)
