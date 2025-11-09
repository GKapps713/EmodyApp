// server/routes/analyzeVideo.js
import { exec } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeVideoWithThumbnails } from "../services/openaiService.js";

const router = express.Router();

// ───────────────────────────────────────────────────────────
// Paths & Env
// ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// EB 배포 기준 절대 경로 (필요 시 환경변수로 치환 가능)
const UPLOAD_DIR = path.resolve("/var/app/current/uploads"); // 업로드된 비디오 저장소
const SHOTS_DIR  = path.resolve("/var/app/current/shots");   // 생성되는 샷 썸네일 저장소

// 파일 상단 유틸 근처에 추가
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listShotImages(baseNameNoExt) {
  if (!fs.existsSync(SHOTS_DIR)) {
    console.log("[listShotImages] SHOTS_DIR does not exist:", SHOTS_DIR);
    return [];
  }

  const files = fs.readdirSync(SHOTS_DIR);
  console.log("[listShotImages] Files in SHOTS_DIR:", files);
  const idPattern = escapeRegex(baseNameNoExt).replace(/\\\./g, '[._]');
  console.log("[listShotImages] idPattern:", idPattern);
  
  const re = new RegExp(
    `^${escapeRegex(baseNameNoExt)}-Scene-(\\d{1,4})-(\\d{1,4})\\.(?:jpe?g|png)$`,
    'i'
  );

  const found = [];
  for (const f of files) {
    const m = f.match(re);
    console.log("[listShotImages] Checking file:", f, "Match:", m);
    if (m) {
      const idx = parseInt(m[1], 10);
      if (Number.isFinite(idx)) {
        found.push({ index: idx, filename: f });
      }
    }
  }
  found.sort((a, b) => a.index - b.index);
  console.log("[listShotImages] Found shots:", found);
  return found;
}

function getBaseUrl(req) {
   const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
   if (env) return env; // 환경변수 우선
   const host = req.get("host"); // e.g. api.emodyapp.com
   const proto = (req.headers["x-forwarded-proto"] || req.protocol || "https");
   return `${proto}://${host}`;
 }

// 보조: 안전한 URL → 파일명 추출
function getVideoIdFromUrl(videoUrl) {
  try {
    const u = new URL(videoUrl);
    return path.basename(u.pathname);
  } catch {
    // 만약 절대 URL이 아니면 fallback
    return path.basename(videoUrl);
  }
}

// 보조: 파일 존재 확인
function assertFileExists(p) {
  if (!fs.existsSync(p)) {
    const msg = `File not found: ${p}`;
    throw new Error(msg);
  }
}

// 보조: 3자리 zero padding
function pad3(n) {
  return String(n).padStart(3, "0");
}

// 업로드된 비디오의 서버 내 실제 경로
function getLocalVideoFilePath(videoId) {
  return path.join(UPLOAD_DIR, videoId);
}

function runSceneDetectSaveImages(videoId) {
  return new Promise((resolve, reject) => {
    const videoPath = getLocalVideoFilePath(videoId);
    try { assertFileExists(videoPath); } catch (e) { return reject(e.message); }

    if (!fs.existsSync(SHOTS_DIR)) {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
    }

    const baseNameNoExt = path.parse(videoId).name;

  const cmd =
    `scenedetect -i "${videoPath}" ` +
    `detect-content ` +
    `save-images ` +
    `--output "${SHOTS_DIR}" ` +
    // 확장자를 템플릿에 직접 포함 → JPG로 저장
    `--filename "${baseNameNoExt}-Scene-\\$SCENE_NUMBER-\\$IMAGE_NUMBER" ` +
    `--num-images 1 ` +     // ✅ 씬당 한 장만 저장
    `--quality 90`;

    console.log("[SceneDetect] ===== save-images START =====");
    console.log("[SceneDetect] videoPath:", videoPath);
    console.log("[SceneDetect] cmd:", cmd);

    exec(cmd, (error, stdout, stderr) => {
      console.log("[SceneDetect] stdout:", stdout);
      console.error("[SceneDetect] stderr:", stderr);
      if (error) {
        console.error("[SceneDetect] error:", error.message);
        return reject(`SceneDetect save-images failed: ${stderr || error.message}`);
      }
      resolve();
    });
  });
}

// ───────────────────────────────────────────────────────────
// SceneDetect: 씬 시간 추출 (list-scenes)
//   - stdout 파싱하여 씬 시작/대표 시간(초)을 구함
//   - 파싱 로직은 출력 형식에 따라 조정 가능
// ───────────────────────────────────────────────────────────
function getShotTimesFromPySceneDetect(videoId) {
  return new Promise((resolve, reject) => {
    const videoPath = getLocalVideoFilePath(videoId);
    try {
      assertFileExists(videoPath);
    } catch (e) {
      return reject(e.message);
    }

    const cmd =
      `scenedetect -i "${videoPath}" ` +
      `detect-content ` +
      `list-scenes`;

    console.log("[getShotTimes] Executing command:", cmd);
    exec(cmd, (error, stdout, stderr) => {
      console.log("[getShotTimes] stdout:", stdout);
      console.error("[getShotTimes] stderr:", stderr);
      if (error) {
        console.error("[getShotTimes] error:", error.message);
        return reject(`SceneDetect list-scenes failed: ${stderr || error.message}`);
      }

      // 출력 예시는 환경에 따라 다를 수 있음.
      // 아래는 'Scene' 단어 포함 라인을 모아 숫자(초, 소수)만 추출하는 단순 파서.
      const times = stdout
        .split("\n")
        .filter((line) => /Scene/i.test(line))
        .map((line) => {
          // 첫 번째 부동소수 찾기 (예: "6.2", "12.8")
          const m = line.match(/(\d+\.\d+)/);
          return m ? parseFloat(m[1]) : null;
        })
        .filter((x) => typeof x === "number" && isFinite(x));

      console.log("[getShotTimes] Extracted times:", times);
      resolve(times);
    });
  });
}

// ───────────────────────────────────────────────────────────
// Route: POST /api/analyze-video/basic
// ───────────────────────────────────────────────────────────
router.post("/basic", async (req, res) => {
  try {
    const { videoUrl } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });

    const videoId = getVideoIdFromUrl(videoUrl);
    const localVideoPath = getLocalVideoFilePath(videoId);
    if (!fs.existsSync(localVideoPath)) {
      return res.status(404).json({ error: `Video not found on server: ${videoId}` });
    }

    const baseUrl = getBaseUrl(req);
    const shotsBaseUrl = `${baseUrl}/shots`;
    const baseNameNoExt = path.parse(videoId).name;

    // 1) 썸네일 생성
    await runSceneDetectSaveImages(videoId);

    // 2) 씬 타임
    const shotTimes = await getShotTimesFromPySceneDetect(videoId);

    // 3) 디스크에 실제 생성된 파일명 스캔
    const found = listShotImages(baseNameNoExt);
    console.log("[AnalyzeVideo] shots on disk:", found.map(f => f.filename));

    // 방어: 생성물 없으면 빈 배열
    if (!found.length) {
      return res.json({
        durationSec: 30,
        shots: [],
        motion: { avg: 0.58, peaks: [12.8, 19.7] },
        color: { primary: "#7ecbff", brightness: 0.74, warmth: -0.1 },
        audio: { lufs: -16.8, speechRatio: 0.35, tempoBpm: 98, tempoConf: 0.6, key: "D", mode: "minor", keyConf: 0.45, silences: [{ start: 5.1, end: 5.7 }] },
        semantics: { language: "auto", keywords: ["여행", "바다"], sentiment: "calm" },
        syncPoints: [12.8, 19.7],
        delivery: { platform: "tiktok", needsLoop: true, voPresent: false },
      });
    }

    // 4) 실제 파일명으로 응답 shots 구성 (타임은 shotTimes와 index 맞춰 매핑)
    const shots = found.map((f, idx) => ({
      time: Number(((shotTimes?.[idx] ?? 0)).toFixed?.(1) ?? 0),
      imagePath: `${shotsBaseUrl}/${f.filename}`,
    }));

    return res.json({
      durationSec: 30,
      shots,
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
});

router.post("/thumbnails", async (req, res) => {
  const { thumbnails, durationSec } = req.body;
  try {
    // GPT에 분석 요청
    const analysisResult = await analyzeVideoWithThumbnails({
      thumbnails,
      durationSec,
      options: {},
    });

    // 결과를 클라이언트에 반환
    res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing video thumbnails:", error);
    res.status(500).json({ error: "Failed to analyze video thumbnails" });
  }
});

export default router;
