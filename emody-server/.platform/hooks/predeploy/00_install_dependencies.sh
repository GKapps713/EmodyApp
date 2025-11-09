#!/usr/bin/env bash
set -xe
exec 1>>/var/log/eb-hooks.log 2>&1

# 1. Python 3 설치
echo "[HOOK] Installing Python 3..."
bash .platform/hooks/predeploy/02_install_python.sh

# 2. FFmpeg 설치
echo "[HOOK] Installing FFmpeg..."
bash .platform/hooks/predeploy/01_install_ffmpeg.sh

# 3. PySceneDetect 설치
echo "[HOOK] Installing PySceneDetect..."
bash .platform/hooks/predeploy/03_install_scenedetect.sh

echo "[HOOK] All dependencies are installed successfully."
