#!/usr/bin/env python3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
root=Path(__file__).resolve().parents[1]
s=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=s.serve_forever,daemon=True).start()
failed=[]
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True,args=['--disable-dev-shm-usage'])
 for mode in 'abc':
  context=b.new_context(viewport={'width':1440,'height':900})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  resp=page.goto(f'http://127.0.0.1:{s.server_port}/previews/arch-hover-color/?option={mode}',wait_until='domcontentloaded')
  page.wait_for_function("document.body.dataset.archMorphEnabled==='true'")
  rect=page.locator('#panorama .arch').nth(1).bounding_box()
  x=rect['x']+rect['width']*.53;y=rect['y']+rect['height']*.48
  page.mouse.move(x,y)
  page.wait_for_timeout(800)
  state=page.evaluate("""() => ({
    mode:document.body.dataset.hoverMode,
    over:document.body.dataset.hovered,
    mask:document.getElementById('live-arch-morph-path').getAttribute('transform'),
    filter:document.getElementById('arch-morph-media').style.filter,
    poster:document.getElementById('arch-morph-poster').src,
    robots:document.querySelector('meta[name=robots]').content
  })""")
  print('HOVER-OPTION',json.dumps(state),flush=True)
  if resp.status!=200 or state['mode']!=mode or 'noindex' not in state['robots']:failed.append('page or SEO '+mode)
  if state['over']!='true' or not state['mask'] or state['filter']=='none':failed.append('hover '+mode)
  if errors:failed.append('js errors '+mode+str(errors[:2]))
  page.mouse.move(10,10);page.wait_for_timeout(550)
  context.close()
 b.close()
s.shutdown()
print('PREVIEW CHECKS',len(failed),'failures',failed)
sys.exit(bool(failed))
