// server/routes/analyzeVideo.js
import { exec } from "child_process";
import express from "express";
import fs from "fs";
import pLimit from "p-limit";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeVideoWithThumbnails } from "../services/openaiService.js";

const router = express.Router();

// ───────────────────────────────────────────────────────────
// Paths & Env
// ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve("/var/app/current/uploads");
const SHOTS_DIR  = path.resolve("/var/app/current/shots");

// 동시 실행 2개 제한
const limit = pLimit(2);

// OpenCV는 있으면 사용, 없으면 null (자동 폴백)
const cvPromise = import('opencv4nodejs')
  .then((m) => m?.default ?? m)
  .catch(() => null);

// ───────────────────────────────────────────────────────────
// Exec helper
// ───────────────────────────────────────────────────────────
function execAsync(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

// ───────────────────────────────────────────────────────────
// Utilities
// ───────────────────────────────────────────────────────────
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getBaseUrl(req) {
  const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (env) return env;
  const host = req.get("host");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${proto}://${host}`;
}
function getVideoIdFromUrl(videoUrl) {
  try {
    const u = new URL(videoUrl);
    return path.basename(u.pathname);
  } catch {
    return path.basename(videoUrl);
  }
}
function assertFileExists(p) {
  if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
}
function getLocalVideoFilePath(videoId) {
  return path.join(UPLOAD_DIR, videoId);
}
async function ffprobeDuration(absPath) {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${absPath}"`
  );
  const sec = parseFloat(String(stdout).trim());
  return Number.isFinite(sec) ? sec : 0;
}
function clearOldShots(baseNameNoExt) {
  if (!fs.existsSync(SHOTS_DIR)) return;
  const files = fs.readdirSync(SHOTS_DIR);
  const re = new RegExp(`^${escapeRegex(baseNameNoExt)}-Scene-\\d{1,4}-\\d{1,4}\\.(?:jpe?g|png)$`, "i");
  let removed = 0;
  for (const f of files) {
    if (re.test(f)) {
      try { fs.unlinkSync(path.join(SHOTS_DIR, f)); removed++; } catch {}
    }
  }
  if (removed) console.log(`[clearOldShots] removed ${removed} for ${baseNameNoExt}`);
}

// ───────────────────────────────────────────────────────────
// Black intervals via ffmpeg blackdetect (샘플링 최적화)
// ───────────────────────────────────────────────────────────
async function getBlackIntervals(videoPath) {
  assertFileExists(videoPath);
  const cmd =
    `ffmpeg -hide_banner -nostats -i "${videoPath}" ` +
    `-vf "blackdetect=d=0.08:pic_th=0.98:pix_th=0.10,select=not(mod(n\\,10))" -an -f null - 2>&1`;
  const { stderr } = await execAsync(cmd);
  const intervals = [];
  const re = /black_start:(\d+(?:\.\d+)?)\s+black_end:(\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(stderr)) !== null) {
    intervals.push({ start: parseFloat(m[1]), end: parseFloat(m[2]) });
  }
  return intervals;
}
function adjustAwayFromBlack(t, intervals, pad = 0.02) {
  let tt = t;
  for (const iv of intervals) {
    if (tt >= iv.start - pad && tt <= iv.end + pad) {
      tt = iv.end + 0.05;
    }
  }
  return tt;
}

// ───────────────────────────────────────────────────────────
// Capture single frame (buffer or file)
// ───────────────────────────────────────────────────────────
async function captureFrameBuffer(videoPath, timeSec, quality = 3) {
  assertFileExists(videoPath);
  const cmd =
    `ffmpeg -hide_banner -ss ${timeSec.toFixed(3)} -i "${videoPath}" ` +
    `-frames:v 1 -q:v ${quality} -f image2pipe -vcodec mjpeg -`;
  return new Promise((resolve, reject) => {
    const child = exec(cmd, { maxBuffer: 1024 * 1024 * 50 });
    const chunks = [];
    child.stdout.on("data", (d) => chunks.push(Buffer.from(d)));
    child.on("close", () => resolve(Buffer.concat(chunks)));
    child.on("error", reject);
  });
}
async function captureFrameToFile(videoPath, timeSec, outPath, quality = 3) {
  assertFileExists(videoPath);
  const cmd =
    `ffmpeg -hide_banner -y -ss ${timeSec.toFixed(3)} -i "${videoPath}" ` +
    `-frames:v 1 -q:v ${quality} "${outPath}"`;
  await execAsync(cmd);
}

// ───────────────────────────────────────────────────────────
// Keyframe sampling & scoring
// ───────────────────────────────────────────────────────────
function keyframeCountForDuration(sec) {
  sec = Math.max(1, sec);
  if (sec <= 10) return 3;
  if (sec <= 30) return 5;
  if (sec <= 60) return 7;
  return Math.min(10, Math.max(7, Math.ceil(sec / 18)));
}

function makeCandidateTimes(durationSec, wantK, oversample = 3, safety = 0.25) {
  const n = wantK * oversample;
  const start = safety;
  const end = Math.max(safety, durationSec - safety);
  if (end <= start) return [Math.max(0, durationSec / 2)];
  const step = (end - start) / n;
  const times = [];
  for (let i = 0; i < n; i++) times.push(start + step * (i + 0.5));
  return times;
}
// 폴백: 바이트 샘플 차분 (경량)
function byteDiffScore(bufA, bufB) {
  if (!bufA || !bufB) return 0;
  const len = Math.min(bufA.length, bufB.length);
  if (len === 0) return 0;
  const stride = Math.max(1, Math.floor(len / 5000)); // 최대 5k 샘플
  let diff = 0;
  for (let i = 0; i < len; i += stride) {
    if (bufA[i] !== bufB[i]) diff++;
  }
  return diff / Math.ceil(len / stride);
}
// OpenCV가 있으면 더 정확한 차분 사용
async function opencvDiffScore(bufA, bufB) {
  const cv = await cvPromise;
  if (!cv) return null; // 없으면 사용 안함
  try {
    const imgA = cv.imdecode(bufA);
    const imgB = cv.imdecode(bufB);
    const grayA = imgA.cvtColor(cv.COLOR_BGR2GRAY).resize(64, 64);
    const grayB = imgB.cvtColor(cv.COLOR_BGR2GRAY).resize(64, 64);
    const diff = grayA.absdiff(grayB);
    const mean = diff.mean(); // [b,g,r] 혹은 [gray]
    return Array.isArray(mean) ? mean[0] : mean; // 0~255
  } catch {
    return null;
  }
}
function enforceMinGap(picks, minGapSec, t) {
  return picks.every((pt) => Math.abs(pt - t) >= minGapSec);
}

// ───────────────────────────────────────────────────────────
// withLimit 헬퍼 (p-limit로 라우트 감싸기)
// ───────────────────────────────────────────────────────────
function withLimit(handler) {
  return async (req, res, next) => {
    try {
      await limit(() => handler(req, res, next));
    } catch (e) {
      next(e);
    }
  };
}

// ───────────────────────────────────────────────────────────
// Route: POST /api/analyze-video/basic
//   - 균등/가중 샘플링 + 차분 기반 키프레임 + 검은 구간 회피
//   - 동시성 제한, 안전 재시도/클램프, OpenCV 사용 시 정확도 향상
// ───────────────────────────────────────────────────────────
router.post("/basic", withLimit(async (req, res) => {
  try {
    const { videoUrl } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });

    const videoId = getVideoIdFromUrl(videoUrl);
    const videoPath = getLocalVideoFilePath(videoId);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: `Video not found on server: ${videoId}` });
    }

    if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
    const baseNameNoExt = path.parse(videoId).name;
    const baseUrl = getBaseUrl(req);
    const shotsBaseUrl = `${baseUrl}/shots`;

    // 0) 정리
    clearOldShots(baseNameNoExt);

    // 1) 길이 (상한 180s)
    let durationSec = Math.round(await ffprobeDuration(videoPath));
    if (durationSec > 180) {
      console.warn(`[analyze] Long video: ${durationSec}s, truncating analysis to 180s`);
      durationSec = 180;
    }
    durationSec = Math.max(1, durationSec);

    console.log(`[analyze-basic] durationSec(ffprobe): ${durationSec}s`); // ✅ 명시 로그
    
    // 2) 목표 K 및 후보 타임스탬프
    const K = keyframeCountForDuration(durationSec);
    // 길이가 길수록 오버샘플 완만하게 (3 → 2.5) (미세 최적화)
    const oversample = durationSec > 120 ? 2.5 : 3;
    const candidateTimes = makeCandidateTimes(durationSec, K, oversample, 0.25);

    // 3) 검은 구간
    const blackIntervals = await getBlackIntervals(videoPath);

    // 4) 후보 프레임 추출(버퍼) & 연속 차분 스코어링
    const buffers = [];
    for (let i = 0; i < candidateTimes.length; i++) {
      let safeT = adjustAwayFromBlack(candidateTimes[i], blackIntervals);
      safeT = Math.min(Math.max(0.05, safeT), Math.max(0.06, durationSec - 0.06)); // 안전 범위
      const buf = await captureFrameBuffer(videoPath, safeT, 3);
      if (!buf || buf.length < 1500) {
        // 재시도 (영상 끝 범위 보호)
        let retryT = Math.min(safeT + 0.1, Math.max(0.06, durationSec - 0.06));
        let ok = false;
        for (let r = 0; r < 2; r++) {
          const rb = await captureFrameBuffer(videoPath, retryT, 3);
          if (rb && rb.length >= 1500) {
            buffers.push({ t: retryT, buf: rb });
            ok = true;
            break;
          }
          retryT = Math.min(retryT + 0.1, Math.max(0.06, durationSec - 0.06));
        }
        if (!ok) buffers.push({ t: safeT, buf: buf || Buffer.alloc(0) });
      } else {
        buffers.push({ t: safeT, buf });
      }
    }

    // OpenCV가 있으면 OpenCV로, 없으면 바이트 차분으로
    const cv = await cvPromise;
    let scores = [];
    if (cv) {
      // OpenCV 차분 (0~255, 높을수록 변화 큼)
      for (let i = 1; i < buffers.length; i++) {
        const s = await opencvDiffScore(buffers[i - 1].buf, buffers[i].buf);
        scores.push({ idx: i, score: (s ?? 0), t: buffers[i].t });
      }
    } else {
      for (let i = 1; i < buffers.length; i++) {
        const d = byteDiffScore(buffers[i - 1].buf, buffers[i].buf);
        scores.push({ idx: i, score: d, t: buffers[i].t });
      }
    }
    // 큰 변화량 우선
    scores.sort((a, b) => b.score - a.score);

    // 5) K개 선정(최소 간격 0.75s 보장)
    const pickedTimes = [];
    const MIN_GAP = 0.75;
    for (const s of scores) {
      if (pickedTimes.length >= K) break;
      if (enforceMinGap(pickedTimes, MIN_GAP, s.t)) pickedTimes.push(s.t);
    }
    // 부족하면 균등 분할로 보충
    if (pickedTimes.length < K) {
      const step = durationSec / (K + 1);
      for (let i = 1; i <= K; i++) {
        const t = Math.min(Math.max(0.05, step * i), Math.max(0.06, durationSec - 0.06));
        if (enforceMinGap(pickedTimes, MIN_GAP, t)) pickedTimes.push(t);
        if (pickedTimes.length >= K) break;
      }
    }
    pickedTimes.sort((a, b) => a - b);

    // 6) 최종 썸네일 저장 (파일)
    const saved = [];
    for (let i = 0; i < pickedTimes.length; i++) {
      const t = pickedTimes[i];
      const idxStr = String(i + 1).padStart(3, "0");
      const fileName = `${baseNameNoExt}-Scene-${idxStr}-01.jpg`;
      const outPath = path.join(SHOTS_DIR, fileName);
      try {
        await captureFrameToFile(videoPath, t, outPath, 3);
        // 너무 작으면 재시도 (끝 범위 보호)
        const minT = 0.05;
        const maxT = Math.max(0.06, durationSec - 0.06);
        let st = fs.statSync(outPath);
        if (st.size < 1500) {
          let retryT = Math.min(t + 0.1, maxT);
          for (let r = 0; r < 2; r++) {
            await captureFrameToFile(videoPath, retryT, outPath, 3);
            st = fs.statSync(outPath);
            if (st.size >= 1500) break;
            retryT = Math.min(retryT + 0.1, maxT);
          }
        }
        saved.push({ time: Number(t.toFixed(1)), filename: fileName });
      } catch (e) {
        console.warn(`[save] failed at t=${t.toFixed(3)}:`, e?.message || e);
      }
    }

    const shots = saved.map((s) => ({
      time: s.time,
      imagePath: `${shotsBaseUrl}/${s.filename}`,
    }));

    return res.json({
      durationSec,
      shots,
      // 아래는 기존 스키마 호환용 목업 필드
      motion: { avg: 0.58, peaks: [12.8, 19.7] },
      color: { primary: "#7ecbff", brightness: 0.74, warmth: -0.1 },
      audio: { lufs: -16.8, speechRatio: 0.35, tempoBpm: 98, tempoConf: 0.6, key: "D", mode: "minor", keyConf: 0.45, silences: [{ start: 5.1, end: 5.7 }] },
      semantics: { language: "auto", keywords: ["여행", "바다"], sentiment: "calm" },
      syncPoints: [12.8, 19.7],
      delivery: { platform: "tiktok", needsLoop: true, voPresent: false },
    });
  } catch (e) {
    console.error("AnalyzeVideo-basic error:", e);
    return res.status(500).json({ error: "Failed to analyze video (basic)" });
  }
}));

// ───────────────────────────────────────────────────────────
// Route: POST /api/analyze-video/thumbnails (기존 유지)
// ───────────────────────────────────────────────────────────
router.post("/thumbnails", async (req, res) => {
  try {
    const { thumbnails = [], durationSec = 30 } = req.body || {};
    console.log("[/thumbnails] body:", { count: thumbnails?.length, durationSec });

    const result = await analyzeVideoWithThumbnails({ thumbnails, durationSec, options: {} });
    return res.json(result);
  } catch (error) {
    console.error("[/thumbnails] error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to analyze video thumbnails",
      detail: String(error?.message || error),
    });
  }
});

export default router;
