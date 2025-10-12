import express from "express";
import { generateStableAudioPrompt } from "../services/openaiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, duration, emotion, mood, instruments, style } = req.body;

    const prompt = await generateStableAudioPrompt({
      emotion,
      mood,
      instruments,
      style,
    });

    res.json({ prompt, title, duration }); // ← title, duration도 그대로 클라이언트에 돌려줌
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
