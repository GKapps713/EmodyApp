import express from "express";
import musicRouter from "./music.js";
// 앞으로 emotionRouter, audioRouter 같은 것도 여기에 import 하면 됨

const router = express.Router();

// /api/music → musicRouter 처리
router.use("/music", musicRouter);

export default router;
