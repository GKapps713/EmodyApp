import { Router } from "express";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { videoUpload } from "../middlewares/upload.middleware.js";
import { toPublicUrl, UPLOAD_DIR } from "../services/storage.service.js";

const router = Router();

// ✅ Step 1 — Upload video
router.post("/upload-video", videoUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const { filename, size } = req.file;
    const videoUrl = toPublicUrl(filename);

    return res.json({
      videoId: filename,
      filename,
      videoUrl,
      sizeBytes: size,
      width: null,
      height: null,
      duration: null,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ Step 3 — Merge (Stable Audio or Mock track)
router.post("/merge", async (req, res, next) => {
  try {
    const { videoId, trackId, trackUrl } = req.body || {}; // ✅ trackUrl 추가
    if (!videoId || !trackId) {
      return res.status(400).json({ error: "videoId and trackId are required" });
    }

    console.log("[MERGE] start", { videoId, trackId, trackUrl });

    const { mergeVideoAndAudio } = await import("../services/ffmpeg.service.js");

    const videoPath = path.join(UPLOAD_DIR, videoId);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: "Video file not found" });
    }

    let audioPath;
    let tempFile = null;

    // ✅ trackUrl이 존재하면 우선 사용
    if (trackUrl && /^https?:\/\//i.test(trackUrl)) {
      console.log("[MERGE] Using external audio from trackUrl:", trackUrl);

      const response = await fetch(trackUrl);
      if (!response.ok) throw new Error(`Failed to download audio: ${response.statusText}`);

      const tmpFile = path.join(UPLOAD_DIR, `tmp_${Date.now()}.mp3`);
      const fileStream = fs.createWriteStream(tmpFile);
      await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
      });

      audioPath = tmpFile;
      tempFile = tmpFile;
    } else if (/^https?:\/\//i.test(trackId)) {
      // ✅ 예전 호환 (trackId가 URL인 경우)
      console.log("[MERGE] Detected external audio URL:", trackId);

      const response = await fetch(trackId);
      if (!response.ok) throw new Error(`Failed to download audio: ${response.statusText}`);

      const tmpFile = path.join(UPLOAD_DIR, `tmp_${Date.now()}.mp3`);
      const fileStream = fs.createWriteStream(tmpFile);
      await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
      });

      audioPath = tmpFile;
      tempFile = tmpFile;
    } else {
      // ✅ Stable Audio 파일 로컬 처리
      audioPath = path.join(UPLOAD_DIR, trackId);
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }
    }

    const merged = await mergeVideoAndAudio(videoPath, audioPath);
    console.log("[MERGE] done", merged);

    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlink(tempFile, (err) => {
        if (err) console.warn("[MERGE] temp cleanup failed:", err);
        else console.log("[MERGE] temp file deleted:", tempFile);
      });
    }

    return res.json(merged);
  } catch (err) {
    console.error("[MERGE] error", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
