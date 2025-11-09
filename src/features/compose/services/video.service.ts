// src/features/compose/services/video.service.ts
import { uploadVideo } from "@/src/utils/api";

export async function uploadLocalVideo(localUri: string) {
  // 기존 uploadVideo({ uri }) 래퍼
  const up = await uploadVideo(localUri);
  return { videoId: up.videoId as string, videoUrl: up.videoUrl as string };
}
