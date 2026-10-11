#!/usr/bin/env python3
"""Keep the real homepage synchronized with the approved five-frame landing.

The original cinematic design lives at concepts/frame-five-contact/index.html.
The generated root index.html is a real, indexable HTML page, not a redirect.
Assets stay in their original directories and all animations remain unchanged.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "concepts/frame-five-contact/index.html"
DESTINATION = ROOT / "index.html"

def generate_homepage(source: str) -> str:
    expected = (
        '<link rel="canonical" href="https://arkitekts.dk/">',
        'assets/frame-one-hold-scenes.js',
        'assets/journey-five.js',
        'href="#frame"',
        'class="brand-icon" href="./"',
    )
    for marker in expected:
        if source.count(marker) != 1:
            raise ValueError(f"Expected exactly one source marker: {marker}")
    if source.count("<head>\n") != 1:
        raise ValueError("Cannot safely locate the page head")
    html = source.replace(
        "<head>\n",
        '<head>\n<base href="./concepts/frame-five-contact/">\n',
        1,
    )
    # The page's other relative CSS/JS/media links still resolve to their
    # original location. Only the home and skip navigation stay at the root.
    html = html.replace('href="#frame"', 'href="https://arkitekts.dk/#frame"', 1)
    html = html.replace(
        'class="brand-icon" href="./"',
        'class="brand-icon" href="https://arkitekts.dk/"',
        1,
    )
    html = html.replace(
        "<!doctype html>",
        "<!doctype html>\n"
        "<!-- Built from concepts/frame-five-contact/index.html; "
        "keep synced via scripts/build-homepage.py -->",
        1,
    )
    if 'http-equiv="refresh"' in html or 'location.replace(new URL(' in html:
        raise ValueError("Refusing to generate a redirect as the homepage")
    return html

if __name__ == "__main__":
    output = generate_homepage(SOURCE.read_text(encoding="utf-8"))
    DESTINATION.write_text(output, encoding="utf-8")
    print(f"Built {DESTINATION.relative_to(ROOT)} from {SOURCE.relative_to(ROOT)}")
