// src/services/ffmpeg.service.js

import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getUploadDir, resolveUploadPath, toPublicUrl } from './storage.service.js';

// -----------------------------
// 실행 파일 경로 탐색 유틸
// -----------------------------
function isExecutable(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function pickFirstExisting(candidates) {
  for (const c of candidates) {
    if (!c) continue;
    try {
      if (fs.existsSync(c) && isExecutable(c)) return c;
    } catch {}
  }
  return null;
}

// -----------------------------
// ffmpeg/ffprobe 경로 설정 (시스템 우선, 환경변수/패키지 경로 폴백)
// -----------------------------
try {
  const ffmpegPath = pickFirstExisting([
    process.env.FFMPEG_PATH,           // 사용자가 지정한 경로
    '/usr/bin/ffmpeg',                 // EB(Amazon Linux) 기본 설치 경로
    '/usr/local/bin/ffmpeg',           // 기타 리눅스/도커 이미지
  ]);

  if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('[FFMPEG] using ffmpeg:', ffmpegPath);
  } else {
    // 경로를 지정하지 않으면 PATH상의 ffmpeg 시도 (fluent-ffmpeg 내부)
    console.warn('[FFMPEG] ffmpeg binary not found by path probe; relying on PATH resolution');
  }
} catch (e) {
  console.error('[FFMPEG] setFfmpegPath failed:', e?.message || e);
}

try {
  const ffprobePath = pickFirstExisting([
    // ffprobe-static이 있으면 우선 사용
    ffprobeStatic && ffprobeStatic.path,
    process.env.FFPROBE_PATH,
    '/usr/bin/ffprobe',
    '/usr/local/bin/ffprobe',
  ]);

  if (ffprobePath) {
    ffmpeg.setFfprobePath(ffprobePath);
    console.log('[FFMPEG] using ffprobe:', ffprobePath);
  } else {
    console.warn('[FFMPEG] ffprobe binary not found by path probe; relying on PATH resolution');
  }
} catch (e) {
  console.error('[FFMPEG] setFfprobePath failed:', e?.message || e);
}

// -----------------------------
// __dirname 대체 (ESM)
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// 유틸
// -----------------------------
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    try { fs.chmodSync(dir, 0o755); } catch {}
  }
}

/**
 * ffprobe로 비디오 메타데이터 추출
 * @param {string} filePath 절대경로
 * @returns {Promise<{width?:number,height?:number,duration?:number}>}
 */
export function probeVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const v = (metadata?.streams || []).find(s => s.codec_type === 'video') || {};
      resolve({
        width: v.width,
        height: v.height,
        duration: metadata?.format?.duration
          ? Number(metadata.format.duration)
          : (typeof v.duration === 'number' ? v.duration : undefined),
      });
    });
  });
}

/**
 * 비디오와 오디오를 합성하여 새로운 mp4 생성
 * - 비디오는 재인코딩 없이 복사(-c:v copy)
 * - 오디오는 AAC 인코딩(-c:a aac, -b:a 192k)
 * - 짧은 쪽 길이에 맞춰 컷(-shortest)
 * - 웹 재생 최적화(-movflags +faststart)
 *
 * @param {string} videoId 업로드된 비디오 파일명(uploads 내부)
 * @param {string} audioId 업로드된 오디오(mp3) 파일명(uploads 내부)
 * @param {{ onProgress?: (percent:number)=>void }} opts
 * @returns {Promise<{ mergedId:string, mergedUrl:string, width?:number, height?:number, duration?:number }>}
 */
export async function mergeVideoAndAudio(videoId, audioId, opts = {}) {
  const uploadDir = getUploadDir();
  ensureDir(uploadDir);

  const videoPath = resolveUploadPath(videoId);
  const audioPath = resolveUploadPath(audioId);

  if (!fs.existsSync(videoPath)) throw new Error(`Video file not found: ${videoPath}`);
  if (!fs.existsSync(audioPath)) throw new Error(`Audio file not found: ${audioPath}`);

  const outputFilename = `merged_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
  const outputPath = path.resolve(uploadDir, outputFilename);

  // 입력/출력 로그
  const vStat = fs.statSync(videoPath);
  const aStat = fs.statSync(audioPath);
  console.log('[FFMPEG] input video:', videoPath, vStat.size, 'bytes');
  console.log('[FFMPEG] input audio:', audioPath, aStat.size, 'bytes');
  console.log('[FFMPEG] output path:', outputPath);

  const report = (p) => {
    try {
      if (typeof opts.onProgress === 'function') {
        const percent = Math.max(0, Math.min(100, Math.round(Number(p) || 0)));
        opts.onProgress(percent);
      }
    } catch {}
  };

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-map 0:v:0',
        '-map 1:a:0',
        '-c:v copy',
        '-c:a aac',
        '-b:a 192k',
        '-shortest',
        '-movflags +faststart',
        '-y',
      ])
      .on('start', (commandLine) => {
        console.log('[FFMPEG] start:', commandLine);
      })
      .on('progress', (p) => {
        if (p && typeof p.percent !== 'undefined') report(p.percent);
      })
      .on('stderr', (line) => {
        const s = String(line || '').toLowerCase();
        if (s.includes('error') || s.includes('resample') || s.includes('timestamp')) {
          console.log('[FFMPEG][stderr]', line.trim());
        }
      })
      .on('error', (err, stdout, stderr) => {
        console.error('[FFMPEG] error:', err?.message || err);
        if (stdout) console.log('[FFMPEG][stdout]', String(stdout).slice(0, 2000));
        if (stderr) console.log('[FFMPEG][stderr-tail]', String(stderr).slice(-2000));
        reject(err);
      })
      .on('end', async () => {
        console.log('[FFMPEG] end. probing output...');
        let meta = {};
        try {
          meta = await probeVideoMetadata(outputPath);
        } catch (e) {
          console.log('[FFMPEG] probe error:', e?.message || e);
        }
        const result = {
          mergedId: outputFilename,
          mergedUrl: toPublicUrl(outputFilename),
          ...meta,
        };
        console.log('[FFMPEG] done:', result);
        report(100);
        resolve(result);
      });

    cmd.save(outputPath);
  });
}
