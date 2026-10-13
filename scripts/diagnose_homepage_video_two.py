#!/usr/bin/env python3
"""Log exact Pexels video 2 loading errors from a real Chromium runner."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, time, urllib.request, urllib.error
root=Path(__file__).resolve().parents[1]
http=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=http.serve_forever,daemon=True).start()
sources=[
"https://videos.pexels.com/video-files/25744122/11904079_3840_2160_30fps.mp4",
"https://videos.pexels.com/video-files/25744122/11904079_3840_2160_30fps.mp4",
"https://images.pexels.com/videos/25744122/ai-artificial-intelligence-computer-data-25744122.jpeg?auto=compress&w=1600"
]
# The formerly used 1080p rendition returns 403; audit only the verified 4K.
for url in sources:
 try:
  req=urllib.request.Request(url,headers={"Range":"bytes=0-4095","User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
  with urllib.request.urlopen(req,timeout=12) as res:
   print("HTTP-SOURCE",json.dumps({"url":url,"code":res.status,"length":res.headers.get("content-length"),"type":res.headers.get("content-type"),"bytes":len(res.read(4096))}),flush=True)
 except Exception as e: print("HTTP-SOURCE-ERROR",url,repr(e),flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
 page=browser.new_page()
 page.add_init_script("Math.random=()=>0.5")
 statuses=[]
 page.on("requestfailed",lambda req:statuses.append({"url":req.url,"failure":req.failure}) if "25744122" in req.url else None)
 page.on("response",lambda res:statuses.append({"url":res.url,"status":res.status}) if "25744122" in res.url else None)
 page.goto("http://127.0.0.1:%s/"%http.server_port,wait_until="domcontentloaded",timeout=30000)
 for seconds in (1,3,8,15):
  page.wait_for_timeout((seconds-(0 if seconds==1 else {3:1,8:3,15:8}[seconds]))*1000)
  data=page.evaluate("""() => {const v=document.getElementById('arch-morph-video');
    const p=document.getElementById('arch-morph-poster');
    return {chosen:document.body.dataset.archMorphScene,
      src:v?.currentSrc,readyState:v?.readyState,networkState:v?.networkState,
      paused:v?.paused,currentTime:v?.currentTime,videoW:v?.videoWidth,
      errorCode:v?.error?.code,errorMessage:v?.error?.message,
      posterNaturalW:p?.naturalWidth,posterComplete:p?.complete,
      classReady:v?.classList.contains('is-ready'),bodyMotionOff:document.body.classList.contains('motion-off')}
    }""")
  print("CHROMIUM-PROBE-"+str(seconds),json.dumps(data),flush=True)
 print("NETWORK-RESPONSES",json.dumps(statuses),flush=True)
 browser.close()
http.shutdown()
