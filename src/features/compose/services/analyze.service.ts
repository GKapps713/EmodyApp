// src/features/compose/services/analyze.service.ts
import { API_URL } from "@/src/config";
import type { AnalysisResult, ShotItem } from "../compose.types";
import { fetchJson } from "../lib/fetchJson";

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

  return processed;
}

export async function analyzeWithGptFromThumbnails(
  thumbnails: string[],
  durationSec: number
) {
  const res = await fetchJson<AnalysisResult>(`${API_URL}/analyze-video/thumbnails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thumbnails, durationSec }),
    tag: "analyzeThumbs",
  });

  return {
    emotion: res?.emotion ?? "Neutral",
    genre: res?.genre,
    style: res?.style,
    mood: res?.mood,
    description: res?.description,
  } as AnalysisResult;
}
