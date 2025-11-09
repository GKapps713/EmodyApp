import express from "express";
import { generateMusicPrompt } from "../services/openaiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // 요청 바디에서 데이터 풀기
    const { title, duration, emotion, mood, instruments, style } = req.body;

    // generateMusicPrompt 함수에 데이터를 풀어서 전달
    const prompt = await generateMusicPrompt(
      emotion,
      mood,
      instruments,
      style
    );

    res.json({ prompt, title, duration }); // ← title, duration도 그대로 클라이언트에 돌려줌
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
