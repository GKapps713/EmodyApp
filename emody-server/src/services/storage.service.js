// services/storage.service.js

// ESM
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UPLOAD_DIR } from '../middlewares/upload.middleware.js';

// Re-export UPLOAD_DIR
export { UPLOAD_DIR }; // Add this line

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1순위: PUBLIC_BASE_URL (권장: https://api.emodyapp.com)
// 2순위: API_BASE_URL 또는 API_URL에서 '/api' 제거한 origin
// 3순위: 로컬 기본값
function derivePublicBaseUrl() {
  const envPublic = process.env.PUBLIC_BASE_URL?.trim();
  if (envPublic) return envPublic.replace(/\/+$/, '');

  const apiBase = (process.env.API_BASE_URL || process.env.API_URL || '').trim();
  if (apiBase) {
    try {
      const u = new URL(apiBase);
      // 만약 끝이 /api 라면 제거 후 origin+pathname 반환
      const pathname = u.pathname.replace(/\/+$/, '');
      const trimmed = pathname.endsWith('/api')
        ? pathname.slice(0, -4) // remove '/api'
        : pathname;
      return `${u.origin}${trimmed}`.replace(/\/+$/, '');
    } catch {
      // ignore parse error -> fallback
    }
  }
  return 'http://localhost:3001';
}

const PUBLIC_BASE_URL = derivePublicBaseUrl();

/** 업로드 디렉토리(절대경로) */
export function getUploadDir() {
  return UPLOAD_DIR;
}

/** 업로드 파일 절대경로 */
export function resolveUploadPath(filename) {
  return path.resolve(getUploadDir(), filename);
}

/** 업로드 파일의 퍼블릭 URL 생성 */
export function toPublicUrl(filename) {
  const base = PUBLIC_BASE_URL.replace(/\/+$/, '');
  return `${base}/uploads/${encodeURIComponent(filename)}`;
}

/** 존재 여부 체크(선택) */
export function existsInUploads(filename) {
  try {
    fs.accessSync(resolveUploadPath(filename), fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** 파일 삭제(선택) */
export function removeFromUploads(filename) {
  try {
    fs.unlinkSync(resolveUploadPath(filename));
    return true;
  } catch {
    return false;
  }
}
