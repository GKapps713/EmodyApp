// src/app.js

import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import analyzeEmotionMusicRouter from "./routes/analyzeEmotionMusic.js";
import chatRouter from "./routes/chat.js"; // ✅ 새로 추가
import routes from "./routes/index.js"; // 기존 index.js 라우트

// ✅ __dirname 대체 (ESM 모듈 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// 개인정보 처리방침
app.get("/privacy.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "privacy.html"));
});

// ✅ 기존 라우트 (index.js)
app.use("/api", routes);

// ✅ 새 라우트 등록
app.use("/api/chat", chatRouter);
app.use("/api/analyze-emotion-music", analyzeEmotionMusicRouter);

// ✅ 헬스체크용 엔드포인트
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Emody server is alive on Elastic Beanstalk!",
  });
});

// ✅ 루트 경로 헬스체크용
app.get("/", (req, res) => {
  res.send("Emody server is running");
});

//console.log("✅ dotenv loaded, keys:", Object.keys(process.env).filter(k => k.includes("KEY")));

export default app;
