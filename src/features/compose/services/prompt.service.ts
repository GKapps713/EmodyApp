// src/features/compose/services/prompt.service.ts
import { API_URL } from "@/src/config";
import type { AnalysisResult } from "../compose.types";
import { fetchJson } from "../lib/fetchJson";

export async function createPromptFromAnalysis(params: {
  analysis: AnalysisResult;
  duration: number;
}) {
  const { analysis, duration } = params;

  const body = {
    title: `${analysis.emotion ?? "Calm"} – Theme`,
    duration,
    emotion: analysis.emotion ?? "Calm",
    mood: "warm, intimate",
    instruments: ["piano", "strings"],
    style: "ambient neoclassical",
  };

  const { prompt, duration: generatedDuration } = await fetchJson<{
    prompt: string;
    duration: number;
  }>(`${API_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    tag: "prompt",
  });

  return { prompt, duration: generatedDuration ?? duration };
}
