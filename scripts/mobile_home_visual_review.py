#!/usr/bin/env python3
"""Mobile homepage art-direction review: screenshot each of all five live scenes."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
import json
import sys

from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/homepage-mobile-art-direction"
OUT.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/"
SIZES={"small-phone":(320,720),"phone":(390,844),"large-phone":(430,932),"tablet":(768,1024)}
issues=[]
records=[]
with sync_playwright() as play:
    browser=play.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for name,(w,h) in SIZES.items():
        context=browser.new_context(viewport={"width":w,"height":h},
            device_scale_factor=1,is_mobile=(w<=430),has_touch=(w<=768))
        page=context.new_page()
        page.on("pageerror",lambda err:issues.append(f"{name}: {err}"))
        resp=page.goto(URL,wait_until="domcontentloaded",timeout=30000)
        page.wait_for_function("document.body.dataset.journeyProgress!==undefined")
        if resp.status!=200:issues.append(f"{name} bad response {resp.status}")
        async_scene=False
        for chapter in range(1,6):
            if chapter in (2,3,4):
                page.locator("#next-chapter").evaluate("(b)=>b.click()")
                page.wait_for_function("(p)=>Math.abs(Number(document.body.dataset.journeyProgress)-(p-1))<.01",arg=chapter,timeout=12000)
            elif chapter==5:
                page.locator("#journey-scrollbar").focus()
                page.keyboard.press("End")
                page.wait_for_function("Number(document.body.dataset.journeyProgress)>3.98",timeout=15000)
            page.wait_for_timeout(250)
            page.screenshot(path=str(OUT/f"{name}-scene-{chapter:02d}.png"),animations="disabled",timeout=15000)
            data=page.evaluate("""(n)=> {
                const sel={1:'.hero-text',2:'#chapter-two .chapter-title',3:'#chapter-three .third-composition',4:'.gallery-photo.is-current',5:'.contact-details'}[n];
                const el=document.querySelector(sel);
                const rect=el?.getBoundingClientRect();
                const allVisible=!!rect && rect.width>0 && rect.height>0 &&
                   rect.right>0 && rect.left<innerWidth && rect.bottom>0 && rect.top<innerHeight;
                const sr=document.documentElement;
                const body=document.body;
                const menu=document.getElementById('menu-button');
                const footer=document.querySelector('.site-footer').getBoundingClientRect();
                const rail=document.querySelector('.portal-navigation').getBoundingClientRect();
                const globe=document.querySelector('.globe-shell')?.getBoundingClientRect();
                const heading=document.querySelector('.contact-heading')?.getBoundingClientRect();
                return {chapter:n,progress:Number(body.dataset.journeyProgress),onScreen:allVisible,
                  rect:rect?{left:Math.round(rect.left),top:Math.round(rect.top),
                  right:Math.round(rect.right),bottom:Math.round(rect.bottom)}:null,
                  documentWidth:Math.max(sr.scrollWidth,body.scrollWidth),
                  viewportWidth:innerWidth,menuSize:menu?.getBoundingClientRect().width,
                  footerTop:Math.round(footer.top),railBottom:Math.round(rail.bottom),
                  globeBottom:Math.round(globe?.bottom||0),headingBottom:Math.round(heading?.bottom||0)};
            }""",chapter)
            records.append({"device":name,**data})
            if data["documentWidth"]>data["viewportWidth"]+3:
                issues.append(f"{name} scene {chapter}: horizontal overflow")
            if not data["onScreen"]:
                issues.append(f"{name} scene {chapter}: main content not visible")
            if data["menuSize"]<40:issues.append(f"{name} menu button too small")
            if chapter==5 and data["globeBottom"]>data["footerTop"]+18:
                issues.append(f"{name} globe extends under footer by {data['globeBottom']-data['footerTop']}px")
            print("MOBILE-ART "+json.dumps({"device":name,**data}),flush=True)
        context.close()
    browser.close()
server.shutdown()
(OUT/"report.json").write_text(json.dumps({"issues":issues,"records":records},indent=2))
for issue in issues: print("FAIL",issue)
print("TOTAL",len(records),"CHECKPOINTS",len(issues),"FAILURES")
sys.exit(1 if issues else 0)
