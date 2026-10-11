#!/usr/bin/env python3
"""Sanity checks for the static arkitekts.dk preview.

Fast, dependency-free checks for basic link integrity and responsive setup.
These are not replacements for browser, accessibility or Lighthouse tests.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1]


class DocumentParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.hrefs = []
        self.resources = []
        self.duplicate_ids = set()
        self.base_href = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            if a["id"] in self.ids:
                self.duplicate_ids.add(a["id"])
            self.ids.add(a["id"])
        if tag == "base" and a.get("href"):
            self.base_href = a["href"]
        elif a.get("href"):
            self.hrefs.append(a["href"])
        if tag == "script" and a.get("src"):
            self.resources.append(a["src"])
        if tag == "img" and a.get("src"):
            self.resources.append(a["src"])


def main():
    errors = []
    pages = sorted(ROOT.rglob("*.html"))
    if not pages:
        errors.append("No HTML pages found.")
    for page in pages:
        parser = DocumentParser()
        parser.feed(page.read_text(encoding="utf-8"))
        if parser.duplicate_ids:
            errors.append(f"{page.relative_to(ROOT)}: duplicate IDs {sorted(parser.duplicate_ids)}")
        # Respect the HTML <base> URL when resolving relative resources.
        # Root-relative links map to the site root, not the document folder.
        base_dir = page.parent
        if parser.base_href:
            base_url = urlsplit(parser.base_href)
            if base_url.scheme or base_url.netloc:
                errors.append(f"{page.relative_to(ROOT)}: unexpected external base URL")
            elif base_url.path:
                base_path = unquote(base_url.path)
                base_dir = ((ROOT / base_path.lstrip("/")) if base_path.startswith("/")
                            else (page.parent / base_path)).resolve()
                if not base_dir.is_relative_to(ROOT):
                    errors.append(f"{page.relative_to(ROOT)}: base URL escapes repository")
        for target in parser.hrefs + parser.resources:
            url = urlsplit(target)
            if url.scheme or url.netloc or target.startswith("//"):
                continue
            if url.path:
                path = unquote(url.path)
                candidate = ((ROOT / path.lstrip("/")) if path.startswith("/")
                             else (base_dir / path)).resolve()
                if not candidate.is_relative_to(ROOT):
                    errors.append(f"{page.relative_to(ROOT)}: link escapes repository: {target}")
                    continue
                if candidate.is_dir():
                    candidate /= "index.html"
                if not candidate.is_file():
                    errors.append(f"{page.relative_to(ROOT)}: missing link/resource: {target}")
            if url.fragment and (not url.path or unquote(url.path) in (".", page.name)):
                if unquote(url.fragment) not in parser.ids:
                    errors.append(f"{page.relative_to(ROOT)}: missing anchor: {target}")
        print(f"Checked {page.relative_to(ROOT)}")

    css = ROOT / "assets" / "styles.css"
    if not css.exists():
        errors.append("Missing assets/styles.css")
    else:
        styles = css.read_text(encoding="utf-8")
        if "@media(max-width:760px)" not in styles:
            errors.append("Missing tablet/mobile breakpoint")
        if "@media(max-width:530px)" not in styles:
            errors.append("Missing small-mobile breakpoint")
        if "prefers-reduced-motion" not in styles:
            errors.append("Missing reduced-motion styles")
    if errors:
        print("\n".join("FAIL: " + error for error in errors), file=sys.stderr)
        return 1
    print("PASS: relative links, fragments and responsive design scaffolding.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
