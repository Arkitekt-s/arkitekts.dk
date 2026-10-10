#!/usr/bin/env python3
"""Fetch the original published portrait and remove its baked-in checkerboard.

The published PNG is NOT genuinely transparent. Its off-white/grey checker
background is opaque. Separating the connected foreground lets the actual
site display a clean portrait over our own violet atmosphere.

This is a one-time build step. The resulting WebP lives in the repository;
the browser does NOT download a remote image or run image processing JS.
"""
from __future__ import annotations

from pathlib import Path
from urllib.request import Request, urlopen
from io import BytesIO
import cv2
import numpy as np
from PIL import Image

PHOTO_URL="https://arkitekts.dk/wp-content/uploads/2026/07/soheil.transparent-e1783081143381.png"
OUTPUT=Path(__file__).resolve().parents[1]/"profile"/"assets"/"soheil-cutout.webp"


def main() -> None:
    request=Request(PHOTO_URL,headers={"User-Agent":"Mozilla/5.0 (compatible; SoheilPortfolioPreview/1.0)"})
    with urlopen(request,timeout=40) as response:
        content=response.read()
    if not content or len(content)<5000:
        raise RuntimeError("Original published portrait could not be retrieved.")

    original=Image.open(BytesIO(content)).convert("RGB")
    rgb=np.asarray(original,dtype=np.uint8)
    if original.width<300 or original.height<300:
        raise RuntimeError(f"Unexpected tiny source portrait: {original.size}")

    # The background consists only of near-white or light-gray squares.
    # Hair, jacket and skin have lower luminance and/or warm saturation.
    color_min=rgb.min(axis=2).astype(np.int16)
    color_range=rgb.max(axis=2).astype(np.int16)-color_min
    foreground=np.where((color_min<222)|(color_range>27),255,0).astype(np.uint8)

    # Join fine hair strands to the head and fill highlights such as teeth,
    # so interior light pixels are not mistaken for transparent background.
    foreground=cv2.morphologyEx(
        foreground,cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3))
    )
    foreground[0,:]=0
    foreground[:,0]=0
    foreground[:,-1]=0
    count,labels,stats,_=cv2.connectedComponentsWithStats(foreground,connectivity=8)
    if count<2:
        raise RuntimeError("No portrait foreground was detected.")
    component=max(range(1,count),key=lambda i:stats[i,cv2.CC_STAT_AREA])
    coverage=stats[component,cv2.CC_STAT_AREA]/(original.width*original.height)
    if not .10<coverage<.8:
        raise RuntimeError(f"Mask detection unsafe: {coverage:.2%} foreground")

    silhouette=np.where(labels==component,255,0).astype(np.uint8)
    contours,_=cv2.findContours(silhouette,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(silhouette,contours,-1,255,thickness=cv2.FILLED)
    # Subtle edge feathering prevents jagged checkerboard remnants.
    silhouette=cv2.GaussianBlur(silhouette,(3,3),sigmaX=.65)

    ys,xs=np.where(silhouette>5)
    margin=max(7,int(original.width*.018))
    left=max(0,int(xs.min())-margin)
    top=max(0,int(ys.min())-margin)
    right=min(original.width,int(xs.max())+margin+1)
    bottom=min(original.height,int(ys.max())+1)

    rgba=np.dstack([rgb,silhouette])
    cutout=Image.fromarray(rgba,"RGBA").crop((left,top,right,bottom))
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    cutout.save(OUTPUT,"WEBP",lossless=False,quality=94,method=6,exact=True)

    check=Image.open(OUTPUT).convert("RGBA")
    corners=[check.getpixel((x,y))[3] for x,y in [
       (0,0),(check.width-1,0),(0,check.height//3),(check.width-1,check.height//3)
    ]]
    if max(corners)>25:
        raise RuntimeError(f"Image still contains opaque background at corners: {corners}")
    if check.getpixel((check.width//2,check.height//2))[3]<240:
        raise RuntimeError("Portrait centre unexpectedly transparent.")
    print(f"Source: {original.width}x{original.height}, cutout: {check.width}x{check.height}")
    print(f"Foreground {coverage:.1%}; clean alpha; output {OUTPUT.stat().st_size:,} bytes")


if __name__=="__main__":
    main()
