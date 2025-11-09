// emody-server/src/routes/index.js
import express from "express";
// import analyzeEmotionMusicRouter from "./analyzeEmotionMusic.js";
import chatRouter from "./chat.js";
import promptRouter from "./prompt.js"; // ✅ 추가
import stableAudioRouter from "./stable-audio.js"; // 추가

const router = express.Router();

// /api/chat → chatRouter
router.use("/chat", chatRouter);

// /api/analyze-emotion → analyzeEmotionMusicRouter
// router.use("/analyze-emotion", analyzeEmotionMusicRouter);

// /api/stable-audio → stableAudioRouter
router.use("/stable-audio", stableAudioRouter);

// /api/prompt → promptRouter
router.use("/prompt", promptRouter); // ✅ 추가

export default router;
