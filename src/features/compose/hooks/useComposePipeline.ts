// src/features/compose/hooks/useComposePipeline.ts
import { useState } from "react";
import type { AnalysisResult, Phase, PipelineResult } from "../compose.types";
import { analyzeVideoForThumbnails, analyzeWithGptFromThumbnails } from "../services/analyze.service";
import { generateMusic, makeDummyTrack } from "../services/generate.service";
import { mergeTrackToVideo } from "../services/merge.service";
import { createPromptFromAnalysis } from "../services/prompt.service";
import { uploadLocalVideo } from "../services/video.service";

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
    dummyPrompt: true,
    dummyGenerate: true,
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

  const decideSeconds = (fallback = 30) => {
    const sec = pickedDurationSec ? Math.min(Math.max(5, pickedDurationSec), MAX_SECONDS) : fallback;
    return sec;
  };

  async function run(localUri: string): Promise<PipelineResult> {
    try {
      setPhase("uploading"); setStatusText("Upload");
      const up = await uploadLocalVideo(localUri);
      setVideoId(up.videoId);
      setUploadedUrl(up.videoUrl);

      const targetSeconds = decideSeconds();

      setPhase("analyzing"); setStatusText("Analyze");
      const shotItems = await analyzeVideoForThumbnails(up.videoUrl);
      setShots(shotItems);

      let analysis: AnalysisResult;
      if (flags.dummyAnalysis) {
        analysis = { emotion: "Calm" };
      } else {
        analysis = await analyzeWithGptFromThumbnails(
          shotItems.map(s => s.imagePath),
          targetSeconds
        );
      }

      setPhase("prompting"); setStatusText("Prompt");
      const { prompt, duration } = flags.dummyPrompt
        ? { prompt: "Dummy prompt", duration: targetSeconds }
        : await createPromptFromAnalysis({ analysis, duration: targetSeconds });

      setPhase("generating"); setStatusText("Generate");
      const track = flags.dummyGenerate
        ? makeDummyTrack(prompt)
        : await generateMusic({ prompt, seconds: targetSeconds, steps: 50 });

      setPhase("merging"); setStatusText("Merge");
      const merged = flags.dummyMerge
        ? up.videoUrl
        : await mergeTrackToVideo({ videoId: up.videoId, trackId: track.trackId, url: track.url });

      setMergedUrl(merged ?? null);
      setPhase("review"); setStatusText("Ready");

      return {
        analysis,
        prompt,
        track,
        mergedUrl: merged ?? null,
        uploadedUrl: up.videoUrl,
        videoId: up.videoId,
        shots: shotItems,
      };
    } catch (e: any) {
      setPhase("error"); setStatusText(e?.message ?? "Error");
      setTimeout(() => setPhase("idle"), 1500);
      throw e;
    }
  }

  return {
    // state
    phase, statusText, uploadedUrl, mergedUrl, videoId, shots, pickedDurationSec,
    // actions
    setPickedDurationSec, setPhase, setStatusText,
    run,
  };
}
