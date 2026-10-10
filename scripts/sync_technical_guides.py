#!/usr/bin/env python3
"""Mirror *published* WordPress-MCP guides into independent GitHub Pages.

WordPress-MCP (Arkitekt-s/wordpress-mcp) creates drafts using a locked design.
This script reads public, published posts from WordPress; it never reads drafts,
sends credentials, changes the master CSS or publishes to WordPress.

Pipeline: public WordPress REST -> sanitize HTML -> JSON catalog ->
          static guide cards and real individual HTML guide pages.
For service outages, existing full content is kept; use --offline to build seeds.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urlsplit
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup, Tag

ROOT=Path(__file__).resolve().parents[1]
GUIDES=ROOT/"technical-guides"
CATALOG=GUIDES/"guides.json"
WP="https://arkitekts.dk"
REST=WP+"/wp-json/wp/v2/posts"
FEED=WP+"/feed/"
ALLOWED={"section","div","span","p","h2","h3","h4","h5","h6","ul","ol","li",
         "a","strong","em","b","i","small","hr","br","code","pre","blockquote",
         "table","thead","tbody","tfoot","tr","th","td","figure","figcaption",
         "details","summary","kbd","mark","sup","sub","img","dl","dt","dd"}
DROP={"script","style","iframe","object","embed","form","input","button",
      "svg","video","audio","canvas","noscript","link","meta","head","footer"}
TITLE_PATTERN=re.compile(r"\b(enterprise guide|cheat sheet|technical guide|document databases|apache kafka)\b",re.I)
UA="SoheilTechnicalGuidesMirror/1.0 (GitHub Pages; published articles only)"

def e(value):
    return html.escape(str(value or ""),quote=True)

def request_data(url):
    req=Request(url,headers={"User-Agent":UA,"Accept":"application/json, application/rss+xml;q=0.9, */*;q=0.8"})
    with urlopen(req,timeout=25) as res:
        return res.read()

def decode_text(raw):
    return BeautifulSoup(str(raw or ""),"html.parser").get_text(" ",strip=True)

def safe_url(value):
    value=str(value or "").strip()
    if not value or value.startswith("//"):return None
    if value.startswith("#"):return value
    parsed=urlsplit(value)
    if parsed.scheme and parsed.scheme not in ("http","https"):return None
    if parsed.scheme in ("http","https") and not parsed.netloc:return None
    if not parsed.scheme and (value.startswith("/") or value.startswith("../") or value.startswith("./")):return value
    if not parsed.scheme and re.fullmatch(r"[a-zA-Z0-9._/?#&=%+\-]+",value):return value
    return value if parsed.scheme in ("http","https") else None

def clean_post_html(raw):
    """Preserve text, code, tables and safe links; discard scripts and WP layout."""
    soup=BeautifulSoup(raw or "","html.parser")
    showcase=soup.select_one(".db-showcase")
    root=showcase.select_one("main") if showcase else None
    if root is None:root=soup
    for node in list(root.find_all(True)):
        if node.name is None or node.parent is None:continue
        if node.name in DROP or node.get("class") and any(c in (
            "db-sidebar","db-nav","db-help","db-hero","wp-block-navigation"
        ) for c in node.get("class",[])):
            node.decompose()
    for node in list(root.find_all(True)):
        if node.name is None or not node.parent:continue
        if node.name not in ALLOWED:
            node.unwrap()
            continue
        attrs={}
        if node.name=="a":
            url=safe_url(node.get("href"))
            if url:attrs["href"]=url
            if url and url.startswith("http"):attrs["rel"]="noopener noreferrer"
        if node.name=="img":
            src=safe_url(node.get("src"))
            if src:attrs["src"]=src
            if node.get("alt"):attrs["alt"]=str(node.get("alt"))[:220]
            attrs["loading"]="lazy"
        if node.name in ("th","td"):
            for attr in ("colspan","rowspan"):
                val=str(node.get(attr,""))
                if val.isdigit() and 0<int(val)<=12:attrs[attr]=val
        if node.name=="section" or re.match(r"h[2-6]$",node.name):
            v=node.get("id")
            if v and re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,95}",str(v)):
                attrs["id"]=str(v)
        node.attrs=attrs
        if node.name=="h1":node.name="h2"
    if isinstance(root,Tag):
        output="".join(str(item) for item in root.contents)
    else:output=str(root)
    # Any repeated metadata stripped; keep the full technical sections.
    return output.strip()

def get_wordpress_posts():
    """Prefer paginated public WP REST; RSS is fallback for closed API servers."""
    posts=[]
    try:
        for page in range(1,9):
            url=REST+"?"+urlencode({"per_page":100,"page":page,
              "_fields":"id,date,slug,link,title,content,excerpt,status,author"})
            try:
                data=json.loads(request_data(url).decode("utf-8-sig"))
            except Exception:
                if page==1:raise
                break
            if not isinstance(data,list):raise RuntimeError("Unexpected WordPress REST response")
            posts+=data
            if len(data)<100:break
        return posts,"wordpress-rest"
    except Exception as err:
        print("WordPress REST unavailable; trying public RSS:",str(err)[:240],file=sys.stderr)
    rss=request_data(FEED)
    root=ET.fromstring(rss)
    content_ns="{http://purl.org/rss/1.0/modules/content/}encoded"
    dc_ns="{http://purl.org/dc/elements/1.1/}creator"
    posts=[]
    for item in root.findall("./channel/item"):
        url=item.findtext("link") or ""
        slug=urlsplit(url).path.strip("/").split("/")[-1]
        if not slug:continue
        creator=item.findtext(dc_ns) or ""
        posts.append({
          "slug":slug,"link":url,"title":{"rendered":item.findtext("title") or ""},
          "content":{"rendered":item.findtext(content_ns) or item.findtext("description") or ""},
          "excerpt":{"rendered":item.findtext("description") or ""},
          "date":item.findtext("pubDate") or "",
          "status":"publish","creator":creator
        })
    if not posts:raise RuntimeError("Both public WordPress REST and RSS returned no posts")
    return posts,"wordpress-rss"

def merge_published(current,posts):
    existing={item["slug"]:item for item in current if item.get("slug")}
    known=set(existing)
    # Only articles published by the same WordPress-MCP author are included.
    series_authors={post.get("author") for post in posts if post.get("slug") in known and post.get("author")}
    seen=set()
    enriched=0
    for post in posts:
        if post.get("status") not in ("publish","published",None):continue
        original_slug=post.get("slug") or ""
        title=decode_text((post.get("title") or {}).get("rendered") if isinstance(post.get("title"),dict) else post.get("title"))
        if not original_slug or not title:continue
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,150}",original_slug):continue
        same_author=bool(series_authors) and post.get("author") in series_authors
        creator=str(post.get("creator") or "").lower()
        if original_slug not in known and not (same_author or creator=="chatgpt-agent" or TITLE_PATTERN.search(title)):
            continue
        url=post.get("link") or f"{WP}/{original_slug}/"
        if urlsplit(url).hostname not in ("arkitekts.dk","www.arkitekts.dk"):continue
        item=existing.get(original_slug)
        if not item:
            n=max([int(g.get("number","0")) for g in existing.values() if str(g.get("number","0")).isdigit()] or [0])+1
            item={"number":f"{n:02d}","slug":original_slug,"title":title,
                  "category":"Technical Guide","tags":[],"date":"","description":"","body_html":"",
                  "source_url":url,"status":"published"}
            existing[original_slug]=item
        raw=(post.get("content") or {}).get("rendered") if isinstance(post.get("content"),dict) else post.get("content")
        body=clean_post_html(raw)
        if len(BeautifulSoup(body,"html.parser").get_text(" ",strip=True))>260:
            item["body_html"]=body
            enriched+=1
        item["title"]=title
        item["source_url"]=url
        item["status"]="published"
        d=str(post.get("date") or "")
        if re.match(r"^\d{4}-\d{2}-\d{2}",d):item["date"]=d[:10]
        if not item.get("description"):
            item["description"]=decode_text((post.get("excerpt") or {}).get("rendered") if isinstance(post.get("excerpt"),dict) else post.get("excerpt"))[:280] or f"Read the practical {title} technical guide."
        seen.add(original_slug)
    # Never delete a local page during an upstream outage or feed pagination.
    ordered=sorted(existing.values(),key=lambda a:(int(a.get("number") or 9999),a.get("title","")))
    return ordered,enriched,len(seen)

def header(depth=1,active="GUIDES"):
    root="../"*depth
    routes=[("PORTFOLIO","portfolio/"),("PROFILE","profile/"),("SKILLS","software-skills/"),("GUIDES","technical-guides/")]
    nav="\n".join(
      f'<a href="{root+path}"'+(' aria-current="page"' if label==active else "")+f'>{label}</a>'
      for label,path in routes
    )
    return f"""<header class="site-header" aria-label="Fixed site header">
      <a class="brand-icon" href="{root}concepts/frame-five-contact/" aria-label="Soheil home">S<span>.</span></a>
      <span class="site-name" aria-label="Soheil Fattahieh">S O H E I L</span>
      <button class="menu-button" id="menu-button" type="button" aria-expanded="false" aria-controls="navigation" aria-label="Open menu"><span></span><span></span><span></span></button>
      <nav class="navigation" id="navigation" aria-label="Main navigation">
      {nav}
      <a class="contact" href="{root}contact/">Let's talk</a>
      </nav></header>"""

def footer(depth=1):
    root="../"*depth
    return f"""<footer class="site-footer" aria-label="Fixed site footer">
      <a class="footer-mark" href="{root}concepts/frame-five-contact/" aria-label="Soheil home">S.</a>
      <span class="footer-specialties">LINUX <i>·</i> ANSIBLE <i>·</i> ELASTICSEARCH <i>·</i> KAFKA</span>
      <span class="footer-location">COPENHAGEN · DENMARK</span></footer>"""

def shell_start(depth,title,description,styles,scripts):
    root="../"*depth
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f8f6fb"><meta name="robots" content="noindex,nofollow">
<meta name="description" content="{e(description)[:240]}"><title>{e(title)} — Soheil Fattahieh</title>
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{root}contact/contact.css">
{styles}{scripts}</head><body class="guides-page">
<a class="skip-link" href="#content">Skip to content</a>
<div class="contact-atmosphere" aria-hidden="true"><div class="atmosphere-grid"></div><div class="atmosphere-orb"></div></div>
<div class="page-shell">{header(depth)}<main id="content">"""

def shell_end(depth):
    return f"</main>{footer(depth)}</div></body></html>\n"

def tags_html(tags):
    return "<ul class='guide-tags'>"+"".join(f"<li>{e(tag)}</li>" for tag in tags)+"</ul>"

def card_html(item):
    link=item["slug"]+"/"
    title=e(item["title"])
    return f"""<article class="guide-card" data-category="{e(item['category']).lower()}" data-search="{e(' '.join([item['title'],item.get('description',''),item['category']]+item.get('tags',[])).lower())}">
 <a class="guide-card-link" href="{link}" aria-label="Read {title}">
   <div class="guide-card-head"><span class="guide-number">{e(item['number'])} / SERIES</span><span class="guide-category">{e(item['category'])}</span></div>
   <div class="guide-card-mark" aria-hidden="true">{e(item['number'])}<span>+</span></div>
   <h3>{title}</h3><p>{e(item.get('description',''))}</p>
   {tags_html(item.get('tags',[]))}
   <div class="guide-card-bottom"><span>READ GUIDE</span><span aria-hidden="true">↗</span></div>
 </a>
</article>"""

def index_html(articles):
    all_categories=sorted({a.get("category") or "Technical Guide" for a in articles})
    filters=''.join('<button type="button" data-category="'+e(cat).lower()+'" aria-pressed="false">'+e(cat.upper())+'</button>' for cat in all_categories)
    shell=shell_start(1,"AI-Powered Technical Guides",
      "AI-generated technical guides about Linux, Kafka, Docker, Kubernetes, Ansible, Terraform, Vault and enterprise platforms.",
      '<link rel="stylesheet" href="guides.css">','<script defer src="guides.js"></script>')
    return shell+f"""
<section class="guides-hero">
  <div class="guides-hero-copy">
   <p class="guides-kicker"><i></i> 05 / TECHNICAL GUIDES <span>—</span> AI-POWERED KNOWLEDGE</p>
   <p class="guides-overline">The knowledge library</p>
   <h1>Learn. Build. <em>Improve.</em></h1>
   <p class="guides-lead">Technical knowledge, made practical.</p>
   <p class="guides-description">I select the topics. An AI agent helps create the technical guides.
   Each guide covers architecture, commands and production practices.</p>
   <a class="guides-jump" href="#guide-library">EXPLORE ALL GUIDES <span aria-hidden="true">↓</span></a>
  </div>
  <div class="guides-hero-art" aria-hidden="true">
    <div class="guides-art-ring"></div><div class="guides-art-ring two"></div>
    <span class="guides-art-center">&lt;/&gt;</span><span class="guides-art-small">AI / CODE / SYSTEMS</span>
  </div>
</section>
<section class="guides-process" aria-label="How guides are created">
  <div><span>01</span><b>I CHOOSE</b><p>Real technical topics</p></div>
  <div><span>02</span><b>AI ASSISTS</b><p>Structured learning material</p></div>
  <div><span>03</span><b>YOU LEARN</b><p>Practical references</p></div>
</section>
<section id="guide-library" class="guides-library" aria-labelledby="guides-title">
 <div class="guides-section-heading"><div><p>DOCUMENTATION LIBRARY <span>05—01</span></p><h2 id="guides-title">All <em>guides.</em></h2></div><span>{len(articles):02d} / PUBLISHED</span></div>
 <div class="guides-toolbar">
    <div class="guides-search-head"><label for="guides-search">FIND A TOPIC</label><span id="guides-count" aria-live="polite">{len(articles)} GUIDES</span></div>
    <div class="guides-search-row"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
     <input id="guides-search" type="search" autocomplete="off" placeholder="Search Ansible, Kafka, Linux..." aria-controls="guides-grid">
     <button id="guides-clear" type="button" aria-label="Clear search" hidden>×</button></div>
    <div class="guides-filters" role="group" aria-label="Filter by topic">
     <button type="button" data-category="all" aria-pressed="true">ALL TOPICS</button>{filters}
    </div>
 </div>
 <div id="guides-grid" class="guides-grid">{''.join(card_html(a) for a in articles)}</div>
 <div id="guides-empty" class="guides-empty" hidden><p>No matching guides.</p><button id="guides-reset" type="button">SHOW ALL GUIDES ↗</button></div>
</section>
<section class="guides-closing"><div><p>CONTINUOUS LEARNING</p><h2>A library that <em>grows.</em></h2><span>New published guides appear here automatically.</span></div><a href="../contact/">LET’S TALK <span aria-hidden="true">↗</span></a></section>
<div class="guides-legal">© 2019 SOHEIL FATTAHIEH <span>·</span> TECHNICAL GUIDES</div>
"""+shell_end(1)

def toc_html(body):
    soup=BeautifulSoup(body or "","html.parser")
    toc=[]
    seen=set()
    for heading in soup.find_all(["h2","h3"]):
        if len(toc)>=15:break
        label=heading.get_text(" ",strip=True)
        if not label or len(label)>110:continue
        sid=heading.get("id")
        if not sid:
            sid=re.sub(r"[^a-z0-9]+","-",label.lower()).strip("-")[:75]
        if not sid:continue
        base=sid;n=2
        while sid in seen:sid=f"{base}-{n}";n+=1
        heading["id"]=sid;seen.add(sid);toc.append((sid,label))
    nav=''.join(f'<a href="#{e(sid)}">{e(label)} <span aria-hidden="true">↗</span></a>' for sid,label in toc)
    return str(soup),nav

def article_html(article,i,articles):
    slug=article["slug"]
    number=e(article.get("number","--"))
    body=article.get("body_html") or ""
    has_content=bool(len(BeautifulSoup(body,"html.parser").get_text(" ",strip=True))>260)
    if has_content:
        body,nav=toc_html(body)
    else:
        body=f"""<div class="guide-pending">
           <h2 id="guide-source">Published on WordPress</h2>
           <p>{e(article.get('description',''))}</p>
           <p>The complete published version is available from the original article.
              Its full content is added here by the automatic WordPress sync.</p>
           <a href="{e(article['source_url'])}" target="_blank" rel="noopener noreferrer">READ THE FULL GUIDE ON WORDPRESS <span aria-hidden="true">↗</span></a></div>"""
        nav='<a href="#guide-source">Original article <span aria-hidden="true">↗</span></a>'
    prev=articles[(i-1)%len(articles)];nxt=articles[(i+1)%len(articles)]
    page=shell_start(2,article["title"],article.get("description",""),
      '<link rel="stylesheet" href="../guides.css"><link rel="stylesheet" href="../article.css">',
      '<script defer src="../article.js"></script>')
    return page+f"""
<nav class="guide-breadcrumb" aria-label="Breadcrumb">
 <a href="../">ALL TECHNICAL GUIDES <span aria-hidden="true">↖</span></a><span>/</span>
 <span>GUIDE {number} / {len(articles):02d}</span></nav>
<section class="guide-article-hero" aria-labelledby="article-title">
 <div><p class="guides-kicker"><i></i> {number} / TECHNICAL GUIDE <span>—</span> {e(article['category']).upper()}</p>
 <h1 id="article-title">{e(article['title'])}<span>.</span></h1>
 <p class="guide-article-intro">{e(article.get('description',''))}</p>
 {tags_html(article.get('tags',[]))}
 <div class="guide-article-actions"><a href="#article-content">START READING <span aria-hidden="true">↓</span></a>
 <a href="{e(article['source_url'])}" target="_blank" rel="noopener noreferrer">ORIGINAL ARTICLE <span aria-hidden="true">↗</span></a>
 <button id="guide-copy" type="button">COPY LINK <span aria-hidden="true">↗</span></button><span id="guide-copy-status" role="status" aria-live="polite"></span></div>
 </div><div class="guide-article-number" aria-hidden="true">{number}</div>
</section>
<div class="guide-reader" id="article-content">
 <aside class="guide-contents"><p>ON THIS PAGE</p><nav aria-label="Article table of contents">{nav}</nav>
   <a class="guide-contents-back" href="../">← ALL GUIDES</a></aside>
 <article class="guide-article-body" aria-label="Technical article content">{body}</article>
</div>
<section class="guide-original"><span>SOURCE OF TRUTH</span><p>This guide comes from my WordPress AI documentation system.
Published articles are mirrored into GitHub Pages.</p>
<a href="{e(article['source_url'])}" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL GUIDE <span aria-hidden="true">↗</span></a></section>
<nav class="guide-related" aria-label="Other technical guides">
  <a href="../{e(prev['slug'])}/" rel="prev"><span>← PREVIOUS GUIDE</span><strong>{e(prev['title'])}</strong></a>
  <a href="../{e(nxt['slug'])}/" rel="next"><span>NEXT GUIDE →</span><strong>{e(nxt['title'])}</strong></a>
</nav>
<div class="guide-end"><a href="../">VIEW ALL GUIDES <span aria-hidden="true">↗</span></a><a href="../../contact/">LET’S TALK <span aria-hidden="true">↗</span></a></div>
"""+shell_end(2)

def write_changed(file,contents):
    file.parent.mkdir(parents=True,exist_ok=True)
    if file.exists() and file.read_text(encoding="utf8")==contents:return False
    file.write_text(contents,encoding="utf8")
    return True

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--offline",action="store_true",help="Use saved published catalog without contacting WordPress")
    args=parser.parse_args()
    data=json.loads(CATALOG.read_text(encoding="utf8"))
    articles=data["guides"]
    if not args.offline:
        try:
            posts,source=get_wordpress_posts()
            articles,enriched,matched=merge_published(articles,posts)
            if not matched:
                raise RuntimeError("WordPress API did not return matching approved series posts")
            data["guides"]=articles
            write_changed(CATALOG,json.dumps(data,indent=2,ensure_ascii=False)+"\n")
            print(f"{source}: matched {matched} published articles; {enriched} full guide bodies synced")
        except Exception as err:
            print(f"Keeping existing verified content (sync unavailable): {err}",file=sys.stderr)
    changes=int(write_changed(GUIDES/"index.html",index_html(articles)))
    for i,article in enumerate(articles):
        path=GUIDES/article["slug"]/"index.html"
        changes+=int(write_changed(path,article_html(article,i,articles)))
    print(f"Built {len(articles)} technical guides ({changes} changed HTML pages).")
    if len(articles)<11:raise RuntimeError("Published technical series unexpectedly shrank")

if __name__=="__main__":main()
