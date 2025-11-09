// src/features/compose/services/merge.service.ts
import { requestMerge } from "@/src/utils/api";

export async function mergeTrackToVideo(params: {
  videoId: string;
  trackId: string;
  url: string;
}) {
  const { videoId, trackId, url } = params;
  const merged = await requestMerge(videoId, trackId, url);
  return merged?.mergedUrl ?? null;
}
