import { useResult } from "@/src/ResultContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AiTrack = {
  id: string;
  title: string;
  prompt: string;
  duration: string;     // e.g., "00:30"
  audioUrl?: string | null; // 지금은 null(더미), 추후 생성음원 URL
};

export default function EmotionTab() {
  const { result } = useResult();
  const [selectedMusic, setSelectedMusic] = useState<any | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const playerRef = useRef<View>(null);

  // ✅ 감정별 배경 그라데이션 색상 매핑
  const gradientColors = useMemo(() => getBgGradientColors(result?.emotion), [result?.emotion]);

  // ✅ 더미 AI 트랙 2곡 (나중에 서버 생성으로 교체)
  const aiTracks: AiTrack[] = useMemo(() => makeDummyAiTracks(result?.emotion), [result?.emotion]);

  const handleSelectMusic = (item: any) => {
    setSelectedMusic(item);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  if (!result?.emotion) {
    return (
      <View style={[styles.container, { backgroundColor: "#0F172A" }]}>
        <Text style={styles.text}>No emotion selected yet.</Text>
        <Text style={styles.text}>Go to Home and pick an emotion 🎭</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        {/* ✅ 헤더: 음표 아이콘 (#2BC8FD) + 감정 타이틀 + 위로문구 */}
        <View style={styles.headerRow}>
          <Ionicons name="musical-notes" size={28} color="#2BC8FD" />
          <Text style={styles.headerTitle}>{result.emotion}</Text>
        </View>

        {/* 감정 카드 (quote 제거) */}
        <View style={styles.emotionCard}>
          <Text style={styles.emoji}>{getEmoji(result.emotion)}</Text>
          <Text style={styles.emotionTitle}>{result.emotion}</Text>
          {result.comfort && (
            <Text style={styles.emotionText}>{result.comfort}</Text>
          )}
        </View>

        {/* ✅ AI 생성 음악(더미 2곡) */}
        <View style={styles.musicGroup}>
          <Text style={styles.sectionTitle}>🎼 AI-Generated Tracks (2)</Text>

          <View style={styles.musicListBox}>
            {aiTracks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.musicItem,
                  selectedMusic?.id === item.id && styles.musicItemSelected,
                ]}
                onPress={() => handleSelectMusic(item)}
              >
                {/* 더미 썸네일 */}
                <Image
                  source={require("@/assets/images/emody.png")}
                  style={styles.thumbnail}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={[
                      styles.musicTitle,
                      selectedMusic?.id === item.id && { color: "cyan" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.musicArtist} numberOfLines={2}>
                    {item.prompt}
                  </Text>
                  <Text style={styles.duration}>{item.duration}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ✅ 선택된 음악 플레이어 (AI 트랙은 아직 미생성 → 안내문) */}
        {selectedMusic && (
          <View ref={playerRef} style={{ marginTop: 20 }}>
            <Text style={styles.selected}>
              ▶ Now Selected: {selectedMusic.title}
            </Text>

            {/* 유튜브/미디어가 없는 더미면 안내만 */}
            {selectedMusic.audioUrl ? (
              // 만약 나중에 audioUrl이 생기면 별도의 AudioPlayer 컴포넌트로 교체
              <Text style={styles.text}>Audio player coming soon…</Text>
            ) : (
              <Text style={styles.text}>
                This AI track is a placeholder. The actual audio will appear once generation is enabled.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

/** ---------------------------------------------
 * Helpers
 * --------------------------------------------- */
function getEmoji(emotion: string) {
  const map: Record<string, string> = {
    Sad: "😢",
    Happy: "🙂",
    Anxious: "😟",
    Angry: "😡",
    Tired: "😴",
    Fearful: "😨",
    Moved: "😭",
    Confident: "😎",
    Bored: "🥱",
  };
  return map[emotion] ?? "🎵";
}

// ✅ 색상 튜플 반환으로 타입 확정
function getBgGradientColors(emotion?: string): [string, string] {
  const table: Record<string, [string, string]> = {
    Happy: ["#FFD36E", "#FFC04D"],
    Love: ["#FF7DAE", "#C57DFF"],
    Calm: ["#A8D8EA", "#CDEFFD"],
    Sad: ["#5C7A99", "#7A8CA3"],
    Angry: ["#E63946", "#8A1C1C"],
    Confident: ["#34C759", "#6BE28C"],
    Focus: ["#1B2A49", "#15203A"],
    Lonely: ["#6C5B7B", "#5A4A67"],
    Anxious: ["#6C5B7B", "#5A4A67"],
    Tired: ["#1B2A49", "#0F172A"],
    Fearful: ["#1B2A49", "#0F172A"],
    Moved: ["#6C5B7B", "#5A4A67"],
    Bored: ["#1B2A49", "#0F172A"],
  };

  const key = emotion || "Focus";
  return table[key] ?? ["#0F172A", "#111827"];
}

// 더미 AI 트랙 2곡 생성 (감정에 맞춘 타이틀/프롬프트)
function makeDummyAiTracks(emotion?: string): AiTrack[] {
  const base = emotion || "Calm";
  const prompt1 = buildStableAudioPrompt(base, "warm, intimate", ["piano", "strings"], "ambient neoclassical");
  const prompt2 = buildStableAudioPrompt(base, "uplifting, bright", ["synth pads", "plucks"], "electropop chill");

  return [
    {
      id: "ai_dummy_1",
      title: `${base} – Theme I`,
      prompt: prompt1,
      duration: "00:30",
      audioUrl: null,
    },
    {
      id: "ai_dummy_2",
      title: `${base} – Theme II`,
      prompt: prompt2,
      duration: "00:30",
      audioUrl: null,
    },
  ];
}

// Stable Audio 프롬프트 빌더 (서버 generateStableAudioPrompt와 톤 맞춤)
function buildStableAudioPrompt(
  emotion: string,
  mood: string,
  instruments: string[],
  style: string
) {
  const instr = instruments.length ? instruments.join(", ") : "various instruments";
  return `A ${mood} ${style} piece evoking ${emotion.toLowerCase()}, featuring ${instr}. Delicate dynamics, clean mix, cinematic spaciousness.`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },

  /** ---------- 헤더 ---------- */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },

  /** ---------- 감정 카드 ---------- */
  emotionCard: {
    backgroundColor: "rgba(30,41,59,0.6)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: 10 },
  emotionTitle: { fontSize: 24, fontWeight: "bold", color: "white" },
  emotionText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },

  /** ---------- AI 음악 ---------- */
  musicGroup: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  musicListBox: {
    backgroundColor: "rgba(30,41,59,0.6)",
    borderRadius: 12,
    padding: 10,
  },
  musicItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  musicItemSelected: {
    borderWidth: 2,
    borderColor: "cyan",
    backgroundColor: "rgba(39,58,93,0.6)",
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  musicTitle: { fontSize: 16, fontWeight: "600", color: "white" },
  musicArtist: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  duration: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  selected: {
    marginTop: 10,
    fontSize: 16,
    color: "cyan",
    textAlign: "center",
  },

  /** ---------- 텍스트 ---------- */
  text: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
});
