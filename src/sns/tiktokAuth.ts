// src/sns/tiktokAuth.ts
import { API_URL } from "@/src/config";
import * as AuthSession from "expo-auth-session";
import { useEffect, useState } from "react";

const discovery = {
  authorizationEndpoint: "https://www.tiktok.com/v2/auth/authorize/",
  tokenEndpoint: "https://open-api.tiktok.com/oauth/access_token/",
};

export function useTikTokAuth(clientKey: string) {
  // ⚠️ app.json에 정의된 scheme와 일치해야 함 (아래 4번 참고)
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "emodyapp" });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientKey,                   // = TIKTOK_CLIENT_KEY
      responseType: "code",
      redirectUri,
      scopes: ["user.info.basic", "video.upload"],
    },
    discovery
  );

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (response?.type === "success" && response.params?.code) {
        try {
          setIsConnecting(true);
          setError(null);
          const r = await fetch(`${API_URL}/auth/tiktok/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: response.params.code,
              redirectUri,
            }),
          });
          if (!r.ok) throw new Error(await r.text());
          const j = await r.json();
          // 서버가 평탄화하여 반환: { access_token, ... }
          setAccessToken(j.access_token || j?.data?.access_token || null);
        } catch (e: any) {
          setError(e.message ?? "TikTok exchange failed");
          setAccessToken(null);
        } finally {
          setIsConnecting(false);
        }
      }
    })();
  }, [response]);

  return { request, promptAsync, accessToken, isConnecting, error };
}
