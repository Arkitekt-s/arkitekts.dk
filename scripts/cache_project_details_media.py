#!/usr/bin/env python3
"""Cache original WordPress project gallery pictures into GitHub Pages."""
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen, Request
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"portfolio"/"assets"
SOURCE="https://arkitekts.dk/wp-content/uploads/2019/02/"
ASSETS={
  "web-autocad.webp":"soheil-fattahieh1.png",
  "copenhagen-analysis.webp":"final-prediction_005.png",
  "copenhagen-influences.webp":"final-prediction_002.png",
}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for filename,source in ASSETS.items():
        request=Request(SOURCE+source,headers={"User-Agent":"Mozilla/5.0 (compatible; SoheilPortfolioPreview/1.0)"})
        with urlopen(request,timeout=50) as response:
            binary=response.read()
        if len(binary)<9000:
            raise RuntimeError(f"Original project image too small: {source}")
        pic=ImageOps.exif_transpose(Image.open(BytesIO(binary))).convert("RGBA")
        if min(pic.size)<400:
            raise RuntimeError(f"Unexpected original image dimensions: {source}: {pic.size}")
        pic.thumbnail((1300,960),Image.Resampling.LANCZOS)
        output=OUT/filename
        pic.save(output,"WEBP",quality=93,method=6,exact=True)
        print(f"Cached {source} -> {filename}, {pic.width}x{pic.height}, {output.stat().st_size} bytes")
    print("All three original project gallery images available locally.")

if __name__=="__main__":
    main()
