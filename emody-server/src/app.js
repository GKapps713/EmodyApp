// src/app.js

import cors from "cors";
import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import analyzeEmotionMusicRouter from "./routes/analyzeEmotionMusic.js";
import analyzeVideoRouter from "./routes/analyzeVideo.js";
import tiktokAuthRoutes from "./routes/auth.tiktok.js";
import chatRouter from "./routes/chat.js";
import routes from "./routes/index.js"; // 기존 index.js 라우트
import mediaRouter from "./routes/media.routes.js";
import musicRouter from "./routes/music.routes.js";
import promptRouter from "./routes/prompt.js";
import tiktokSnsRoutes from "./routes/sns.tiktok.js";
import stableAudioRouter from "./routes/stable-audio.js";

import { UPLOAD_DIR } from "./middlewares/upload.middleware.js";

// __dirname 대체 (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정적 썸네일 디렉터리(서버 절대 경로)
const SHOTS_DIR = path.resolve("/var/app/current/shots");

const app = express();

// ───────────────────────────────────────────────────────────
// 기본 미들웨어/설정
// ───────────────────────────────────────────────────────────

// ELB/Nginx 프록시 뒤에서 HTTPS/호스트 인식 (x-forwarded-* 신뢰)
app.set("trust proxy", true);

// 로깅
app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));

// CORS (정적 리소스 포함 전반 허용)
app.use(
  cors({
    origin: true, // 요청 Origin을 그대로 반영
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Body parser (JSON/URL-Encoded)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// 정적 디렉터리 존재 보장 (부팅 시 생성)
[UPLOAD_DIR, SHOTS_DIR].forEach((p) => {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {}
});

// ───────────────────────────────────────────────────────────
// 정적 파일 서빙
// ───────────────────────────────────────────────────────────

// 업로드 비디오/머지 결과 (상대적 고정 리소스 → 캐시 길게)
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    fallthrough: false,
    etag: true,
    maxAge: "1h",
    immutable: true,
  })
);

// 씬 썸네일 (분석 직후 갱신될 수 있음 → 캐시 짧게/ETag 비활성)
app.use(
  "/shots",
  express.static(SHOTS_DIR, {
    fallthrough: false,
    etag: false,
    maxAge: "60s",
  })
);

// 개인정보 처리방침 / 이용약관 / TikTok 검증 파일
app.get("/privacy.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "privacy.html"));
});
app.get("/terms.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "terms.html"));
});
app.get("/tiktokAiy9jesbPVc88GPQR3o9xzjHD710mqUR.txt", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "public",
      "tiktokAiy9jesbPVc88GPQR3o9xzjHD710mqUR.txt"
    )
  );
});
app.get("/tiktokkKwOmayoc1WLbQIWHEoVeBXWhwdvYihu.txt", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "public",
      "tiktokkKwOmayoc1WLbQIWHEoVeBXWhwdvYihu.txt"
    )
  );
});

// ───────────────────────────────────────────────────────────
// API 라우트
// ───────────────────────────────────────────────────────────

// 기존 index.js
app.use("/api", routes);

// 신규 라우트
app.use("/api/chat", chatRouter);
app.use("/api/analyze-emotion-music", analyzeEmotionMusicRouter);
app.use("/api/prompt", promptRouter);
app.use("/api/stable-audio", stableAudioRouter);

// Stable Audio 파일 저장 기반 API
app.use("/api/music", musicRouter);

// 업로드/머지 라우트
app.use("/api/media", mediaRouter);

// 비디오 분석(샷 썸네일/타임라인)
app.use("/api/analyze-video", analyzeVideoRouter);

// TikTok 인증/업로드
app.use("/api/auth", tiktokAuthRoutes); // POST /api/auth/tiktok/exchange
app.use("/api/sns/tiktok", tiktokSnsRoutes); // POST /api/sns/tiktok/publish-user

// 헬스체크
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Emody server is alive on Elastic Beanstalk!",
  });
});

// 루트 헬스체크
app.get("/", (req, res) => {
  res.send("Emody server is running");
});

// ───────────────────────────────────────────────────────────
// 404 & 에러 핸들러 (선택적이지만 권장)
// ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
