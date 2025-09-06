import { StyleSheet, Text, TouchableOpacity } from "react-native";

// type EmotionCardProps = {
//   emoji: string;
//   label: string;
//   onPress: () => void;
// };

type EmotionCardProps = {
  emotion: string;
  onPlay?: (payload: { youtubeList: any[]; aiTrack?: { title: string; url: string } }) => void;
  ownMusic?: boolean;
};

async function generateAiTrack(prompt: string): Promise<{ title: string; url: string } | undefined> {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stable-audio/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        seconds: 30,       // 샘플 길이(예시). 계정 허용 범위에 맞춰 조절
        style: "lofi warm, gentle piano, soft pads, 80-90bpm", // 기본 가이드
      }),
    });
    if (!res.ok) throw new Error("AI generation failed");
    const data = await res.json();
    // 서버가 { audioUrl } 또는 { dataUrl } 형태로 리턴한다고 가정
    if (data.audioUrl) return { title: "AI Music", url: data.audioUrl };
    if (data.dataUrl) return { title: "AI Music", url: data.dataUrl };
  } catch (e) {
    console.warn(e);
  }
  return undefined;
}

export default function EmotionCard({ emotion, onPlay, ownMusic }: EmotionCardProps) {
  const onPress = async () => {
    // 1) 기존 로직: 유튜브 추천 가져오기
    const youtubeList = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/music/youtube?emotion=${encodeURIComponent(emotion)}`)
      .then(r => r.json());

    // 2) AI 음악 필요 시 백엔드 호출
    let aiTrack: { title: string; url: string } | undefined;
    if (ownMusic) {
      // 감정 기반 프롬프트(간단 버전). 필요하면 emotion→prompt 변환 로직 확장
      const prompt = `${emotion} mood, cinematic yet minimal, high quality, royalty-free`;
      aiTrack = await generateAiTrack(prompt);
    }

    onPlay?.({ youtubeList, aiTrack });
  };

// export default function EmotionCard({ emoji, label, onPress }: EmotionCardProps) {
//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress}>
//       <Text style={styles.emoji}>{emoji}</Text>
//       <Text style={styles.label}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 90,
    height: 90,
    margin: 8,
  },
  emoji: { fontSize: 32 },
  label: { marginTop: 5, color: "white", fontSize: 14 },
});
