// src/app.js

import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import path from "path"; // ✅ 추가
import { fileURLToPath } from "url"; // ✅ 추가
import routes from "./routes/index.js";

// ✅ __dirname 대체 (ESM 모듈 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/privacy.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "privacy.html"));
});

app.use("/api", routes);

// ✅ 헬스체크용 엔드포인트
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Emody server is alive on Elastic Beanstalk!" });
});

// ✅ 루트 경로 헬스체크용
app.get("/", (req, res) => {
  res.send("Emody server is running");
});

export default app;
