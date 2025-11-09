// src/features/compose/hooks/useComposePipeline.ts
import { useState } from "react";
import type { AnalysisResult, Phase, PipelineResult } from "../compose.types";
import { analyzeVideoForThumbnails, analyzeWithGptFromThumbnails } from "../services/analyze.service";
import { generateMusic, makeDummyTrack } from "../services/generate.service";
import { mergeTrackToVideo } from "../services/merge.service";
import { createPromptFromAnalysis } from "../services/prompt.service";
import { uploadLocalVideo } from "../services/video.service";

import { addComposition } from "@/src/storage/compositionRepository";
import type { CompositionRecord } from "@/src/storage/compositionTypes";

const MAX_SECONDS = 180;

type Flags = {
  dummyAnalysis?: boolean;
  dummyPrompt?: boolean;
  dummyGenerate?: boolean;
  dummyMerge?: boolean;
};

export function useComposePipeline(opts?: { flags?: Flags }) {
  const flags: Required<Flags> = {
    dummyAnalysis: false,
    dummyPrompt: false,
    dummyGenerate: false,
    dummyMerge: false,
    ...(opts?.flags || {}),
  };

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusText, setStatusText] = useState("Ready");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [shots, setShots] = useState<{ time: number; imagePath: string }[]>([]);
  const [pickedDurationSec, setPickedDurationSec] = useState<number | null>(null);

  // ── lightweight step logger ─────────────────────────────────────────
  function maskUrl(u?: string | null) {
    if (!u) return u;
    try {
      const { origin, pathname } = new URL(u);
      const tail = pathname.split("/").filter(Boolean).slice(-2).join("/");
      return `${origin}/…/${tail}`;
    } catch { return u; }
  }

  function nowMs() { return (globalThis as any)?.performance?.now?.() ?? Date.now(); }

  function makeStepLogger(tag: string) {
    const t0 = nowMs();
    const prefix = (p: string) => `[Compose:${tag}] ${p}`;
    return {
      start(extra?: any) {
        console.groupCollapsed(prefix("START"));
        if (extra) console.log("args:", extra);
        console.time(prefix("DURATION"));
      },
      info(label: string, data?: any) {
        console.log(label, data);
      },
      end(result?: any) {
        console.timeEnd(prefix("DURATION"));
        if (result !== undefined) console.log("result:", result);
        console.groupEnd();
      },
      fail(err: any) {
        console.timeEnd(prefix("DURATION"));
        console.error(prefix("ERROR"), err?.message || err, err);
        console.groupEnd();
      },
      sinceStart() {
        return Math.round(nowMs() - t0);
      }
    };
  }

  async function run(localUri: string): Promise<PipelineResult> {
    const L = makeStepLogger("RUN");
    L.start({ localUri: maskUrl(localUri), pickedDurationSec });

    try {
      // ── Upload ─────────────────────────────────────────────
      const LU = makeStepLogger("UPLOAD");
      LU.start({ localUri: maskUrl(localUri) });
      setPhase("uploading"); setStatusText("Upload");

      const up = await uploadLocalVideo(localUri);
      LU.info("uploaded", { videoId: up.videoId, videoUrl: maskUrl(up.videoUrl) });
      setVideoId(up.videoId);
      setUploadedUrl(up.videoUrl);
      LU.end();

      // ── Analyze: thumbnails extraction ─────────────────────
      const LA = makeStepLogger("ANALYZE:THUMBS");
      LA.start({ videoUrl: maskUrl(up.videoUrl) });
      setPhase("analyzing"); setStatusText("Analyze");

    // ⬇️ 수정: shots와 durationSec 동시 획득
    const { shots: shotItems, durationSec: durationSecFromServer } = await analyzeVideoForThumbnails(up.videoUrl);

    // 우선순위: 사용자 지정 > ffprobe, 그리고 5~180 클램프
    const targetSeconds = Math.max(5, Math.min(MAX_SECONDS, Math.round((pickedDurationSec ?? durationSecFromServer) || 0)));

      // 전체를 줄이지 않고 모두 출력 (마스킹 유지)
      LA.info("shots", {
        count: shotItems.length,
        items: shotItems.map((s, i) => ({
          idx: i + 1,
          time: s.time,
          image: maskUrl(s.imagePath),
        })),
      });
      LA.info("durationSec:ffprobe", durationSecFromServer); // ✅ 실제 계산 시간 명시 로그

      // 필요하면 1줄씩도 추가로 찍기 (읽기 편한 버전)
      shotItems.forEach((s, i) => {
        console.log(`[Analyze:THUMBS] #${i + 1} t=${s.time}s img=${maskUrl(s.imagePath)}`);
      });

      setShots(shotItems);
      LA.end();

      // ── Analyze: GPT from thumbnails ───────────────────────
      const LG = makeStepLogger("ANALYZE:GPT");
      LG.start({ duration: targetSeconds, thumbs: shotItems.length });
      let analysis: AnalysisResult;
      if (flags.dummyAnalysis) {
        analysis = { emotion: "Calm" };
        LG.info("dummyAnalysis", analysis);
      } else {
        const thumbs = shotItems.map(s => s.imagePath);
        LG.info("thumbs: payload size", { count: thumbs.length });
        // 필요하면 전체 URL을 보고 싶을 때:
        // console.log("[THUMBS:URLS]", thumbs);
        analysis = await analyzeWithGptFromThumbnails(thumbs, targetSeconds);
      }
      // ✅ 분석 결과 전문
      console.log("[ANALYSIS:RAW]", analysis);

      // ✅ 이게 곧 프롬프트 생성에 들어가는 핵심 입력값들
      console.log("[PROMPT:INPUT]", {
        duration: targetSeconds,
        emotion: analysis?.emotion,
        genre: (analysis as any)?.genre,
        style: (analysis as any)?.style,
        mood: (analysis as any)?.mood,
        description: (analysis as any)?.description,
      });

      LG.end();

      // ── Prompt build ───────────────────────────────────────────
      const LP = makeStepLogger("PROMPT");
      LP.start({ dummy: flags.dummyPrompt });
      setPhase("prompting"); setStatusText("Prompt");

      const { prompt, duration } = flags.dummyPrompt
        ? { prompt: "Dummy prompt", duration: targetSeconds }
        : await createPromptFromAnalysis({ analysis, duration: targetSeconds });

      LP.info("prompt.len", prompt?.length ?? 0);

      // ✅ 프롬프트 전문을 바로 확인(줄바꿈 보존)
      console.info("[PROMPT:RAW]\n" + (prompt ?? "[empty]"));

      // 원하면 한 줄 요약도 같이
      LP.info("prompt.preview", (prompt ?? "").slice(0, 120));

      LP.end();

      // ── Music generate ─────────────────────────────────────
      const LM = makeStepLogger("GENERATE");
      LM.start({ dummy: flags.dummyGenerate, seconds: targetSeconds });
      setPhase("generating"); setStatusText("Generate");
      const track = flags.dummyGenerate
        ? makeDummyTrack(prompt)
        : await generateMusic({ prompt, seconds: targetSeconds, steps: 50 });
      LM.info("track", { id: track.trackId, url: maskUrl(track.url) });
      LM.end();

      // ── Merge ──────────────────────────────────────────────
      const LZ = makeStepLogger("MERGE");
      LZ.start({ dummy: flags.dummyMerge, videoId });
      setPhase("merging"); setStatusText("Merge");
      const merged = flags.dummyMerge
        ? up.videoUrl
        : await mergeTrackToVideo({ videoId: up.videoId, trackId: track.trackId, url: track.url });
      setMergedUrl(merged ?? null);

      LZ.info("mergedUrl", maskUrl(merged ?? undefined));
      LZ.end();

      // ── Save (NEW): Dev 화면에서 보일 수 있도록 영구 저장 ──
      try {
        const record: CompositionRecord = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),   // string
          seconds: targetSeconds,
          steps: 50,                              // generateMusic에서 사용한 steps
          analysis,                               // Stage1 RAW JSON
          track: {
            trackId: String(track.trackId),
            url: String(track.url),
            title: `Track ${new Date().toLocaleString()}`,
            promptText: prompt ?? "",
            duration: targetSeconds,              // ✅ 필수 필드 추가
            localAudioPath: undefined,            // ✅ null 대신 undefined
          },
          mergedUrl: merged ?? undefined,         // (선택) 타입이 string | undefined 라면 이렇게
        };

        await addComposition(record);
        console.info("[Compose:SAVED]", { id: record.id });
      } catch (e) {
        console.warn("[Compose:SAVE_ERROR]", e);
      }

      // ── Summary ────────────────────────────────────────────
      const summary = {
        uploadedUrl: maskUrl(up.videoUrl),
        videoId: up.videoId,
        shots: shotItems.length,
        analysis,
        promptFull: prompt ?? "",
        track: { id: track.trackId, url: maskUrl(track.url) },
        mergedUrl: maskUrl(merged ?? undefined),
        totalMs: L.sinceStart()
      };

      console.info("[Compose:SUMMARY]", summary);

      setPhase("review"); setStatusText("Ready");

      return {
        analysis, prompt, track,
        mergedUrl: merged ?? null,
        uploadedUrl: up.videoUrl,
        videoId: up.videoId,
        shots: shotItems,
      };
    } catch (e: any) {
      console.error("[Compose:ERROR]", { message: e?.message, stack: e?.stack });
      setPhase("error"); setStatusText(e?.message ?? "Error");
      setTimeout(() => setPhase("idle"), 1500);
      throw e;
    }
  }

  // ✅ 훅은 반드시 값을 반환해야 함
  return {
    // state
    phase, statusText, uploadedUrl, mergedUrl, videoId, shots, pickedDurationSec,
    // actions
    setPickedDurationSec, setPhase, setStatusText,
    run,
  };
}
