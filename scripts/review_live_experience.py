#!/usr/bin/env python3
"""Live cinematic six-section homepage browser QA."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys,subprocess,re,os
root=Path(__file__).resolve().parents[1]
out=root/"screenshots/live-experience"
out.mkdir(parents=True,exist_ok=True)
subprocess.run(["node","--check",str(root/"concepts/frame-five-contact/assets/journey-six.js")],check=True)
subprocess.run(["node","--check",str(root/"concepts/frame-five-contact/assets/experience-live.js")],check=True)
media=root/"assets/videos/synthid-ai-25744122.mp4"
raw=media.read_bytes()
print("MP4_HEADER:",{"size":len(raw),"avc1":raw.find(b"avc1"),"hvc1":raw.find(b"hvc1"),"hev1":raw.find(b"hev1"),"av01":raw.find(b"av01"),"vp09":raw.find(b"vp09"),"moov":raw.find(b"moov")},flush=True)
try:
    desc=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_name,codec_tag_string,width,height","-of","json",str(media)],capture_output=True,text=True,timeout=10)
    print("FFPROBE:",desc.stdout.strip(),"ERR:",desc.stderr[:200],flush=True)
except Exception as exc:
    print("FFPROBE_UNAVAILABLE:",str(exc),flush=True)
assert "experience-section" in (root/"index.html").read_text(), "Experience is missing from canonical homepage"
assert "previews/experience-section/experience-ui.js" not in (root/"index.html").read_text()
# Unlike GitHub Pages, Python's simple HTTP server does not implement
# byte-range MP4 requests. Browser playback requires HTTP 206 for some MP4s.
class RangeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.range_remaining=None
        path=self.translate_path(self.path)
        header=self.headers.get("Range")
        if header and os.path.isfile(path):
            match=re.fullmatch(r"bytes=(\d+)-(\d*)",header.strip())
            if match:
                source=open(path,"rb")
                total=os.fstat(source.fileno()).st_size
                start=int(match.group(1))
                end=min(total-1,int(match.group(2))) if match.group(2) else total-1
                if start>=total or end<start:
                    self.send_error(416,"Range Not Satisfiable")
                    source.close()
                    return None
                self.send_response(206)
                self.send_header("Content-Type",self.guess_type(path))
                self.send_header("Content-Range",f"bytes {start}-{end}/{total}")
                self.send_header("Content-Length",str(end-start+1))
                self.send_header("Accept-Ranges","bytes")
                self.end_headers()
                source.seek(start)
                self.range_remaining=end-start+1
                return source
        return super().send_head()
    def copyfile(self,source,output):
        if self.range_remaining is None:
            return super().copyfile(source,output)
        while self.range_remaining>0:
            block=source.read(min(128*1024,self.range_remaining))
            if not block:break
            output.write(block)
            self.range_remaining-=len(block)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(RangeHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()

base=f"http://127.0.0.1:{server.server_port}/"
errors=[];passed=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel="chrome",headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
  for device,w,h in [("desktop",1440,900),("mobile",390,844)]:
   ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
   ctx.add_init_script("Math.random = () => 0.5")
   page=ctx.new_page();js=[]
   page.on("pageerror",lambda e:js.append(str(e)))
   page.goto(base,wait_until="domcontentloaded",timeout=30000)
   page.wait_for_function("typeof window.__experienceMotion==='object' && typeof window.__experienceGo==='function'",timeout=15000)
   if page.locator("html").get_attribute("lang")!="da":errors.append(f"{device}: Danish not default")
   if page.locator("#experience-section").count()!=1:errors.append(f"{device}: missing new chapter")
   if page.locator(".experience-select").count():errors.append(f"{device}: preview UI leaked into production")
   if page.locator(".experience-progress").count():errors.append(f"{device}: unwanted scroll progress bar is still shown")
   if page.locator("link[rel=canonical]").get_attribute("href")!="https://arkitekts.dk/":errors.append(f"{device}: canonical changed")
   if "noindex" in page.locator('meta[name="robots"]').get_attribute("content"):errors.append(f"{device}: live page became noindex")
   if page.locator("#site-language-switch").count()!=1:errors.append(f"{device}: language switch missing")
   page.wait_for_function("document.getElementById('arch-morph-video')?.readyState>=2",timeout=20000)
   page.evaluate("window.__experienceGo(3,true)")
   page.wait_for_function("document.body.dataset.currentFrame==='3'&&document.getElementById('experience-section').classList.contains('is-visible')")
   page.wait_for_timeout(900)
   state=page.evaluate("""() => {
    const film=document.getElementById('arch-morph-video');
    const media=document.getElementById('arch-morph-media');
    const title=document.querySelector('.experience-headline').getBoundingClientRect();
    const list=document.querySelector('.experience-organisations').getBoundingClientRect();
    const sit=document.querySelector('[data-company="sit"]');
    const name=sit.querySelector('.experience-company-name').getBoundingClientRect();
    const current=sit.querySelector('.experience-current').getBoundingClientRect();
    const movie=media.getBoundingClientRect(),frame=document.getElementById('frame').getBoundingClientRect();
    return {
     companies:[...document.querySelectorAll('.experience-employer')].map(e=>({name:e.dataset.company,hidden:e.getAttribute('aria-hidden')})),
     headlineX:title.x+title.width/2,listX:list.x+list.width/2,
     label:sit.querySelector('.experience-current').textContent,under:current.top>=name.bottom+2,
     movie:film.currentSrc,time:film.currentTime,paused:film.paused,
     clip:getComputedStyle(media).clipPath,fit:getComputedStyle(film).objectFit,
     covers:Math.abs(movie.width-frame.width)<4 && Math.abs(movie.height-frame.height)<4,
     overflow:document.documentElement.scrollWidth-innerWidth,
     chapter:document.body.dataset.currentFrame};
   }""")
   if state["companies"][0]["hidden"]!="false" or any(x["hidden"]!="true" for x in state["companies"][1:]):
     errors.append(f"{device}: current workplace not shown first: {state['companies']}")
   if "HER ARBEJDER JEG NU" not in state["label"] or not state["under"]:
     errors.append(f"{device}: SIT caption not below company name")
   if device=="desktop" and state["headlineX"]<=state["listX"]+80:
     errors.append(f"{device}: mirror geometry wrong")
   if state["clip"]!="none" or state["fit"]!="cover" or not state["covers"]:
     errors.append(f"{device}: video not full screen: {state}")
   if state["paused"] or state["time"]<=0:errors.append(f"{device}: original movie not playing")
   if state["overflow"]>6:errors.append(f"{device}: unexpected horizontal scrolling")
   page.evaluate("window.__experienceMotion.setReveal(0);window.__experienceGo(4)")
   page.wait_for_timeout(140)
   if page.locator("body").get_attribute("data-current-frame")!="3":
     errors.append(f"{device}: premature section change")
   page.mouse.move(w/2,h/2)
   page.mouse.wheel(0,155)
   page.wait_for_timeout(160)
   start=page.evaluate("window.__experienceMotion.reveal")
   if start<=0 or page.locator("body").get_attribute("data-current-frame")!="3":
     errors.append(f"{device}: wheel reveal broken")
   page.evaluate("document.getElementById('next-chapter').click()")
   page.wait_for_timeout(100)
   if page.evaluate("window.__experienceMotion.reveal")<=start:
     errors.append(f"{device}: next arrow does not reveal")
   page.evaluate("window.__experienceMotion.setReveal(1);window.__experienceGo(4)")
   page.wait_for_timeout(130)
   if page.locator("body").get_attribute("data-current-frame")!="3":
     errors.append(f"{device}: final hold bypassed")
   page.wait_for_timeout(1100)
   if not page.evaluate("window.__experienceMotion.canAdvance()"):
     errors.append(f"{device}: 04/04 does not unlock")
   page.evaluate("window.__experienceGo(4)")
   page.wait_for_function("document.body.dataset.currentFrame==='4'",timeout=6000)
   # Regression: reverse wheel / keyboard must move the physical journey
   # towards Section 02 right away, even with logos only partly revealed.
   page.evaluate("window.__experienceGo(3,true);window.__experienceMotion.setReveal(.60)")
   page.wait_for_timeout(100)
   reverse_before=float(page.locator("body").get_attribute("data-experience-timeline"))
   page.mouse.move(w/2,h/2)
   page.mouse.wheel(0,-155)
   page.wait_for_timeout(370)
   reverse_after=float(page.locator("body").get_attribute("data-experience-timeline"))
   if reverse_after>=reverse_before-.03:
     errors.append(f"{device}: reverse mouse wheel trapped in Section 03: {reverse_before} => {reverse_after}")
   # Stop the reverse test as soon as Section 02 is reached.
   # Nine unbounded wheel events can overshoot 02 all the way into 01.
   for _ in range(6):
     if page.locator("body").get_attribute("data-current-frame")=="2":
       break
     page.mouse.wheel(0,-155)
     page.wait_for_timeout(280)
   page.wait_for_timeout(380)
   back_frame=page.locator("body").get_attribute("data-current-frame")
   if back_frame!="2":
     errors.append(f"{device}: reverse wheel failed to reach Section 02; got {back_frame}")
   page.evaluate("window.__experienceGo(3,true);window.__experienceMotion.setReveal(.70)")
   page.wait_for_timeout(100)
   keyboard_before=float(page.locator("body").get_attribute("data-experience-timeline"))
   page.keyboard.press("ArrowUp")
   page.wait_for_timeout(350)
   keyboard_after=float(page.locator("body").get_attribute("data-experience-timeline"))
   if keyboard_after>=keyboard_before-.03:
     errors.append(f"{device}: ArrowUp trapped inside Section 03: {keyboard_before} => {keyboard_after}")
   # Forward motion must STILL reveal all four workplaces before exit.
   page.evaluate("window.__experienceGo(3,true);window.__experienceMotion.setReveal(.40)")
   page.mouse.wheel(0,160)
   page.wait_for_timeout(200)
   if page.locator("body").get_attribute("data-current-frame")!="3" or page.evaluate("window.__experienceMotion.reveal")<=.40:
     errors.append(f"{device}: forward scroll no longer reveals employers first")
   page.evaluate("window.__experienceGo(3,true)")
   page.locator("#site-language-switch").click()
   page.wait_for_function("""() =>
    document.documentElement.lang==='en' &&
    document.querySelector('.experience-current').textContent==='MY CURRENT WORKPLACE' &&
    document.querySelector('.experience-headline h2').textContent.includes('Experience')
   """,timeout=7000)
   if "Platform operations" not in page.locator('[data-company="sit"] .experience-company-detail').inner_text():
     errors.append(f"{device}: employer description not translated")
   page.locator("#site-language-switch").click()
   page.wait_for_function("document.documentElement.lang==='da' && document.querySelector('.experience-current').textContent==='HER ARBEJDER JEG NU'")
   for n,id in [(1,"panorama"),(2,"chapter-two"),(3,"experience-section"),
                (4,"chapter-three"),(5,"frame-four-gallery"),(6,"frame-five-contact")]:
      page.evaluate(f"window.__experienceGo({n},true)")
      if page.locator("body").get_attribute("data-current-frame")!=str(n) or page.locator("#"+id).count()!=1:
       errors.append(f"{device}: scene {n} failed")
   page.evaluate("window.__experienceGo(3,true);window.__experienceMotion.setReveal(1)")
   page.screenshot(path=str(out/f"{device}-live-mirror.png"),animations="disabled",timeout=15000)
   errors.extend(f"{device}: JS: {x}" for x in js[:5])
   passed.append({"device":device,"state":state,"pageerrors":js})
   print("FINISHED",device,"new scene with English and Danish",flush=True)
   ctx.close()
  browser.close()
finally:
 server.shutdown()
(out/"report.json").write_text(json.dumps({"passed":passed,"errors":errors},ensure_ascii=False,indent=2))
for issue in errors:print("FAIL",issue,flush=True)
print(f"LIVE HOMEPAGE QA: {len(passed)} viewports, {len(errors)} errors",flush=True)
sys.exit(bool(errors))
