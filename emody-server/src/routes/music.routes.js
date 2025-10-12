// src/routes/music.routes.js
import { Router } from 'express';
import { generateStableAudioTracks } from '../services/stableAudioFileService.js'; // ✅ 수정

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt, seconds, style, count } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }
    const result = await generateStableAudioTracks({ prompt, seconds, style, count });
    return res.json(result);
  } catch (e) {
    console.error('Stable Audio Error:', e);
    return res.status(500).json({ error: e?.message ?? 'stable audio error' });
  }
});

export default router;
