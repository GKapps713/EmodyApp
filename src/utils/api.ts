// src/utils/api.ts
import { API_URL } from "../config";

// ---------- 타입 ----------
export type UploadedVideo = {
  videoId: string;
  filename: string;
  videoUrl: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  duration?: number;
};

export type Track = {
  trackId: string;
  title: string;
  url: string;
  duration?: number;
  prompt?: string;
};

export type MergeJobStatus =
  | { status: "pending" | "processing" }
  | { status: "done"; merged: { mergedId: string; mergedUrl: string } }
  | { status: "error"; message?: string };

// ---------- 함수 ----------


// ✅ 음악 생성
// ✅ 음악 생성 (mock 포함)
export async function generateTracks(args: {
  prompt: string;
  seconds?: number;
  style?: string;
  count?: number;
}): Promise<Track[]> {

   // ✅ 개발 모드: Stable Audio API 호출 방지
   if (__DEV__) {
     console.log("[DEV] Mock generateTracks() called — skipping Stable Audio API request");
     await new Promise((r) => setTimeout(r, 500));

     // ✅ 앱 재생 가능한 공개 MP3 URL 사용
     const MOCK_TRACKS: Track[] = [
       {
         trackId: `mock_${Date.now()}_1`,
         title: "Mock Track — Ambient Piano",
         url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
         duration: 5,
         prompt: args.prompt,
       },
       {
         trackId: `mock_${Date.now()}_2`,
         title: "Mock Track — Cinematic Strings",
         url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
         duration: 5,
         prompt: args.prompt,
       },
       {
         trackId: `mock_${Date.now()}_3`,
         title: "Mock Track — Chill Beat",
         url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
         duration: 5,
         prompt: args.prompt,
       },
     ];

     return MOCK_TRACKS;
   }

  // ✅ 실제 Stable Audio API 호출 (운영 모드)
  const res = await fetch(`${API_URL}/music/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
  const data = await res.json();
  return data.tracks as Track[];
}

// /media/merge가 이제 결과 객체를 바로 반환
export async function requestMerge(
  videoId: string,
  trackId: string,
  trackUrl?: string
): Promise<{ mergedId: string; mergedUrl: string; width?: number; height?: number; duration?: number }> {
  const url = `${API_URL}/media/merge`;
  console.log('[requestMerge] url=', url, { videoId, trackId, trackUrl });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId, trackId, trackUrl }), // ✅ trackUrl 추가
  });

  console.log('[requestMerge] status=', res.status);

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Merge failed: ${res.status} ${t}`);
  }

  const data = await res.json();
  console.log('[requestMerge] data=', data);
  return data;
}

// ✅ 상태 조회
export async function getJobStatus(jobId: string): Promise<MergeJobStatus> {
  const res = await fetch(`${API_URL}/media/job-status?jobId=${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error(`Job status failed: ${res.status}`);
  return await res.json();
}

// ✅ 상태 폴링
export async function pollJobStatus(
  jobId: string,
  opts?: { intervalMs?: number; timeoutMs?: number; onTick?: (s: MergeJobStatus) => void }
): Promise<MergeJobStatus> {
  const interval = opts?.intervalMs ?? 1500;
  const timeout = opts?.timeoutMs ?? 120000;
  const start = Date.now();

  while (true) {
    const status = await getJobStatus(jobId);
    opts?.onTick?.(status);
    if (status.status === "done" || status.status === "error") return status;
    if (Date.now() - start > timeout) throw new Error("Merge timeout");
    await new Promise((r) => setTimeout(r, interval));
  }
}

/**
 * 로컬 파일 URI(예: file://...)를 서버로 업로드합니다.
 * 서버 엔드포인트: POST ${API_URL}/media/upload-video
 * 반환: UploadedVideo
 */
export async function uploadVideo(localUri: string): Promise<UploadedVideo> {
  if (!localUri) throw new Error("uploadVideo: localUri is empty");

  const endpoint = `${API_URL}/media/upload-video`;
  const filename = getFileName(localUri);
  const mime = guessMimeType(localUri) ?? "video/mp4";

  const form = new FormData();
  form.append("file", {
    // RN/Expo FormData file shape
    uri: localUri,
    name: filename,
    type: mime,
  } as any);

  // ⚠️ Content-Type 수동 지정 금지 (boundary 자동 세팅)
  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${t}`);
  }

  const data = await res.json();

  // 서버 응답 키 표준화
  const uploaded: UploadedVideo = {
    videoId: data.videoId ?? data.id ?? data.filename ?? filename,
    filename: data.filename ?? filename,
    videoUrl: data.videoUrl ?? data.url,
    sizeBytes: data.sizeBytes,
    width: data.width,
    height: data.height,
    duration: data.duration,
  };

  return uploaded;
}

function getFileName(uri: string): string {
  // Handles file:///var/.../name.ext or content://.../name or plain names
  const parts = uri.split(/[\\/]/);
  const last = parts[parts.length - 1] || `upload_${Date.now()}.mp4`;
  return last.includes(".") ? last : `${last}.mp4`;
}

function guessMimeType(uri: string): string | null {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".m4v")) return "video/x-m4v";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".avi")) return "video/x-msvideo";
  return null;
}