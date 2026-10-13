#!/usr/bin/env python3
"""Compare video 2 playback in Chromium and Google Chrome on the real homepage."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
movie=root/"assets/videos/synthid-ai-25744122.mp4"
poster=root/"assets/videos/synthid-ai-25744122.jpg"
assert movie.exists() and poster.exists(), "Video 2 assets are missing from checkout"
print("ASSETS",json.dumps({"videoSize":movie.stat().st_size,"posterSize":poster.stat().st_size}),flush=True)
http=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=http.serve_forever,daemon=True).start()
with sync_playwright() as p:
 for channel in ["chromium","chrome"]:
  try:
   browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"],**({"channel":"chrome"} if channel=="chrome" else {}))
  except Exception as e:
   print("BROWSER-UNAVAILABLE",channel,str(e)[:800],flush=True);continue
  page=browser.new_page()
  page.add_init_script("Math.random=()=>0.5")
  statuses=[]
  page.on("requestfailed",lambda req:statuses.append({"url":req.url,"failure":req.failure}) if "synthid-ai-25744122" in req.url else None)
  page.on("response",lambda res:statuses.append({"url":res.url,"status":res.status}) if "synthid-ai-25744122" in res.url else None)
  page.goto("http://127.0.0.1:%s/"%http.server_port,wait_until="domcontentloaded",timeout=25000)
  for s in (1,4,8):
   page.wait_for_timeout((s-(0 if s==1 else {4:1,8:4}[s]))*1000)
   media=page.evaluate("""() => {const v=document.getElementById('arch-morph-video'),p=document.getElementById('arch-morph-poster');
     return {src:v?.currentSrc,chosen:document.body.dataset.archMorphScene,
       ready:v?.readyState,network:v?.networkState,paused:v?.paused,
       videoWidth:v?.videoWidth,time:v?.currentTime,error:v?.error?.code||0,
       errorText:v?.error?.message||'',
       canPlayH264:v?.canPlayType('video/mp4; codecs="avc1.4d4028"'),
       posterWidth:p?.naturalWidth,posterComplete:p?.complete,
       isReady:v?.classList.contains('is-ready')}
   }""")
   print("PLAYBACK",json.dumps({"browser":channel,"seconds":s,**media}),flush=True)
  print("NETWORK",channel,json.dumps(statuses),flush=True)
  browser.close()
http.shutdown()
