// emody-server/routes/sns.tiktok.js
import express from "express";
import { publishTikTokWithUserToken } from "../services/tiktok.user.service.js";

const router = express.Router();

/**
 * POST /sns/tiktok/publish-user
 * body: { accessToken, videoUrl, title?, visibility? }
 */
router.post("/publish-user", async (req, res) => {
  try {
    const { accessToken, videoUrl, title, visibility } = req.body || {};
    if (!accessToken || !videoUrl) return res.status(400).json({ error: "missing accessToken/videoUrl" });

    const out = await publishTikTokWithUserToken({ accessToken, videoUrl, title, visibility });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;
