// src/features/compose/types/compose.types.ts
export type Phase =
  | "idle"
  | "uploading"
  | "analyzing"
  | "prompting"
  | "generating"
  | "merging"
  | "review"
  | "error";

export type AnalysisResult = {
  emotion: string;
  genre?: string;
  style?: string;
  mood?: string;
  description?: string;
};

export type DummyTrack = {
  trackId: string;
  title: string;
  url: string;
  duration: number;
  promptText?: string;
};

export type ShotItem = {
  time: number;
  imagePath: string;
};

export type PipelineResult = {
  analysis: AnalysisResult;
  prompt: string;
  track: DummyTrack | any;
  mergedUrl: string | null;
  uploadedUrl: string | null;
  videoId: string | null;
  shots: ShotItem[];
};
