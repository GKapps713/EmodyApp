// src/features/compose/lib/fetchJson.ts
export async function fetchJson<T = any>(
  url: string,
  init?: RequestInit & { tag?: string }
): Promise<T> {
  const tag = init?.tag || "fetch";
  console.log(`🔹 [${tag}] ➡️ ${init?.method || "GET"} ${url}`);
  const res = await fetch(url, init);
  const text = await res.text();

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    console.log(`🔹 [${tag}] ⚠️ non-JSON response (len=${text.length})`);
  }

  console.log(`🔹 [${tag}] ⬅️ status ${res.status}`, {
    preview: typeof json === "string" ? json.slice(0, 180) : json,
  });

  if (!res.ok) {
    const err =
      (json && (json.error || json.message)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(`${tag} failed: ${err}`);
  }
  return json as T;
}
