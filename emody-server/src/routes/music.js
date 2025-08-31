// routes/music.js

import express from "express";
import { searchYouTubeMusic } from "../services/youtubeService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const emotion = req.query.emotion || "happy";
    const apiKey = process.env.YOUTUBE_API_KEY;
    const results = await searchYouTubeMusic(emotion, apiKey);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Music fetch failed" });
  }
});

export default router;
