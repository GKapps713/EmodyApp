// src/features/compose/services/analyze.service.ts
import { API_URL } from "@/src/config";
import type { AnalysisResult, ShotItem } from "../compose.types";
import { fetchJson } from "../lib/fetchJson";

// ⬇️ 교체: analyzeVideoForThumbnails() → durationSec 함께 반환
export async function analyzeVideoForThumbnails(videoUrl: string) {
  const res = await fetchJson<{
    shots?: Array<{ time: number; imagePath: string }>;
    durationSec?: number;
    motion?: any;
  }>(`${API_URL}/analyze-video/basic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl }),
    tag: "analyzeVideo",
  });

  const shotList = Array.isArray(res?.shots) ? res!.shots! : [];
  const cacheBust = `v=${Date.now()}`;

  const processed: ShotItem[] = shotList.map((s, idx) => {
    const src = s.imagePath || "";
    const isAbs = /^https?:\/\//i.test(src);
    const withBust = src.includes("?") ? `${src}&${cacheBust}` : `${src}?${cacheBust}`;
    return {
      time: Number.isFinite(s.time) ? Number(s.time.toFixed(1)) : idx,
      imagePath: isAbs
        ? withBust
        : `${API_URL.replace(/\/+$/, "")}/${withBust.replace(/^\/+/, "")}`,
    };
  });

  // ✅ 서버가 계산한 실제 영상 길이 그대로 반환
  return {
    shots: processed,
    durationSec: Number(res?.durationSec ?? 0) || 0,
  };
}

// ⬇️ 교체: analyzeWithGptFromThumbnails() → durationSec 필수, 디폴트 제거
export async function analyzeWithGptFromThumbnails(
  thumbnails: string[],
  durationSec: number
) {
  const dur = Number(durationSec);
  if (!Number.isFinite(dur) || dur <= 0) {
    throw new Error("durationSec is required and must be a positive number");
  }

  const res = await fetchJson<any>(`${API_URL}/analyze-video/thumbnails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thumbnails, durationSec: dur }),
    tag: "analyzeThumbs",
  });

  return {
    emotion: res?.emotion ?? res?.mood ?? "Neutral",
    genre: res?.genre,
    style: res?.style,
    mood: res?.mood,
    description: res?.description ?? "",
    durationSec: dur, // ✅ 서버 전달값 그대로 유지
  } as AnalysisResult;
}