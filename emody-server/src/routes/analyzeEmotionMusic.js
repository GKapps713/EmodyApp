// // emody-server/src/routes/analyzeEmotionMusic.js
// import express from "express";
// import { analyzeEmotion } from "../services/openaiService.js";
// import { searchYouTubeMusic } from "../services/youtubeService.js";

// const router = express.Router();

// router.post("/", async (req, res) => {
//   try {
//     const { text, language = "ko" } = req.body; // 🔹 useAiMusic 제거
//     if (!text) {
//       return res.status(400).json({ error: "text is required" });
//     }

//     // 1) OpenAI 감정 분석
//     const analysis = await analyzeEmotion({ text, language });

//     console.log("🔍 analysis result:", analysis); // 🔹 GPT 응답 확인

//     // 2) 유튜브 검색 (첫 번째 쿼리 활용)
//     const apiKey = process.env.YOUTUBE_API_KEY;
//     const query = analysis.musicRecommendation?.searchQueries?.[0] || text;
//     const ytResults = await searchYouTubeMusic(query, apiKey);

//     const responseData = {
//       emotion: analysis.emotionType,
//       comfort: analysis.comfortMessage,
//       quote: analysis.inspirationalQuote,
//       searchQueries: analysis.musicRecommendation?.searchQueries || [],
//       youtubeResults: ytResults,
//     };

//     console.log("✅ sending response:", responseData); // 🔹 최종 응답 확인

//     res.json(responseData);
    
//   } catch (err) {
//     console.error("AnalyzeEmotionMusic error:", err);
//     res.status(500).json({ error: "Failed to analyze emotion with music" });
//   }
// });

// /** ✅ 추가: 분석만 반환 (YouTube 제외) */
// router.post("/basic", async (req, res) => {
//   try {
//     const { text, language = "ko" } = req.body;
//     if (!text) return res.status(400).json({ error: "text is required" });

//     const analysis = await analyzeEmotion({ text, language });

//     const responseData = {
//       emotion: analysis.emotionType,
//       comfort: analysis.comfortMessage,
//       quote: analysis.inspirationalQuote,
//       searchQueries: analysis.musicRecommendation?.searchQueries || [],
//       // youtubeResults 제거
//     };

//     res.json(responseData);
//   } catch (err) {
//     console.error("AnalyzeEmotionMusic-basic error:", err);
//     res.status(500).json({ error: "Failed to analyze emotion (basic)" });
//   }
// });

// export default router;
