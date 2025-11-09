// emody-server/services/tiktok.user.service.js
import fs from "fs";
import fetch from "node-fetch";
import { tmpdir } from "os";
import path from "path";

const TMP_DIR = path.join(tmpdir(), "emody_tiktok_user");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

export async function publishTikTokWithUserToken({
  accessToken,
  videoUrl,
  title = "Made with EmodyApp",
  visibility = "PUBLIC", // PUBLIC | FRIENDS | PRIVATE (샌드박스는 보통 인박스 드래프트)
}) {
  const localPath = await downloadToTmp(videoUrl);

  try {
    const size = fs.statSync(localPath).size;

    // 1) 업로드 초기화
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        source_info: {
          source: "FILE_UPLOAD",
          video_size: size,
          chunk_size: size,
          total_chunk_count: 1,
        },
      }),
    });
    const initJ = await initRes.json().catch(() => ({}));
    if (!initRes.ok || initJ?.error?.code !== "ok") {
      throw new Error(`init failed: ${initRes.status} ${JSON.stringify(initJ)}`);
    }
    const publish_id = initJ.data.publish_id;
    const upload_url = initJ.data.upload_url;

    // 2) 바이트 업로드 (단일 청크)
    const file = fs.readFileSync(localPath);
    const put = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(file.length),
        "Content-Range": `bytes 0-${file.length - 1}/${file.length}`,
      },
      body: file,
    });
    if (!put.ok) {
      throw new Error(`upload failed: ${put.status} ${await put.text().catch(() => "")}`);
    }

    // 3) (선택) 상태 조회
    const stat = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id }),
    });
    const statJ = await stat.json().catch(() => ({}));

    return { publish_id, status: statJ?.data?.status ?? "queued" };
  } finally {
    try { fs.unlinkSync(localPath); } catch {}
  }
}

async function downloadToTmp(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const fp = path.join(TMP_DIR, `tiktok_${Date.now()}.mp4`);
  fs.writeFileSync(fp, buf);
  return fp;
}
