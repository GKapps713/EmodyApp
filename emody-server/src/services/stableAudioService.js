import FormData from "form-data";
import fetch from "node-fetch";

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_BASE = process.env.STABILITY_API_BASE ?? "https://api.stability.ai";
const GENERATE_PATH = "/v2beta/audio/stable-audio-2/text-to-audio";

export async function generateStableAudio({ prompt, seconds = 30, style }) {
  if (!STABILITY_API_KEY) {
    throw new Error("Missing STABILITY_API_KEY");
  }

  const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt;

  const form = new FormData();
  form.append("prompt", fullPrompt);
  form.append("duration", seconds.toString());
  form.append("output_format", "mp3");

  const resp = await fetch(`${STABILITY_API_BASE}${GENERATE_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: "application/json",
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!resp.ok) {
    throw new Error(await resp.text());
  }

  const data = await resp.json();
  if (!data.audio) throw new Error("No audio data in response");

  return {
    audioUrl: `data:audio/mp3;base64,${data.audio}`,
    id: data.id,
    duration: data.duration ?? seconds,
    prompt: fullPrompt,
  };
}
