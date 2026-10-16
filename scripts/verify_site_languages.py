#!/usr/bin/env python3
"""Check bilingual rendering without changing any original layout or media."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys,subprocess
root=Path(__file__).resolve().parents[1]
out=root/"screenshots/site-language"
out.mkdir(parents=True,exist_ok=True)
paths=[
 "/", "/profile/","/portfolio/","/software-skills/","/contact/","/technical-guides/","/it-drift/",
 "/portfolio/basecamp-response/","/portfolio/camp-booking/","/portfolio/copenhagen-valuation/",
 "/portfolio/full-stack-application/","/portfolio/shopflow-mobile/","/portfolio/web-development/",
 "/technical-guides/03-linux-red-hat-cheat-sheet-html-rendered/",
 "/technical-guides/ansible-enterprise-guide-automation-playbooks-roles-and-production-architecture/",
 "/technical-guides/ci-cd-enterprise-guide-github-actions-jenkins-gitlab-ci-and-production-pipelines/",
 "/technical-guides/docker-cheat-sheet-containers-images-and-production-architecture-8/",
 "/technical-guides/document-databases-mongodb-elasticsearch-and-firebase/",
 "/technical-guides/git-and-github-enterprise-guide-version-control-branching-ci-cd-and-production-workflows/",
 "/technical-guides/hashicorp-vault-enterprise-guide-secrets-management-pki-authentication-and-production-architecture/",
 "/technical-guides/helm-enterprise-guide-kubernetes-package-management-charts-and-production-architecture/",
 "/technical-guides/java-apache-kafka-building-scalable-backend-systems/",
 "/technical-guides/kubernetes-enterprise-guide-pods-services-networking-and-production-architecture/",
 "/technical-guides/terraform-enterprise-guide-infrastructure-as-code-modules-and-production-architecture/"
]
for p in paths:
    f=root/p.lstrip("/")/"index.html"
    if p=="/":f=root/"index.html"
    html=f.read_text()
    for name in ("site-language.css","language-core-da.js","language-projects-da.js",
                 "language-guides-da.js","site-language.js"):
        if "/assets/"+name not in html: raise AssertionError(f"{p}: missing {name}")
    if html.count("/assets/site-language.js")!=1:raise AssertionError(f"{p}: multiple switch scripts")
for asset in root.glob("assets/*language*.js"):
    subprocess.run(["node","--check",str(asset)],check=True)
http=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=http.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{http.server_port}"
issues=[];checks=[]
try:
 with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--disable-dev-shm-usage","--autoplay-policy=no-user-gesture-required"])
    for device,width,height in (("desktop",1440,900),("phone",390,844)):
        ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1,has_touch=device=="phone",is_mobile=device=="phone")
        page=ctx.new_page()
        js=[]
        page.on("pageerror",lambda x:js.append(str(x)))
        for i,route in enumerate(paths):
            response=page.goto(base+route,wait_until="domcontentloaded",timeout=30000)
            page.wait_for_function("typeof window.__siteSetLanguage === 'function'",timeout=18000)
            before=page.evaluate("""() => {
              const sel=s=>document.querySelector(s);
              const pane=sel('.panorama')?.getBoundingClientRect();
              return {
               lang:document.documentElement.lang,buttons:document.querySelectorAll('#site-language-switch').length,
               buttonLabel:sel('#site-language-switch')?.textContent,nav:[...document.querySelectorAll('.navigation a')].map(a=>a.href),
               photoCount:document.querySelectorAll('.gallery-photo').length,
               bodyOverflow:document.documentElement.scrollWidth-innerWidth,
               pane:pane?[pane.x,pane.y,pane.width,pane.height]:null,
               clip:sel('#live-arch-morph-path')?.getAttribute('d')?.length||0,
               films:document.querySelectorAll('video').length,
               switchBounds:(() => {const r=sel('#site-language-switch')?.getBoundingClientRect();
                  return r?[r.x,r.y,r.width,r.height]:null;})()
              };
            }""")
            page.locator("#site-language-switch").click(timeout=8500)
            # Every route starts in English; switch to Danish and back.
            after=page.evaluate("""() => ({
              lang:document.documentElement.lang,
              buttonLabel:document.querySelector('#site-language-switch')?.textContent,
              nav:[...document.querySelectorAll('.navigation a')].map(a=>a.href),
              filmCount:document.querySelectorAll('video').length,
              photoCount:document.querySelectorAll('.gallery-photo').length,
              pane:(() => {const r=document.querySelector('.panorama')?.getBoundingClientRect();
                return r?[r.x,r.y,r.width,r.height]:null;})(),
              bodyOverflow:document.documentElement.scrollWidth-innerWidth
            })""")
            if before["lang"]!="en" or before["buttonLabel"]!="DA":
                issues.append(f"{device}:{route} English default was not restored")
            if after["lang"]!="da" or after["buttonLabel"]!="EN":
                issues.append(f"{device}:{route} Danish switch or label failed")
            page.locator("#site-language-switch").click(timeout=8500)
            back=page.evaluate("""() => ({
               lang:document.documentElement.lang,
               button:document.querySelector('#site-language-switch')?.textContent
            })""")
            if back["lang"]!="en" or back["button"]!="DA":
                issues.append(f"{device}:{route} English restore failed")
            if response.status!=200:issues.append(f"{device}:{route} HTTP {response.status}")
            if before["buttons"]!=1:issues.append(f"{device}:{route} expected one language button")
            if before["nav"]!=after["nav"]:issues.append(f"{device}:{route} navigation links changed")
            if before["photoCount"]!=after["photoCount"] or before["films"]!=after["filmCount"]:
                issues.append(f"{device}:{route} media or photo count changed")
            if before["pane"] and after["pane"] and any(abs(a-b)>2 for a,b in zip(before["pane"],after["pane"])):
                issues.append(f"{device}:{route} original arch location changed")
            r=before["switchBounds"]
            if not r or r[0]<0 or r[0]+r[2]>width+1:
                issues.append(f"{device}:{route} language button clipped")
            if before["lang"]==after["lang"]:issues.append(f"{device}:{route} switch failed")
            if before["bodyOverflow"]>4 or after["bodyOverflow"]>4:
                issues.append(f"{device}:{route} horizontal overflow")
            if route=="/" and after["lang"]=="da":
                hero=page.locator(".hero-text").inner_text()
                if "komplekse" not in hero or "virke" not in hero:issues.append(f"{device}: homepage Danish hero {hero}")
            if route=="/profile/" and after["lang"]=="da":
                if "Mennesket" not in page.locator("main").inner_text():issues.append(f"{device}: profile not translated")
            if route=="/":
                page.screenshot(path=str(out/f"{device}-homepage-after-toggle.png"),animations="disabled",timeout=15000)
            checks.append({"device":device,"route":route,"before":before["lang"],"after":after["lang"]})
            print(device,route,before["lang"],"->",after["lang"],flush=True)
        if js:issues.extend(f"{device}: runtime {x}" for x in js[:6])
        ctx.close()
    browser.close()
finally:
 http.shutdown()
(out/"report.json").write_text(json.dumps({"checks":checks,"issues":issues},ensure_ascii=False,indent=2))
for issue in issues:print("FAIL:",issue,flush=True)
print(f"PUBLIC LANGUAGE REVIEW: {len(checks)} page-view checks, {len(issues)} errors",flush=True)
sys.exit(bool(issues))
