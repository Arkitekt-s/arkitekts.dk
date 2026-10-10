#!/usr/bin/env python3
"""Archive original public arkitekts.dk portfolio photos and PDFs in GitHub Pages.

Reads all SIX original portfolio pages; only downloads image/PDF files directly
hosted on arkitekts.dk's public WordPress uploads. Ignores UI icons, scripts,
logos, fake phone shadows and existing files already migrated in 2026.

Images become locally hosted, screen-size friendly WebP files. PDFs remain
untouched originals, plus a small preview of their pages. This does not change
WordPress content or require login.

The generated archive is inserted into each of the six project pages between
its existing hero/gallery and chapter navigation; it does not replace the
approved design or rewrite the other project content.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
from collections import OrderedDict
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote, quote
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from PIL import Image, ImageOps
import fitz

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"portfolio"
ASSETS=BASE/"assets"/"original"
HOST="arkitekts.dk"
PAGES=OrderedDict([
 ("web-development","wordpress-environmental-engineering-innovation"),
 ("copenhagen-valuation","copenhagen-amager-accommodation-price-prediction"),
 ("full-stack-application","spring-boot-web-application-development-project"),
 ("basecamp-response","basecamp-customer-response-monitor"),
 ("shopflow-mobile","react-native-shopping-app-development"),
 ("camp-booking","university-copenhagen-seminar-booking-system-development"),
])
# Already migrated from the SAME WordPress uploads; don't download duplicates.
EXISTING={
 "web-development":{"website-1.png","soheil-fattahieh1.png"},
 "copenhagen-valuation":{"price-copenhagen.png","final-prediction_005.png","final-prediction_002.png"},
 "full-stack-application":set(),
 "basecamp-response":{"twentyfour.png"},
 "shopflow-mobile":{"arkitekts-mobile2.png"},
 "camp-booking":{"camp-university-of-copenhagen.png"},
}
START_MARK="<!-- BEGIN ORIGINAL WORDPRESS MEDIA ARCHIVE -->"
END_MARK="<!-- END ORIGINAL WORDPRESS MEDIA ARCHIVE -->"

def normalized_filename(url):
    name=unquote(Path(urlparse(url).path).name)
    return re.sub(r"-\d+x\d+(?=\.[^.]+$)","",name).lower()

def media_url(candidate):
    raw=html.unescape(str(candidate or "")).strip()
    if not raw:return None
    url=urljoin(f"https://{HOST}/",raw)
    parsed=urlparse(url)
    if parsed.hostname not in (HOST,"www."+HOST):return None
    if not parsed.path.startswith("/wp-content/uploads/"):return None
    if parsed.path.lower().endswith((".jpg",".jpeg",".png",".webp",".gif",".avif",".pdf")):
        return f"https://{HOST}{parsed.path}"
    return None

def best_source(img):
    possibles=[]
    for field in ("data-full-url","data-large-file","data-src","data-lazy-src","src"):
        if img.get(field):possibles.append(img.get(field))
    for field in ("srcset","data-srcset"):
        for piece in (img.get(field) or "").split(","):
            piece=piece.strip().split(" ")[0]
            if piece:possibles.append(piece)
    parent=img.find_parent("a",href=True)
    if parent and parent.get("href"):possibles.insert(0,parent["href"])
    return [v for v in possibles if media_url(v)]

def find_media(source_html,slug):
    soup=BeautifulSoup(source_html,"html.parser")
    main=soup.find("main")
    if main is None:main=soup
    photos=OrderedDict()
    pdfs=OrderedDict()
    # Images in original article, including images wrapped in lightbox links.
    for tag in main.find_all("img"):
        urls=best_source(tag)
        if not urls:continue
        u=urls[0]
        name=normalized_filename(u)
        if name in EXISTING[slug]:continue
        if re.search(r"(?:pngfind|shadow|avatar|favicon|icon|logo|gravatar|placeholder)",name,re.I):
            continue
        ext=Path(urlparse(u).path).suffix.lower()
        if ext==".pdf":continue
        if ext not in (".png",".webp",".jpg",".jpeg",".gif",".avif"):continue
        alt=tag.get("alt") or tag.get("title") or ""
        alt=BeautifulSoup(str(alt),"html.parser").get_text(" ",strip=True)
        if not alt or alt.lower() in ("image","photo"):alt=unquote(Path(urlparse(u).path).stem)
        if name not in photos:photos[name]={"source":u,"caption":alt[:180]}
    # PDFs may be linked, embedded or included in WordPress download blocks.
    for tag in main.find_all(["a","iframe","embed","object"]):
        for attribute in ("href","src","data"):
            if not tag.get(attribute):continue
            u=media_url(tag.get(attribute))
            if not u or not u.lower().endswith(".pdf"):continue
            nm=normalized_filename(u)
            if nm not in pdfs:
                title=tag.get_text(" ",strip=True) or Path(urlparse(u).path).stem
                pdfs[nm]={"source":u,"caption":title[:180]}
    # Catch PDFs inside WordPress download shortcode metadata.
    if slug=="camp-booking":
        fallback="https://arkitekts.dk/wp-content/uploads/2023/01/CAMP-research-group_opt-min-2.pdf"
        key=normalized_filename(fallback)
        pdfs.setdefault(key,{"source":fallback,"caption":"CAMP Research Group: booking-system project document"})
    return list(photos.values())[:32],list(pdfs.values())[:8]

def fetch(url,limit=40*1024*1024):
    req=Request(url,headers={"User-Agent":"Mozilla/5.0 (Soheil Public Portfolio Archive; GitHub Pages)",
                             "Accept":"image/*,application/pdf,text/html;q=0.9,*/*;q=0.7"})
    with urlopen(req,timeout=65) as response:
        length=int(response.headers.get("Content-Length") or 0)
        if length>limit:raise ValueError(f"file exceeds archive limit: {length} bytes")
        contents=response.read(limit+1)
    if len(contents)>limit:raise ValueError("file exceeds archive limit")
    return contents

def safe_name(source):
    basename=unquote(Path(urlparse(source).path).stem)
    basename=re.sub(r"-\d+x\d+$","",basename)
    name=re.sub(r"[^a-z0-9]+","-",basename.lower()).strip("-")[:67] or "portfolio-file"
    return name+"-"+hashlib.sha256(source.encode("utf8")).hexdigest()[:7]

def save_image(slug,media):
    source=media["source"]
    ext=".webp"
    out=ASSETS/slug/(safe_name(source)+ext)
    out.parent.mkdir(parents=True,exist_ok=True)
    if not out.exists():
        blob=fetch(source,limit=18*1024*1024)
        pic=ImageOps.exif_transpose(Image.open(BytesIO(blob))).convert("RGBA")
        if pic.width<230 or pic.height<175:
            print("SKIP small decorative image:",slug,source,pic.size)
            return None
        pic.thumbnail((1800,1500),Image.Resampling.LANCZOS)
        pic.save(out,"WEBP",quality=94,method=6,exact=True)
    else:
        pic=Image.open(out)
    print("IMAGE",slug,out.relative_to(ROOT),pic.size,source)
    return {"filename":out.name,"path":str(out.relative_to(BASE)),
            "source":source,"caption":media["caption"],"kind":"image",
            "size_bytes":out.stat().st_size}

def save_pdf(slug,media):
    source=media["source"]
    out=ASSETS/slug/(safe_name(source)+".pdf")
    out.parent.mkdir(parents=True,exist_ok=True)
    if not out.exists():
        contents=fetch(source,limit=45*1024*1024)
        if not contents.startswith(b"%PDF-"):raise ValueError("not a valid PDF: "+source)
        out.write_bytes(contents)
    document=fitz.open(str(out))
    count=len(document)
    previews=[]
    for i in range(min(10,count)):
        filename=out.stem+f"-page-{i+1:02d}.webp"
        thumb=out.with_name(filename)
        if not thumb.exists():
            page=document[i]
            pix=page.get_pixmap(matrix=fitz.Matrix(1.15,1.15),alpha=False)
            im=Image.open(BytesIO(pix.tobytes("png")))
            im.thumbnail((950,1200),Image.Resampling.LANCZOS)
            im.save(thumb,"WEBP",quality=87,method=5)
        previews.append(str(thumb.relative_to(BASE)))
    document.close()
    print("PDF",slug,out.relative_to(ROOT),f"{count} pages, {out.stat().st_size:,} bytes",source)
    return {"filename":out.name,"path":str(out.relative_to(BASE)),
            "source":source,"caption":media["caption"],"kind":"pdf","pages":count,
            "previews":previews,"size_bytes":out.stat().st_size}

def esc(text):return html.escape(str(text or ""),quote=True)

def render_media_section(slug,assets):
    pictures=[a for a in assets if a["kind"]=="image"]
    docs=[a for a in assets if a["kind"]=="pdf"]
    if not pictures and not docs:return ""
    result=[START_MARK,'<section class="original-media-archive" id="original-project-media" aria-labelledby="original-media-heading">',
        '<div class="original-media-heading"><p>FROM THE ORIGINAL ARKITEKTS.DK PROJECT</p>',
        '<h2 id="original-media-heading">Original <em>project files.</em></h2>',
        '<span>REAL PHOTOS · ORIGINAL DOCUMENTS</span></div>']
    if pictures:
        result.append('<div class="original-media-grid">')
        for item in pictures:
            rel="../"+item["path"]
            label=esc(item["caption"])
            result.append(f'<figure class="original-media-photo"><a href="{esc(rel)}" target="_blank" rel="noopener noreferrer" aria-label="Open original project image: {label}"><img src="{esc(rel)}" alt="{label}" loading="lazy" decoding="async"></a><figcaption>{label} <span aria-hidden="true">↗</span></figcaption></figure>')
        result.append('</div>')
    if docs:
        result.append('<div class="original-media-documents">')
        for item in docs:
            rel="../"+item["path"]
            result.append('<article class="original-pdf-file">')
            result.append('<div class="original-pdf-intro"><span>ORIGINAL PDF · '+str(item["pages"])+' PAGES</span><h3>'+esc(item["caption"])+'</h3><p>Read the complete original project document.</p></div>')
            if item["previews"]:
                result.append('<div class="original-pdf-preview" aria-label="Preview pages from the project PDF">')
                for n,preview in enumerate(item["previews"]):
                    p="../"+preview
                    result.append(f'<a href="{esc(rel)}#page={n+1}" target="_blank" rel="noopener noreferrer" aria-label="Open document at page {n+1}"><img src="{esc(p)}" alt="PDF page {n+1} preview" loading="lazy" decoding="async"><span>PAGE {n+1:02d}</span></a>')
                result.append('</div>')
            result.append(f'<div class="original-pdf-links"><a href="{esc(rel)}" target="_blank" rel="noopener noreferrer">OPEN COMPLETE PDF <span aria-hidden="true">↗</span></a><a href="{esc(rel)}" download="{esc(item["filename"])}">DOWNLOAD PDF <span aria-hidden="true">↓</span></a></div>')
            result.append('</article>')
        result.append('</div>')
    result.append('</section>')
    result.append(END_MARK)
    return "\n".join(result)+"\n"

def update_project(slug,assets):
    path=BASE/slug/"index.html"
    content=path.read_text("utf8")
    # Update only this generated region, preserve existing curated galleries.
    injected=render_media_section(slug,assets)
    if START_MARK in content:
        content=re.sub(re.escape(START_MARK)+r".*?"+re.escape(END_MARK)+r"\s*","",content,flags=re.S)
    anchor='<nav class="case-chapters" aria-label="On this project page">'
    if anchor not in content:raise RuntimeError("Case chapter anchor missing: "+slug)
    content=content.replace(anchor,injected+'  '+anchor,1)
    path.write_text(content,encoding="utf8")

def main():
    manifest={"source":"https://arkitekts.dk","note":"Original public WordPress portfolio media backed up inside GitHub.","projects":{}}
    for slug,source_slug in PAGES.items():
        source=f"https://{HOST}/portfolio/{source_slug}/"
        raw=fetch(source,limit=5*1024*1024).decode("utf8","replace")
        images,pdfs=find_media(raw,slug)
        print("FOUND",slug,"original photo candidates",len(images),"PDF candidates",len(pdfs))
        print("CANDIDATES",json.dumps({"photos":images,"pdfs":pdfs},ensure_ascii=False)[:12500])
        items=[]
        for im in images:
            try:
                added=save_image(slug,im)
                if added:items.append(added)
            except Exception as exc:
                print("WARN failed image",slug,im["source"],str(exc)[:250])
        for doc in pdfs:
            # PDFs are essential originals. Never silently omit a failed download.
            items.append(save_pdf(slug,doc))
        update_project(slug,items)
        manifest["projects"][slug]={"source_page":source,"files":items}
    (BASE/"media-manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    pdf_count=sum(a["kind"]=="pdf" for p in manifest["projects"].values() for a in p["files"])
    photo_count=sum(a["kind"]=="image" for p in manifest["projects"].values() for a in p["files"])
    print(f"ARCHIVE COMPLETE: {photo_count} additional photographs, {pdf_count} original PDFs")
    if pdf_count<1:raise RuntimeError("Expected CAMP PDF is missing")
    if photo_count<1:raise RuntimeError("No original project images were discovered")

if __name__=="__main__":main()
