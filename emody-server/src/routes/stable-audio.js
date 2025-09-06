import express from "express";
import FormData from "form-data";
import fetch from "node-fetch";

const router = express.Router();

// 환경변수에서 Stable Audio API 정보 가져오기
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_BASE = process.env.STABILITY_API_BASE ?? "https://api.stability.ai";

// Stable Audio 2 엔드포인트
const GENERATE_PATH = "/v2beta/audio/stable-audio-2/text-to-audio";

router.post("/generate", async (req, res) => {
  try {
    if (!STABILITY_API_KEY) {
      return res.status(500).json({ error: "Missing STABILITY_API_KEY" });
    }

    const { prompt, seconds = 30, style } = req.body ?? {};
    const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt;

    // FormData 로 body 구성
    const form = new FormData();
    form.append("prompt", fullPrompt);
    form.append("duration", seconds.toString());
    form.append("output_format", "mp3"); // wav/mp3 선택 가능

    const resp = await fetch(`${STABILITY_API_BASE}${GENERATE_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "application/json",
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({
        error: "stability_error",
        detail: errText,
      });
    }

    const data = await resp.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    if (!data.audio) {
      return res.status(500).json({ error: "No audio data in response", detail: data });
    }

    // Base64 → data URL
    const audioUrl = `data:audio/mp3;base64,${data.audio}`;

    return res.json({
      audioUrl,
      id: data.id,
      duration: data.duration ?? seconds,
      prompt: fullPrompt,
    });
  } catch (e) {
    console.error("Stable Audio Error:", e);
    return res.status(500).json({
      error: "server_error",
      message: e?.message ?? "Unknown error",
    });
  }
});

export default router;
