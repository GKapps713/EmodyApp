import express from "express";
import { generateStableAudio } from "../services/stableAudioService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { prompt, seconds, style } = req.body;
    const result = await generateStableAudio({ prompt, seconds, style });
    res.json(result);
  } catch (e) {
    console.error("Stable Audio Error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
