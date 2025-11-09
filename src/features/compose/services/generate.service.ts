// src/features/compose/services/generate.service.ts
import { API_URL } from "@/src/config";
import { fetchJson } from "../lib/fetchJson";

export async function generateMusic(params: {
  prompt: string;
  seconds: number;
  steps?: number;
}) {
  const { prompt, seconds, steps = 50 } = params;
  const res = await fetchJson<{ tracks: any[] }>(`${API_URL}/music/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      seconds,
      style: "ambient neoclassical",
      count: 1,
      steps,
    }),
    tag: "generate",
  });

  const track = res?.tracks?.[0];
  if (!track) throw new Error("No track generated");
  return track;
}

// 더미 트랙 유틸
export function makeDummyTrack(prompt: string) {
  return {
    trackId: `dummy_${Date.now()}`,
    title: (prompt || "Calm ambient").slice(0, 64),
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 30,
  };
}
