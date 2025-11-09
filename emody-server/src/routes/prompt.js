// src/routes/prompt.js
import express from "express";
import { generateMusicPrompt } from "../services/openaiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      title,           // 클라이언트에서 같이 옴 (표기용)
      duration,        // number (초) 5~180로 클램프는 서비스 함수에서 수행
      emotion,
      genre,
      style,
      mood,
      description,
    } = req.body || {};

    const prompt = await generateMusicPrompt({
      title,
      duration,
      emotion,
      genre,
      style,
      mood,
      description,
    });

    res.json({ prompt, title, duration });
  } catch (err) {
    console.error("prompt route error:", err);
    res.status(500).json({ error: err.message || "Failed to build prompt" });
  }
});

export default router;
