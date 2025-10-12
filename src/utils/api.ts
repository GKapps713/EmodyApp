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

// ✅ 영상 업로드
export async function uploadVideo(localUri: string): Promise<UploadedVideo> {
  const form = new FormData();
  const filename = localUri.split("/").pop() || `video_${Date.now()}.mp4`;
  const type = "video/mp4";

  form.append("file", { uri: localUri, name: filename, type } as any);

  const res = await fetch(`${API_URL}/media/upload-video`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return await res.json();
}

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
  trackId: string
): Promise<{ mergedId: string; mergedUrl: string; width?: number; height?: number; duration?: number }> {
  const url = `${API_URL}/media/merge`;
  console.log('[requestMerge] url=', url, { videoId, trackId });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId, trackId }),
  });

  console.log('[requestMerge] status=', res.status);

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Merge failed: ${res.status} ${t}`);
  }

  const data = await res.json();
  console.log('[requestMerge] data=', data);
  return data; // { mergedId, mergedUrl, ... }
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
