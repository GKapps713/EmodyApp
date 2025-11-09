#!/usr/bin/env bash
set -xe
exec 1>>/var/log/eb-hooks.log 2>&1

# FFmpeg가 이미 설치되어 있으면 스킵
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  echo "[HOOK] ffmpeg/ffprobe already present. skipping."
  exit 0
fi

echo "[HOOK] installing static ffmpeg..."
cd /tmp
curl -L -o ffmpeg.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
if [ $? -ne 0 ]; then
  echo "[HOOK] Error downloading ffmpeg.tar.xz. Exiting."
  exit 1
fi

tar xf ffmpeg.tar.xz
if [ $? -ne 0 ]; then
  echo "[HOOK] Error extracting ffmpeg.tar.xz. Exiting."
  exit 1
fi

# 가장 최근 폴더명 찾기
FFDIR=$(find . -maxdepth 1 -type d -name "ffmpeg-*-amd64-static" | head -n1)
if [ -z "$FFDIR" ]; then
  echo "[HOOK] Error: ffmpeg directory not found. Exiting."
  exit 1
fi

cp "$FFDIR/ffmpeg" /usr/bin/ffmpeg
cp "$FFDIR/ffprobe" /usr/bin/ffprobe
chmod 755 /usr/bin/ffmpeg /usr/bin/ffprobe

echo "[HOOK] ffmpeg installed at $(command -v ffmpeg)"
ffmpeg -version | head -n1 || true
