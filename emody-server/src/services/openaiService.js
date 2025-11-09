// emody-server/src/services/openaiService.js

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

// ✅ OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// 🔐 키 로드 확인 (앞 10자리만 로그)
console.log("✅ OPENAI_API_KEY:", process.env.OPENAI_API_KEY?.slice(0, 10));

// 📌 상담형 채팅
export async function chatWithGpt(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "";
  } catch (error) {
    console.error("❌ OpenAI chatWithGpt error:", error);
    throw new Error("Failed to chat with GPT: " + (error.message || error));
  }
}

/**
 * Thumbnails (HTTP/HTTPS absolute URLs) → GPT Vision
 * - No sharp/base64, just pass through URLs with image_url blocks
 * - Strong logging to pinpoint failure stage
 * - English-only schema
 */
export async function analyzeVideoWithThumbnails({ thumbnails, durationSec, options = {} }) {
  // 1) normalize
  const all = Array.isArray(thumbnails) ? thumbnails.filter(Boolean) : [];
  const abs = all.filter(u => /^https?:\/\//i.test(u));
  if (!abs.length) {
    console.error("[thumbnails] invalid input:", thumbnails);
    throw new Error("No valid absolute thumbnail URLs provided");
  }

  // ✅ durationSec 필수 & 디폴트 제거
  const rawDur = Number(durationSec);
  if (!Number.isFinite(rawDur) || rawDur <= 0) {
    throw new Error("durationSec is required and must be a positive number");
  }
  // 서비스 정책상 상한/하한만 적용
  const dur = Math.max(5, Math.min(180, Math.round(rawDur)));

  // ✅ 기본 10장, 필요시 options.maxThumbs로 조절
  const MAX_THUMBS = Number.isFinite(options.maxThumbs) ? Math.max(1, Math.min(20, options.maxThumbs)) : 10;
  const sample = abs.slice(0, Math.min(abs.length, MAX_THUMBS));

  console.log("[thumbnails] dur:", dur, "count:", sample.length);
  console.log("[thumbnails] firstUrls:", sample.slice(0, 2));

  // 2) prompts (EN only)
  const system = `
You are a video-thumbnail analyst and music curation expert.
Return a SINGLE JSON object ONLY. No extra text, no code fences, no explanations.

Rules:
- All field VALUES must be in ENGLISH.
- Use ONE concise token/word for categorical fields.
- Keep description to 1–2 concise English sentences.
- Do not include any fields other than those in the schema.

Schema (return exactly these keys):
{
  "emotion": "one English word (e.g., calm, joyful, melancholic, tense, dreamy, epic)",
  "genre":   "one English word (e.g., ambient, lofi, orchestral, synthwave, pop, acoustic)",
  "style":   "one English word (e.g., cinematic, minimal, organic, retro, neoclassical)",
  "mood":    "one English word (e.g., warm, moody, dark, bright, ethereal, energetic)",
  "description": "1–2 English sentences summarizing the overall atmosphere/subject/colors/composition"
}
  `.trim();

  const userText =
    `Analyze the thumbnails below and summarize the common atmosphere/subject/colors/composition for a ~${dur}s video. ` +
    `Respond ONLY with the JSON object following the schema.`;

  const userContent = [
    { type: "text", text: userText },
    ...sample.map(url => ({ type: "image_url", image_url: { url } })),
  ];

  // 3) OpenAI call
  let resp;
  try {
    resp = await openai.chat.completions.create({
      model: "gpt-4o", // or gpt-4o-mini
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });
  } catch (err) {
    console.error("[thumbnails] OpenAI error:", err?.message || err);
    throw new Error(`OpenAI request failed: ${err?.message || err}`);
  }

  // 4) parse (strict: no fallbacks)
  const raw = resp?.choices?.[0]?.message?.content ?? "";
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("[thumbnails] Non-JSON from OpenAI:", raw);
    throw new Error("Failed to parse JSON from OpenAI");
  }

  // 5) basic strict check
  const required = ["emotion", "genre", "style", "mood", "description"];
  const missing = required.filter(k => !(k in json));
  if (missing.length) {
    console.error("[thumbnails] Missing keys:", missing, "json:", json);
    throw new Error(`Missing required keys: ${missing.join(", ")}`);
  }

  return { ...json, durationSec: dur };
}

export async function generateMusicPrompt(params = {}) {
  try {
    const {
      title = "Untitled",
      duration,
      emotion = "Calm",
      genre = "ambient",
      style = "neoclassical",
      mood = "warm",
      description = "",
    } = params;

    const rawDur = Number(duration);
    if (!Number.isFinite(rawDur) || rawDur <= 0) {
      throw new Error("duration is required and must be a positive number");
    }
    const safeDuration = Math.max(5, Math.min(180, Math.round(rawDur)));

    console.log("[generateMusicPrompt] duration(actual):", safeDuration); // ✅ 실제 사용값 로그

    // ✅ 백틱 템플릿으로 수정, 불필요 변수 제거
    const system = `
You are an expert Stable Audio prompt writer. Be concise (1–2 sentences, max 100 words) and vivid.
Follow the requested structure but keep musical choices flexible.
When guidance includes ranges (e.g., 70–90 BPM), choose what best fits the analysis.
Do not add disclaimers or metadata; output only the final prose prompt.
`.trim();

    const user = `
Generate a Stable Audio prompt for a ~${safeDuration}s track based on this video analysis.

Structure (guide, not rules): start with genre/style, list 2–4 key instruments,
suggest a suitable BPM RANGE (not a single value) unless the context clearly implies a specific tempo,
describe mood in 2–3 adjectives, outline an energy curve and any timing accents; end with brief context if helpful.

Analysis summary:
- Title: ${title}
- Emotion: ${emotion}, Mood: ${mood}, Style: ${style}, Genre: ${genre}
- Visual notes: ${description || "—"}

Guidance:
- Typical tempo ranges (examples only): ambient 70–90, lofi 70–92, synthwave 90–120, orchestral 60–80; pick what best fits the analysis and energy.
- If visuals suggest higher motion, feel free to go above the typical range.

Return 1–2 sentences that describe atmosphere, instrumentation, motion/energy, and accents. Avoid lists or bullet points.
`.trim();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    });

    const out = resp?.choices?.[0]?.message?.content?.trim() || "";
    return out;
  } catch (err) {
    console.error("❌ generateMusicPrompt error:",
      err?.response?.status,
      err?.response?.data || err?.message || err
    );
    const reason =
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Unknown error";
    throw new Error("Failed to generate music prompt: " + reason);
  }
}