// emody-server/services/tiktok.auth.service.js
import fetch from "node-fetch";

/**
 * TikTok OAuth: code → access_token 교환 (샌드박스)
 * @param {object} p
 * @param {string} p.code
 * @param {string} p.clientKey
 * @param {string} p.clientSecret
 * @param {string} p.redirectUri
 */
export async function exchangeCodeForToken({ code, clientKey, clientSecret, redirectUri }) {
  const url = "https://open-api.tiktok.com/oauth/access_token/";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error || j.data?.error_code) {
    throw new Error(`tiktok exchange failed: ${res.status} ${JSON.stringify(j)}`);
  }
  // 참고: data.access_token / refresh_token / open_id / expires_in
  return j.data;
}
