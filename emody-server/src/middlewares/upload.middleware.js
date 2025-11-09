// src/middlewares/upload.middleware.js

// ESM module
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const DEFAULT_MAX_SIZE_MB = Number(process.env.MAX_UPLOAD_MB || 500);

// 업로드 루트 (상대경로면 EB에서는 /var/app/current/ 기준)
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads');

// 폴더 보장
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 파일명: <timestamp>_<rand>.<ext>
function makeFilename(originalname) {
  const ext = path.extname(originalname) || '';
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}_${rand}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, makeFilename(file.originalname)),
});

// 허용 MIME
const ACCEPTED = new Set([
  // video
  'video/mp4',
  'video/quicktime',      // .mov
  'video/x-matroska',     // .mkv
  'video/webm',
  // audio (향후 음악 업로드 경로 재사용 가능)
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
]);

function fileFilter(req, file, cb) {
  if (ACCEPTED.has(file.mimetype)) return cb(null, true);
  cb(new Error(`Unsupported file type: ${file.mimetype}`));
}

export const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: DEFAULT_MAX_SIZE_MB * 1024 * 1024, // bytes
  },
});
