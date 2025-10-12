// constants/echoColors.ts
import { echoOptions } from "./echoOptions";

export const emotionColorMap: Record<string, string> = {
  Sad: "#3B82F6",       // blue
  Happy: "#FACC15",     // yellow
  Anxious: "#F59E0B",   // amber
  Angry: "#EF4444",     // red
  Tired: "#6B7280",     // gray
  Fearful: "#7DD3FC",   // sky
  Moved: "#EC4899",     // pink
  Confident: "#22C55E", // emerald
  Bored: "#9CA3AF",     // neutral
};

// 빠른 lookup용 emoji 맵
export const emotionEmojiMap: Record<string, string> = Object.fromEntries(
  echoOptions.emotions.map((e) => [e.label, e.emoji])
);
