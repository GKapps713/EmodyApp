// src/sns/tiktokApi.ts
import { API_URL } from "@/src/config";

export type TikTokVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export async function publishToTikTokDraft(params: {
  accessToken: string;
  mergedUrl: string;
  title?: string;
  visibility?: TikTokVisibility;
}) {
  const { accessToken, mergedUrl, title = "Made with EmodyApp 🎵", visibility = "PUBLIC" } = params;

  const res = await fetch(`${API_URL}/sns/tiktok/publish-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, videoUrl: mergedUrl, title, visibility }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { ok: true, publish_id, status }
}
