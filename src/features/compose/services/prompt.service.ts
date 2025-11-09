// src/features/compose/services/prompt.service.ts
import { API_URL } from "@/src/config";
import type { AnalysisResult } from "../compose.types";
import { fetchJson } from "../lib/fetchJson";

/**
 * analysis로부터 받은 6개 필드만 사용:
 * emotion, genre, style, mood, description, durationSec
 * - duration(인자)과 analysis.durationSec 충돌 시: 우선순위는 인자 > analysis.durationSec
 */
export async function createPromptFromAnalysis(params: {
  analysis: AnalysisResult;
  duration: number; // 사용자가 고른 타겟 길이 (초)
}) {
  const { analysis, duration } = params;

  const emotion      = analysis?.emotion ?? "Calm";
  const genre        = (analysis as any)?.genre ?? "ambient";
  const style        = (analysis as any)?.style ?? "neoclassical";
  const mood         = (analysis as any)?.mood ?? "warm";
  const description  = (analysis as any)?.description ?? "";
  const analyzedDur  = Number((analysis as any)?.durationSec) || 0;

  // 최종 duration: 사용자가 고른 값 우선, 없으면 분석값 사용, 최종 5~180로 클램프
  const targetDuration = Math.max(5, Math.min(180, Math.round(duration || analyzedDur || 30)));

  // 서버에 보낼 페이로드 (6개만)
  const body = {
    emotion,
    genre,
    style,
    mood,
    description,
    duration: targetDuration,
    title: `${emotion} – Theme`, // 표기용 타이틀만 추가(서버도 그대로 돌려줌)
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

  return { prompt, duration: generatedDuration ?? targetDuration };
}
