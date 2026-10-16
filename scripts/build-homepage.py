#!/usr/bin/env python3
"""Validate the canonical homepage and generate the legacy-page redirect.

Root index.html is the sole source of the cinematic landing content.
The old frame-five-contact path remains only to forward saved links.
Assets are retained under their existing paths for compatibility.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "index.html"
LEGACY = ROOT / "concepts/frame-five-contact/index.html"
SITEMAP = ROOT / "sitemap.xml"

REDIRECT = "<!doctype html>\n<html lang=\"da\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n  <meta name=\"robots\" content=\"noindex,follow\">\n  <meta name=\"googlebot\" content=\"noindex,follow\">\n  <link rel=\"canonical\" href=\"https://arkitekts.dk/\">\n  <meta http-equiv=\"refresh\" content=\"0; url=../../\">\n  <title>Flyttet til arkitekts.dk</title>\n  <script>window.location.replace(new URL(\"../../\", window.location.href));</script>\n</head>\n<body><p>Siden er flyttet til <a href=\"../../\">arkitekts.dk</a>.</p></body>\n</html>\n"

def main():
    homepage = HOME.read_text(encoding="utf-8")
    required = (
        '<link rel="canonical" href="https://arkitekts.dk/">',
        '<base href="./concepts/frame-five-contact/">',
        'assets/frame-one-hold-scenes.js',
        'assets/journey-six.js',
        'id="experience-section"',
        'assets/experience-live.js',
        'id="panorama"',
        'id="frame-five-contact"',
    )
    for expected in required:
        if expected not in homepage:
            raise ValueError(f"Canonical root homepage missing: {expected}")
    if 'http-equiv="refresh"' in homepage:
        raise ValueError("Root homepage must not redirect")
    if "https://arkitekts.dk/concepts/frame-five-contact/" in SITEMAP.read_text(encoding="utf-8"):
        raise ValueError("Legacy duplicate must not be in sitemap")
    LEGACY.write_text(REDIRECT, encoding="utf-8")
    print("Verified canonical root homepage; generated redirect for old concept URL")

if __name__ == "__main__":
    main()
