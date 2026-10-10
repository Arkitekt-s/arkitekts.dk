#!/usr/bin/env python3
"""Preserve the original TwentyFour company logo from the published project.

This image is company identity artwork, not an application screenshot.
Save a self-hosted optimized WebP so the new site works without WordPress.
"""
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/"portfolio"/"assets"/"original"/"basecamp-response"/"twentyfour-brand.webp"
SOURCE="https://arkitekts.dk/wp-content/uploads/2019/02/24-white.png"

def main():
    req=Request(SOURCE,headers={"User-Agent":"Mozilla/5.0 (Soheil Portfolio Media Migration)"})
    with urlopen(req,timeout=40) as res:blob=res.read()
    if len(blob)<5000:raise RuntimeError("Original company branding unavailable.")
    picture=ImageOps.exif_transpose(Image.open(BytesIO(blob))).convert("RGB")
    if min(picture.size)<400:raise RuntimeError(f"Unexpected logo: {picture.size}")
    picture.thumbnail((1000,1400),Image.Resampling.LANCZOS)
    TARGET.parent.mkdir(parents=True,exist_ok=True)
    picture.save(TARGET,"WEBP",quality=93,method=6)
    check=Image.open(TARGET)
    if check.width<400 or check.height<400:raise RuntimeError("Exported branding too small")
    print("Preserved original TwentyFour logo:",TARGET.relative_to(ROOT),picture.size,TARGET.stat().st_size)

if __name__=="__main__":main()
