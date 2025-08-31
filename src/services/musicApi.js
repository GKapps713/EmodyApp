// src/services/musicApi.js
import { API_URL } from "../config";

export async function fetchMusic(emotion) {
  const res = await fetch(`${API_URL}/music?emotion=${emotion}`);
  if (!res.ok) throw new Error("Music API call failed");
  return res.json();
}
