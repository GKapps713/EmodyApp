import express from "express";
import { analyzeEmotion } from "../services/openaiService.js";
import { searchYouTubeMusic } from "../services/youtubeService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { emotion } = req.body;
    if (!emotion) {
      return res.status(400).json({ error: "emotion is required" });
    }

    // 1) OpenAI 감정 분석
    const analysis = await analyzeEmotion({
      text: emotion,
      language: "ko",
      useAiMusic: false,
    });

    // 2) 유튜브 검색 (첫 번째 쿼리 활용)
    const apiKey = process.env.YOUTUBE_API_KEY;
    const query = analysis.musicRecommendation?.searchQueries?.[0] || emotion;
    const ytResults = await searchYouTubeMusic(query, apiKey);

    res.json({
      emotionType: analysis.emotionType,
      comfortMessage: analysis.comfortMessage,
      inspirationalQuote: analysis.inspirationalQuote,
      searchQueries: analysis.musicRecommendation?.searchQueries || [],
      youtubeResults: ytResults,
    });
  } catch (err) {
    console.error("AnalyzeEmotionMusic error:", err);
    res.status(500).json({ error: "Failed to analyze emotion with music" });
  }
});

export default router;
