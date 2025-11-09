#!/usr/bin/env bash
set -xe
exec 1>>/var/log/eb-hooks.log 2>&1

# Python 3 설치 (만약 없으면)
if ! command -v python3 >/dev/null 2>&1; then
  echo "[HOOK] Installing Python 3..."
  yum install -y python3 python3-pip
else
  echo "[HOOK] Python 3 is already installed."
fi

# pip3 설치 확인 및 설치
if ! command -v pip3 >/dev/null 2>&1; then
  echo "[HOOK] Installing pip3..."
  yum install -y python3-pip
else
  echo "[HOOK] pip3 is already installed."
fi

echo "[HOOK] Python and pip installation complete."