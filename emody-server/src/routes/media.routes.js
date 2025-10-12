// src/routes/media.routes.js
import { Router } from 'express';
import { videoUpload } from '../middlewares/upload.middleware.js';
import { toPublicUrl } from '../services/storage.service.js';

const router = Router();

// 업로드는 그대로 유지
router.post('/upload-video', videoUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
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

// ✅ 동기 병합: 완료되면 바로 mergedUrl 반환
router.post('/merge', async (req, res, next) => {
  try {
    const { videoId, trackId } = req.body || {};
    if (!videoId || !trackId) {
      return res.status(400).json({ error: 'videoId and trackId are required' });
    }

    console.log(`[MERGE] start`, { videoId, trackId });

    // 서버 부팅 시가 아니라, 요청 시에만 import
    const { mergeVideoAndAudio } = await import('../services/ffmpeg.service.js');

    const merged = await mergeVideoAndAudio(videoId, trackId, {
      onProgress: (p) => {
        // 필요하면 간단히 로그만
        if (p % 10 === 0) console.log(`[MERGE] progress ${p}%`);
      },
    });

    console.log(`[MERGE] done`, merged);
    // 예: { mergedId, mergedUrl, width?, height?, duration? }
    return res.json(merged);
  } catch (err) {
    console.error('[MERGE] error', err);
    next(err);
  }
});

export default router;
