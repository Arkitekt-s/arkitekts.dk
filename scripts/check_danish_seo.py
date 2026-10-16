#!/usr/bin/env python3
"""Check that the public sitemap points to distinct, indexable Danish SEO pages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = "https://arkitekts.dk"

class SEOParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = []
        self.meta = {}
        self.canonical = []
        self.danish_sections = 0
        self.in_danish_summary = False
        self.summary_words = []
        self.html_lang = None
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.html_lang = a.get("lang")
        if tag == "title":
            self.in_title = True
        if tag == "meta" and a.get("name"):
            self.meta[a["name"].lower()] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical.append(a.get("href", ""))
        if tag == "section" and "danish-search-summary" in a.get("class", "").split() and a.get("lang") == "da":
            self.danish_sections += 1
            self.in_danish_summary = True
    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "section":
            self.in_danish_summary = False
    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if self.in_danish_summary:
            self.summary_words.extend(data.split())

def main():
    xml = ET.parse(ROOT / "sitemap.xml")
    urls = [n.text for n in xml.findall(".//{*}loc")]
    errors = []
    seen_titles = set()
    seen_descriptions = set()
    if len(urls) != len(set(urls)):
        errors.append("Sitemap contains duplicate URLs")
    if len(urls) != 23:
        errors.append(f"Expected 23 intentional public pages, got {len(urls)}")
    if HOST + "/it-drift/" in urls:
        errors.append("Retired IT-drift support page must not be in sitemap")
    for url in urls:
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.netloc != "arkitekts.dk":
            errors.append(f"Unexpected sitemap host: {url}")
            continue
        local = ROOT / unquote(parsed.path).lstrip("/") / "index.html"
        if not local.exists():
            errors.append(f"Missing page: {url}")
            continue
        p = SEOParser()
        p.feed(local.read_text(encoding="utf-8"))
        title = " ".join(p.title).strip()
        description = p.meta.get("description", "")
        if len(title) < 20 or title in seen_titles:
            errors.append(f"Missing or duplicate page title: {url}")
        if len(description) < 70 or description in seen_descriptions:
            errors.append(f"Missing, too short or duplicate description: {url}")
        seen_titles.add(title)
        seen_descriptions.add(description)
        if p.canonical != [url]:
            errors.append(f"Canonical mismatch: {url}: {p.canonical}")
        if "noindex" in p.meta.get("robots", "").lower():
            errors.append(f"Noindex on public page: {url}")
        if p.html_lang != "da":
            errors.append(f"Default source HTML must declare Danish on {url}; got {p.html_lang}")
        if p.danish_sections != 1:
            errors.append(f"Expected one Danish context section on {url}; got {p.danish_sections}")
        if len(p.summary_words) < 65:
            errors.append(f"Not enough useful Danish text directly in HTML on {url}: {len(p.summary_words)} words")
    # Keep the previously indexed support URL as a redirect, not a content page.
    retired = (ROOT / "it-drift" / "index.html").read_text(encoding="utf-8")
    destination = "https://arkitekts.dk/software-skills/"
    if 'content="0; url=' + destination + '"' not in retired:
        errors.append("Retired IT-drift page must redirect immediately to existing Skills")
    if 'rel="canonical" href="' + destination + '"' not in retired:
        errors.append("Retired IT-drift page needs Skills canonical")
    if 'noindex,follow' not in retired:
        errors.append("Retired IT-drift page must not be indexable")
    for path in ("index.html", "profile/index.html", "software-skills/index.html", "technical-guides/index.html"):
        if 'href="/it-drift/"' in (ROOT / path).read_text(encoding="utf-8"):
            errors.append(f"Original pages still link to retired SEO guide: {path}")
    # Keep every old indexed technical article URL working after the WordPress move.
    # An instant meta refresh is supported as a permanent move on static GitHub Pages.
    for url in urls:
        path = urlparse(url).path.strip("/")
        if not path.startswith("technical-guides/"):
            continue
        slug = path.removeprefix("technical-guides/").strip("/")
        if not slug:
            continue
        old_page = ROOT / slug / "index.html"
        if not old_page.is_file():
            errors.append(f"Missing legacy article redirect: /{slug}/")
            continue
        old_html = old_page.read_text(encoding="utf-8")
        expected_refresh = f'content="0; url={url}"'
        expected_canonical = f'rel="canonical" href="{url}"'
        if expected_refresh not in old_html or expected_canonical not in old_html:
            errors.append(f"Broken or incorrect legacy article redirect: /{slug}/")
    legacy = ROOT / "concepts/frame-five-contact/index.html"
    old = legacy.read_text(encoding="utf-8")
    if 'noindex,follow' not in old or 'location.replace' not in old or "<video" in old:
        errors.append("Old duplicate route must remain noindex and redirect")
    if errors:
        for msg in errors:
            print("FAIL:", msg, file=sys.stderr)
        return 1
    print(f"PASS: {len(urls)} indexable canonical pages with distinct Danish SEO content.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
