#!/usr/bin/env python3
"""Live Option A: one film physically unfolds from the three arch windows.

Checks each randomly chosen source, forward and reverse transitions, no double
video layers, real Safari/Chrome-compatible SVG mask URL, and phone/tablet layout.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"screenshots/live-arch-unfold"
OUT.mkdir(parents=True,exist_ok=True)
http=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=http.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%s/" % http.server_port
clips=[18069232,25744122,18069165]
failures=[]
results=[]
METRICS="""() => {
 const pan=document.getElementById('panorama');
 const stage=document.getElementById('frame');
 const media=document.getElementById('arch-morph-media');
 const vid=document.getElementById('arch-morph-video');
 const svg=document.getElementById('live-arch-morph-path');
 const portal=document.getElementById('portal-film');
 const root=document.documentElement;
 const rect=stage.getBoundingClientRect();
 const clip=getComputedStyle(media).clipPath;
 const d=svg.getAttribute('d')||'';
 return {
  selected:Number(document.body.dataset.archMorphScene),
  random:Number(root.dataset.initialHomepageFilm),
  ready:document.body.dataset.archMorphEnabled==='true',
  progress:Number(document.body.dataset.journeyProgress||0),
  morph:Number(media.dataset.morphProgress||-1),
  videoSrc:vid.getAttribute('src')||'',
  videoPoster:vid.poster,
  poster:document.getElementById('arch-morph-poster').src,
  maskedVideoCount:media.querySelectorAll('video').length,
  pathCount:(d.match(/M/g)||[]).length,
  d,
  cssClip:clip,
  box:{width:rect.width,height:rect.height},
  oldPanHidden:getComputedStyle(pan).visibility==='hidden',
  oldPortalHidden:getComputedStyle(portal).visibility==='hidden',
  oldPanVideoPaused:[...pan.querySelectorAll('.arch-video')].every(v=>v.paused),
  localMaskFragment:clip.includes('/#live-arch-morph-mask'),
  scrollWidth:Math.max(root.scrollWidth,document.body.scrollWidth),
  viewport:innerWidth
 }
}"""
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    devices=[("small-phone",320,720),("phone",390,844),
             ("tablet",768,1024),("desktop",1440,900)]
    for device,w,h in devices:
        for selected,n in enumerate([.03,.45,.87]):
            context=browser.new_context(viewport={"width":w,"height":h},
                device_scale_factor=1,is_mobile=(w<=390),has_touch=(w<=768))
            page=context.new_page()
            page.add_init_script("Math.random = () => "+str(n))
            jsErrors=[]
            page.on("pageerror",lambda e: jsErrors.append(str(e)))
            response=page.goto(URL,wait_until="domcontentloaded",timeout=25000)
            page.wait_for_function("document.body.dataset.archMorphEnabled==='true'",timeout=6000)
            page.wait_for_timeout(180)
            stage0=page.evaluate(METRICS)
            if response.status!=200:failures.append(f"{device}/{selected}: HTTP {response.status}")
            if stage0["selected"]!=selected or stage0["random"]!=selected:
                failures.append(f"{device}/{selected}: wrong initial randomized film")
            if not stage0["ready"] or stage0["maskedVideoCount"]!=1:
                failures.append(f"{device}/{selected}: mask or single film missing")
            if not stage0["oldPanHidden"] or not stage0["oldPortalHidden"]:
                failures.append(f"{device}/{selected}: legacy crossfade is still visible")
            if not stage0["oldPanVideoPaused"]:
                failures.append(f"{device}/{selected}: legacy arch videos still decode")
            if str(clips[selected]) not in stage0["videoSrc"] or str(clips[selected]) not in stage0["poster"]:
                failures.append(f"{device}/{selected}: incorrect source or poster")
            if stage0["pathCount"]!=3 or stage0["morph"]>.01:
                failures.append(f"{device}/{selected}: mask is not three closed arches")
            if not stage0["localMaskFragment"]:
                failures.append(f"{device}/{selected}: mask URL points to legacy <base> path")
            if stage0["scrollWidth"]>stage0["viewport"]+3:
                failures.append(f"{device}/{selected}: horizontal overflow")
            if selected==1:
                page.screenshot(path=str(OUT/f"{device}-01.png"),animations="disabled")
                # On desktop restore the original near-cursor elastic arch
                # movement and neutral Silver Glass hover highlight.
                # Test the VISIBLE mask rather than the retired panorama.
                if device=="desktop":
                    page.wait_for_timeout(250)
                    startPath=page.locator("#live-arch-morph-path").get_attribute("d") or ""
                    center=page.locator("#panorama .arch").nth(1).evaluate(
                        "(a)=>{const r=a.getBoundingClientRect();return {x:r.right-18,y:r.top+r.height*.46}}")
                    page.mouse.move(center["x"],center["y"])
                    page.wait_for_timeout(850)
                    moved=page.locator("#live-arch-morph-path").get_attribute("d") or ""
                    glass=page.evaluate("""() => ({
                      inside:document.body.dataset.archGlassInside,
                      opacity:Number(getComputedStyle(document.getElementById('arch-morph-lens')).opacity),
                      visible:getComputedStyle(document.getElementById('arch-morph-lens')).visibility,
                    })""")
                    if moved==startPath:
                        failures.append("desktop: moving the mouse doesn't bend the visible arches")
                    if glass["inside"]!="true" or glass["opacity"]<.5 or glass["visible"]!="visible":
                        failures.append(f"desktop: original Silver Glass hover missing {glass}")
                    page.screenshot(path=str(OUT/"desktop-elastic-hover.png"),animations="disabled")
                    page.mouse.move(4,4)
                    page.wait_for_timeout(1300)
                    settled=page.locator("#live-arch-morph-path").get_attribute("d") or ""
                    from re import findall
                    def path_distance(a,b):
                        xa=[float(x) for x in findall(r"-?\\d+(?:\\.\\d+)?",a)]
                        xb=[float(x) for x in findall(r"-?\\d+(?:\\.\\d+)?",b)]
                        return sum(abs(x-y) for x,y in zip(xa,xb)) if len(xa)==len(xb) else 999999
                    displacement=path_distance(moved,startPath)
                    restored=path_distance(settled,startPath)
                    if displacement<3:
                        failures.append(f"desktop: elastic motion too subtle: {displacement}")
                    if restored>displacement*.25:
                        failures.append(f"desktop: spring did not return to rest: {restored}/{displacement}")
                    if page.evaluate("document.body.dataset.archGlassInside")!="false":
                        failures.append("desktop: Silver Glass ring stayed active after mouse left")
                    print("ELASTIC-HOVER "+json.dumps({"distortion":displacement,"return":restored,
                        "lens":glass,"backToRest":restored<displacement*.25}),flush=True)
                page.mouse.wheel(0,225)
                page.wait_for_timeout(720)
                midway=page.evaluate(METRICS)
                if not .04<midway["morph"]<.96:
                    failures.append(f"{device}/{selected}: missing physical intermediate arch shape")
                page.screenshot(path=str(OUT/f"{device}-unfold.png"),animations="disabled")
            page.locator("#next-chapter").evaluate("(button)=>button.click()")
            page.wait_for_function("Number(document.body.dataset.journeyProgress)>.994",timeout=14000)
            stage1=page.evaluate(METRICS)
            if stage1["morph"]<.999 or stage1["pathCount"]!=3:
                failures.append(f"{device}/{selected}: masked openings did not fill screen")
            if stage1["selected"]!=selected:
                failures.append(f"{device}/{selected}: film changes during 01→02")
            if selected==1:page.screenshot(path=str(OUT/f"{device}-02.png"),animations="disabled")
            page.locator("#next-chapter").evaluate("(button)=>button.click()")
            page.wait_for_function("Number(document.body.dataset.journeyProgress)>1.994",timeout=14000)
            stage2=page.evaluate(METRICS)
            if stage2["morph"]<.999 or stage2["selected"]!=selected:
                failures.append(f"{device}/{selected}: same film does not persist into section 03")
            if selected==1:page.screenshot(path=str(OUT/f"{device}-03.png"),animations="disabled")
            page.locator("#previous-chapter").evaluate("(button)=>button.click()")
            page.wait_for_function("Number(document.body.dataset.journeyProgress)<1.006",timeout=14000)
            page.locator("#previous-chapter").evaluate("(button)=>button.click()")
            page.wait_for_function("Number(document.body.dataset.journeyProgress)<.006",timeout=14000)
            back=page.evaluate(METRICS)
            if back["morph"]>.01 or back["selected"]!=selected:
                failures.append(f"{device}/{selected}: arch opening cannot reverse")
            if jsErrors:failures.append(f"{device}/{selected}: JS exceptions {jsErrors[:2]}")
            if selected==1:page.screenshot(path=str(OUT/f"{device}-reverse.png"),animations="disabled")
            results.append({"device":device,"selected":selected,
                            "start":{k:stage0[k] for k in ("morph","selected","pathCount","cssClip")},
                            "middle":stage1["morph"],"last":stage2["morph"],"reverse":back["morph"],
                            "consoleErrors":jsErrors[:2]})
            print("ARCH "+device+" film "+str(selected+1)+" "+
                json.dumps({"start":stage0["morph"],"full":stage1["morph"],"third":stage2["morph"],
                "back":back["morph"],"pathCount":back["pathCount"]}),flush=True)
            context.close()
    browser.close()
http.shutdown()
(OUT/"results.json").write_text(json.dumps({"runs":results,"failures":failures},indent=2))
for problem in failures:print("FAIL",problem)
print("LIVE ARCH UNFOLD: %s browser paths, %s failures"%(len(results),len(failures)))
sys.exit(1 if failures else 0)
