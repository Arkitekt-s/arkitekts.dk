#!/usr/bin/env python3
"""Verify the preview genuinely adds scene 03 (six total) without altering production."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys,subprocess
root=Path(__file__).resolve().parents[1]
out=root/"screenshots/experience-section"
out.mkdir(parents=True,exist_ok=True)
subprocess.run(["node","--check",str(root/"previews/experience-section/journey-six.js")],check=True)
subprocess.run(["node","--check",str(root/"previews/experience-section/experience-ui.js")],check=True)
assert "experience-section" not in (root/"index.html").read_text(), "Live homepage must remain unchanged"
assert (root/"previews/experience-section/index.html").exists()
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_port}/previews/experience-section/"
failures=[];results=[]
try:
 with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
    for name,width,height in [("desktop",1440,900),("mobile",390,844)]:
      ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1)
      page=ctx.new_page();errors=[]
      page.on("pageerror",lambda err:errors.append(str(err)))
      page.goto(base,wait_until="domcontentloaded",timeout=30000)
      page.wait_for_function("""() =>
        typeof window.__experiencePreviewGo==='function' &&
        document.body.dataset.currentFrame==='3' &&
        document.getElementById('experience-section')?.classList.contains('is-visible')
      """,timeout=17000)
      current=page.evaluate("""() => ({
        step:document.body.dataset.currentFrame,
        title:document.querySelector('#experience-section h2')?.textContent,
        organisations:document.querySelectorAll('#experience-section .experience-employer').length,
        layer:document.getElementById('experience-section')?.dataset.layout,
        liveArches:document.querySelectorAll('#panorama .arch').length,
        originalThird:!!document.getElementById('chapter-three'),
        originalGallery:!!document.getElementById('frame-four-gallery'),
        originalContact:!!document.getElementById('frame-five-contact'),
        photoCount:document.querySelectorAll('.gallery-photo').length,
        loadedOriginalFilm:!!document.getElementById('portal-film'),
        sceneOpacity:parseFloat(document.getElementById('experience-section').style.opacity),
        noindex:document.querySelector('meta[name="robots"]')?.content?.includes('noindex'),
        sidebarValue:document.getElementById('portal-current')?.textContent,
        lang:document.documentElement.lang
      })""")
      if current["step"]!="3" or current["sceneOpacity"]<.95:failures.append(f"{name}: new scene not visible {current}")
      if current["organisations"]!=4 or current["photoCount"]!=7 or not current["originalThird"]:failures.append(f"{name}: content missing")
      if current["liveArches"]!=3 or not current["loadedOriginalFilm"]:failures.append(f"{name}: original videos missing")
      if not current["noindex"]:failures.append(f"{name}: preview accidentally indexed")
      if current["sidebarValue"]!="03":failures.append(f"{name}: not its own section number")
      for key in ["a","b","c"]:
        page.locator(f'[data-exp-option="{key}"]').click()
        page.wait_for_timeout(100)
        option=page.locator("#experience-section").get_attribute("data-layout")
        if option!=key:failures.append(f"{name}: option {key} not switching")
        page.screenshot(path=str(out/f"{name}-option-{key}.png"),animations="disabled",timeout=15000)
      # Direct navigation in the isolated scroll engine to confirm all scenes.
      for target,element in [(2,"chapter-two"),(3,"experience-section"),(4,"chapter-three"),(5,"frame-four-gallery"),(6,"frame-five-contact")]:
        page.evaluate(f"window.__experiencePreviewGo({target},true)")
        visible=page.locator("#"+element).evaluate("(el) => el.classList.contains('is-visible')")
        if target!=2 and not visible:failures.append(f"{name}: scene {target} missing visible {element}")
        number=page.locator("body").get_attribute("data-current-frame")
        if number!=str(target):failures.append(f"{name}: scene {target} reports {number}")
      if errors:failures.extend(f"{name}: JS exception {x}" for x in errors[:6])
      results.append({"viewport":name,"entry":current,"runtime_errors":errors})
      ctx.close()
    browser.close()
finally:
 server.shutdown()
(out/"report.json").write_text(json.dumps({"results":results,"failures":failures},ensure_ascii=False,indent=2))
for error in failures:print("FAIL",error,flush=True)
print(f"EXPERIENCE SECTION: {len(results)} viewports, {len(failures)} problems",flush=True)
sys.exit(bool(failures))
