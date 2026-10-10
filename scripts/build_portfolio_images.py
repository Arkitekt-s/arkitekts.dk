#!/usr/bin/env python3
"""One-time migration of verified portfolio photos to self-hosted WebP.

The source images are the user's published images on arkitekts.dk.
The visual layout never requires WordPress to stay online after migration.
"""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"portfolio"/"assets"
PREFIX="https://arkitekts.dk/wp-content/uploads/"
PHOTOS={
    "web-development.webp":"2022/04/website-1.png",
    "copenhagen-valuation.webp":"2019/02/PRICE-COPENHAGEN.png",
    "basecamp-response.webp":"2019/02/twentyfour-830x498.png",
    "shopflow-mobile.webp":"2019/02/arkitekts-mobile2-230x458.png",
    "camp-booking.webp":"2019/02/camp-university-of-copenhagen-830x474.png"
}

def main():
    DEST.mkdir(parents=True,exist_ok=True)
    for filename,path in PHOTOS.items():
        req=Request(PREFIX+path,headers={"User-Agent":"Mozilla/5.0 (compatible; SoheilPortfolioPreview/1.0)"})
        with urlopen(req,timeout=50) as response:
            blob=response.read()
        if len(blob)<5000:
            raise RuntimeError(f"Unexpectedly small image: {path}")
        pic=ImageOps.exif_transpose(Image.open(BytesIO(blob))).convert("RGBA")
        if pic.width<200 or pic.height<200:
            raise RuntimeError(f"Bad image geometry: {filename} {pic.size}")
        pic.thumbnail((1100,800),Image.Resampling.LANCZOS)
        outfile=DEST/filename
        pic.save(outfile,"WEBP",quality=91,method=6,exact=True)
        check=Image.open(outfile)
        print(f"{filename}: {check.width}x{check.height}, {outfile.stat().st_size:,} bytes")
    if set(p.name for p in DEST.glob("*.webp"))!=set(PHOTOS):
        raise RuntimeError("Expected exactly five self-hosted project screenshots.")
    print("SUCCESS: all original portfolio screenshots are self-hosted.")

if __name__=="__main__":
    main()
