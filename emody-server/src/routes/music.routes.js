// src/routes/music.routes.js
import { Router } from 'express';
import { generateStableAudioTracks } from '../services/stableAudioFileService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt, seconds, style, count, steps } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    // 방어적 클램프
    const safeSeconds = Math.max(5, Math.min(Number(seconds) || 30, 180)); // 5~180초
    const safeSteps   = Math.max(30, Math.min(Number(steps) || 50, 100));  // 30~100

    const result = await generateStableAudioTracks({
      prompt,
      seconds: safeSeconds,
      style,
      count,
      steps: safeSteps, // ✅ 전달
    });
    return res.json(result);
  } catch (e) {
    console.error('Stable Audio Error:', e);
    return res.status(500).json({ error: e?.message ?? 'stable audio error' });
  }
});

export default router;
