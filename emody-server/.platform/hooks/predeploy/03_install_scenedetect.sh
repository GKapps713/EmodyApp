#!/usr/bin/env bash
set -xe
exec 1>>/var/log/eb-hooks.log 2>&1

# Python 3 설치 (만약 없으면)
if ! command -v python3 >/dev/null 2>&1; then
  echo "[HOOK] Installing Python 3..."
  apt-get update
  apt-get install -y python3 python3-pip
fi

# PySceneDetect 설치
if ! python3 -m pip show scenedetect >/dev/null 2>&1; then
  echo "[HOOK] Installing PySceneDetect..."
  python3 -m pip install scenedetect
  if [ $? -ne 0 ]; then
    echo "[HOOK] Error installing scenedetect. Exiting."
    exit 1
  fi
fi

# OpenCV 설치 (이미 설치되어 있는지 확인)
if ! python3 -m pip show opencv-python >/dev/null 2>&1; then
  echo "[HOOK] Installing OpenCV..."
  python3 -m pip install opencv-python
  if [ $? -ne 0 ]; then
    echo "[HOOK] Error installing opencv-python. Exiting."
    exit 1
  fi
else
  echo "[HOOK] OpenCV (opencv-python) is already installed."
fi

# 시스템에 맞는 패키지 관리자 확인 (Amazon Linux의 경우 'yum', Ubuntu의 경우 'apt-get')
if command -v yum >/dev/null 2>&1; then
    # Amazon Linux 또는 CentOS, RHEL
    echo "[HOOK] Checking libGL installation on a yum-based system..."
    if ! ldconfig -p | grep -q 'libGL.so.1'; then
        echo "[HOOK] Installing libGL..."
        yum install -y mesa-libGL
    else
        echo "[HOOK] libGL already installed."
    fi
elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu 또는 Debian 기반
    echo "[HOOK] Checking libGL installation on an apt-based system..."
    if ! ldconfig -p | grep -q 'libGL.so.1'; then
        echo "[HOOK] Installing libGL..."
        apt-get update && apt-get install -y libgl1-mesa-glx
    else
        echo "[HOOK] libGL already installed."
    fi
else
    echo "[HOOK] Unknown package manager. Could not check or install libGL."
    exit 1
fi

echo "[HOOK] libGL installation check completed."

echo "[HOOK] PySceneDetect installed successfully."
