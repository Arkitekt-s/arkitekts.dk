#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
for kind in landscape synthid square; do
 source="assets/videos/optimized/hero-$kind.mp4"
 target="assets/videos/optimized/hero-$kind-mobile.mp4"
 test -s "$source"
 ffmpeg -hide_banner -loglevel error -y -i "$source" -map 0:v:0 \
   -vf "scale=-2:720,fps=24" -c:v libx264 -preset fast -b:v 900k \
   -maxrate 1100k -bufsize 1500k -g 24 -keyint_min 24 \
   -pix_fmt yuv420p -an -movflags +faststart "$target"
 echo "MOBILE_VIDEO $kind $(du -h "$target" | cut -f1)"
 ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration,size,bit_rate -of json "$target"
done
python3 - <<'PY'
from pathlib import Path
for p in sorted(Path('assets/videos/optimized').glob('hero-*-mobile.mp4')):
 data=p.read_bytes()
 moov=data.find(b'moov');mdat=data.find(b'mdat')
 assert 0<moov<mdat, f'moov atom not frontloaded: {p}'
 assert p.stat().st_size<6_000_000, f'mobile media too large: {p}'
 print('MOBILE_FASTSTART_VERIFIED',p,p.stat().st_size)
assert len(list(Path('assets/videos/optimized').glob('hero-*-mobile.mp4')))==3
PY
