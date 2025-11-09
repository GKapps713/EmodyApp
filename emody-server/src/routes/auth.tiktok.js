// emody-server/routes/auth.tiktok.js
import express from "express";
import { exchangeCodeForToken } from "../services/tiktok.auth.service.js";

const router = express.Router();

/**
 * POST /auth/tiktok/exchange
 * body: { code, redirectUri }
 * res:  { access_token, refresh_token, open_id, expires_in, ... }
 */
router.post("/exchange", async (req, res) => {
  try {
    const { code, redirectUri } = req.body || {};
    if (!code || !redirectUri) return res.status(400).json({ error: "missing code/redirectUri" });

    const data = await exchangeCodeForToken({
      code,
      clientKey: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      redirectUri,
    });

    // TODO: 유저별 open_id로 DB에 토큰 저장(권장)
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

export default router;
