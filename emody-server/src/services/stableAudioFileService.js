// src/services/stableAudioFileService.js
import { randomBytes } from 'crypto';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { getUploadDir, toPublicUrl } from './storage.service.js';

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_BASE = process.env.STABILITY_API_BASE ?? 'https://api.stability.ai';
const GENERATE_PATH = '/v2beta/audio/stable-audio-2/text-to-audio';

function makeId(n = 12) {
  return randomBytes(n).toString('hex');
}

async function callStableAudioOnce({ prompt, seconds = 30, style, steps = 50 }) {
  if (!STABILITY_API_KEY) throw new Error('Missing STABILITY_API_KEY');
  if (!prompt) throw new Error('Missing prompt');

  const fullPrompt = style ? `${prompt}. Style: ${style}` : prompt;

  const form = new FormData();
  form.append('prompt', fullPrompt);
  form.append('duration', String(seconds));
  form.append('output_format', 'mp3');
  form.append('steps', String(steps)); // ✅ 추가

  const resp = await fetch(`${STABILITY_API_BASE}${GENERATE_PATH}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: 'application/json',
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Stable Audio API error: ${errText}`);
  }

  const data = await resp.json();
  if (!data.audio) throw new Error('No audio data in response');

  const buf = Buffer.from(data.audio, 'base64');
  const id = data.id ?? makeId(8);
  const filename = `stable_${id}_${Date.now()}.mp3`;
  const abs = path.resolve(getUploadDir(), filename);
  fs.writeFileSync(abs, buf);

  return {
    trackId: filename,
    title: fullPrompt.slice(0, 64),
    url: toPublicUrl(filename),
    duration: data.duration ?? seconds,
    prompt: fullPrompt,
  };
}

export async function generateStableAudioTracks({ prompt, seconds = 30, style, count = 1, steps = 50 }) {
  const n = Math.max(1, Math.min(Number(count) || 1, 5));
  const tracks = [];
  for (let i = 0; i < n; i++) {
    const t = await callStableAudioOnce({ prompt, seconds, style, steps }); // ✅ 전달
    tracks.push(t);
  }
  return { tracks };
}
