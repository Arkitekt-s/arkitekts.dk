#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
mkdir -p assets/videos/optimized
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fL --retry 3 --retry-delay 2 --connect-timeout 15 --max-time 300 \
  "https://videos.pexels.com/video-files/18069232/18069232-uhd_2560_1440_24fps.mp4" -o "$tmp/landscape.mp4"
curl -fL --retry 3 --retry-delay 2 --connect-timeout 15 --max-time 300 \
  "https://videos.pexels.com/video-files/18069165/18069165-uhd_2160_2160_24fps.mp4" -o "$tmp/square.mp4"
build(){
 local source="$1" target="$2"
 echo "ORIGINAL $(basename "$source") $(du -h "$source" | cut -f1)"
 ffprobe -v error -show_entries format=duration,size,bit_rate -of json "$source"
 ffmpeg -hide_banner -loglevel error -y -i "$source" -map 0:v:0 \
   -vf "scale=-2:1080,fps=24" -c:v libx264 -preset fast -crf 24 \
   -maxrate 3200k -bufsize 6400k -g 48 -keyint_min 24 \
   -pix_fmt yuv420p -an -movflags +faststart "$target"
 ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration,size -of json "$target"
 echo "OPTIMIZED $(basename "$target") $(du -h "$target" | cut -f1)"
}
build "$tmp/landscape.mp4" assets/videos/optimized/hero-landscape.mp4
build "assets/videos/synthid-ai-25744122.mp4" assets/videos/optimized/hero-synthid.mp4
build "$tmp/square.mp4" assets/videos/optimized/hero-square.mp4
python3 - <<'PY'
from pathlib import Path
for p in sorted(Path('assets/videos/optimized').glob('hero-*.mp4')):
 data=p.read_bytes()
 assert data.startswith(b'\x00\x00') and b'ftyp' in data[:12],p
 pos=data.find(b'moov');mdat=data.find(b'mdat')
 assert 0<pos<mdat, f'{p}: metadata must precede media for progressive startup'
 assert p.stat().st_size<21_000_000,f'{p}: too large'
 print('FASTSTART_VERIFIED',p,'size_bytes',p.stat().st_size,'moov_at',pos,'mdat_at',mdat)
assert len(list(Path('assets/videos/optimized').glob('hero-*.mp4')))==3
PY
