import EmotionGrid from "@/components/EmotionGrid";
import { API_URL } from "@/src/config";
import { useResult } from "@/src/ResultContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const emotions = [
  { emoji: "😢", label: "Sad" },
  { emoji: "🙂", label: "Happy" },
  { emoji: "😟", label: "Anxious" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😨", label: "Fearful" },
  { emoji: "😭", label: "Moved" },
  { emoji: "😎", label: "Confident" },
  { emoji: "🥱", label: "Bored" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { setResult } = useResult();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (label: string) => {
    try {
      setLoading(true);

      // 감정 분석 API 호출
      const res = await fetch(`${API_URL}/analyze-emotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: label, language: "en", useAiMusic: false }),
      });
      const data = await res.json();

      // 결과 전역 상태에 저장
      setResult({
        emotion: label,
        comfort: data.comfortMessage,
        quote: data.inspirationalQuote,
        youtubeResults: data.youtubeResults,
        aiMusic: null, // EmotionTab에서 AI 음악 제거됨
      });

      // EmotionTab으로 이동
      router.push("/(tabs)/emotion");
    } catch (err) {
      console.error("Error in handleSelect:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="cyan" />
      ) : (
        <>
          {/* 헤더 */}
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.header}>Emody</Text>
            <Text style={styles.subtitle}>
              Please enter your current emotion.
            </Text>
          </View>

          {/* 감정 카드 그룹 (박스 형태) */}
          <View style={styles.cardBox}>
            <EmotionGrid emotions={emotions} onSelect={handleSelect} />
          </View>

          {/* 구분선 */}
          {/* <View style={styles.divider} /> */}

          {/* ✅ 감정 카드 아래 버튼 */}
          <TouchableOpacity
            style={styles.createEchoButton}
            onPress={() => router.push("/create-echo")}
          >
            <Text style={styles.createEchoText}>🎶 Create My Echo</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  cardBox: {
    backgroundColor: "#0F172A", // ✅ 더 진한 네이비, 안쪽 카드 대비 살리기
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#374151", // 중간 톤 회색
    marginVertical: 10,
  },
  createEchoButton: {
    backgroundColor: "cyan",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginTop: 20,
  },
  createEchoText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
  },
});
