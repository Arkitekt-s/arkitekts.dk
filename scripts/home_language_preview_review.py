#!/usr/bin/env python3
"""Browser regression check: bilingual homepage is the SAME five-scene DOM."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
root=Path(__file__).resolve().parents[1]
output=root/"screenshots/home-language"
output.mkdir(parents=True,exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/previews/home-language/"
failures=[];results=[]
def snapshot(page):
    return page.evaluate("""() => ({
      lang:document.documentElement.lang,
      siteName:document.querySelector('.site-name')?.textContent,
      hero:[...document.querySelectorAll('.hero-text > span')].map(x=>x.textContent),
      chapter:[...document.querySelectorAll('#chapter-two .chapter-title > span')].map(x=>x.textContent),
      chapterDesc:document.querySelector('#chapter-two .chapter-description')?.textContent,
      sceneThree:[...document.querySelectorAll('#chapter-three .side-statement span')].map(x=>x.textContent),
      gallery:[...document.querySelectorAll('.gallery-photo figcaption strong')].map(x=>x.textContent),
      fifth:document.querySelector('.contact-heading')?.textContent,
      menu:[...document.querySelectorAll('#navigation a')].map(x=>x.textContent),
      button:document.querySelector('#language-switch-code')?.textContent,
      frames:[...document.querySelectorAll('#chapter-two,#chapter-three,#frame-four-gallery,#frame-five-contact')].length,
      canvases:document.querySelectorAll('canvas').length,
      videos:document.querySelectorAll('video').length,
      heroVideo:document.getElementById('arch-morph-video')?.currentSrc,
      videoTime:document.getElementById('arch-morph-video')?.currentTime,
      galleryPhotos:document.querySelectorAll('.gallery-photo').length,
      currentFrame:document.body.dataset.currentFrame,
      robots:document.querySelector('meta[name="robots"]')?.content,
      horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
      switchVisible:(() => {
        const b=document.querySelector('#language-switch')?.getBoundingClientRect();
        return !!b&&b.width>32&&b.left>=0&&b.right<=innerWidth;
      })()
    })""")
try:
 with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
    for device,width,height in (("desktop",1440,900),("mobile",390,844)):
      context=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1)
      page=context.new_page()
      runtime=[]
      page.on("pageerror",lambda exc:runtime.append(str(exc)))
      response=page.goto(url,wait_until="domcontentloaded",timeout=30000)
      page.wait_for_function("document.getElementById('language-switch') && document.body.dataset.archMorphEnabled==='true'",timeout=15000)
      page.wait_for_timeout(600)
      english=snapshot(page)
      page.screenshot(path=str(output/f"{device}-english.png"),animations="disabled")
      page.locator("#language-switch").click()
      page.wait_for_timeout(500)
      danish=snapshot(page)
      page.screenshot(path=str(output/f"{device}-danish.png"),animations="disabled")
      page.locator("#language-switch").click()
      page.wait_for_timeout(400)
      returned=snapshot(page)
      if response.status!=200:failures.append(f"{device}: HTTP {response.status}")
      if "noindex" not in (english["robots"] or ""):failures.append(f"{device}: preview is indexable")
      if not english["switchVisible"] or not danish["switchVisible"]:failures.append(f"{device}: switch is clipped")
      if english["lang"]!="en" or english["button"]!="DA":failures.append(f"{device}: initial English broken")
      if danish["lang"]!="da" or danish["button"]!="EN":failures.append(f"{device}: Danish switch broken")
      if danish["hero"]!=["Jeg får komplekse","systemer til at virke."]:
       failures.append(f"{device}: Danish hero {danish['hero']}")
      if danish["chapter"]!=["Nysgerrighed.","Kode.","Leverancer."]:
       failures.append(f"{device}: Danish second scene {danish['chapter']}")
      if danish["sceneThree"]!=["JEG BYGGER","STABILE","SYSTEMER","DER HOLDER"]:
       failures.append(f"{device}: third scene {danish['sceneThree']}")
      if danish["fifth"]!="Komplekse udfordringer.Konkrete resultater.":
       failures.append(f"{device}: fifth scene {danish['fifth']}")
      if returned["hero"]!=english["hero"] or returned["chapter"]!=english["chapter"]:
       failures.append(f"{device}: English did not restore")
      for snap in (english,danish,returned):
       if snap["frames"]!=4 or snap["galleryPhotos"]!=7:
        failures.append(f"{device}: missing scene or photograph")
       if snap["canvases"]!=english["canvases"] or snap["videos"]!=english["videos"]:
        failures.append(f"{device}: switched DOM unexpectedly recreated canvases/videos")
       if snap["horizontalOverflow"]>3:failures.append(f"{device}: horizontal overflow")
      if english["heroVideo"]!=danish["heroVideo"]:
       failures.append(f"{device}: language toggle changed the movie")
      if english["currentFrame"]!=danish["currentFrame"]:
       failures.append(f"{device}: language toggle restarted the journey")
      if runtime:failures.append(f"{device}: JavaScript exceptions {runtime[:4]}")
      results.append({"device":device,"english":english,"danish":danish,"restored":returned,"errors":runtime})
      print(device.upper(),json.dumps({"heroDa":danish["hero"],"scenes":danish["frames"],"switch":danish["button"],"errors":runtime}),flush=True)
      context.close()
    browser.close()
finally:
 server.shutdown()
(output/"report.json").write_text(json.dumps({"checks":results,"failures":failures},ensure_ascii=False,indent=2))
for failure in failures:print("FAIL",failure,flush=True)
print("BILINGUAL PREVIEW:",len(results),"viewports,",len(failures),"failures",flush=True)
sys.exit(bool(failures))
