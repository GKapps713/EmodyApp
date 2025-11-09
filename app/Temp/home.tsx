import EmotionGrid from "@/components/EmotionGrid";
import { API_URL } from "@/src/config";
import { useResult } from "@/src/ResultContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";

import { LinearGradient } from "expo-linear-gradient"; // ✅ 액센트 바

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
      const res = await fetch(`${API_URL}/analyze-emotion/basic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: label, language: "en", useAiMusic: false }),
      });

      const data = await res.json();

      const normalizeEmotion = (raw?: string) => {
        const m: Record<string, string> = {
        sadness: "Sad",
        joy: "Happy",
        anxiety: "Anxious",
        anger: "Angry",
        tired: "Tired",
        emptiness: "Lonely",   // 테이블의 Lonely에 매핑
        touched: "Moved",
        confident: "Confident",
        shy: "Bored",          // 테이블 기준 가장 근접 매핑(원하시면 'Shy'로 테이블/이모지 추가)
        };
        return m[(raw || "").toLowerCase()] || "Calm";
      };

      setResult({
        emotion: normalizeEmotion(data.emotion),  // ← ✅ 정규화한 값으로 저장
        comfort: data.comfort,
        quote: data.quote,
      });

      // // 결과 전역 상태에 저장
      // setResult({
      //   emotion: data.emotion,     // 서버에서 분석된 감정으로 저장 (label 대신)
      //   comfort: data.comfort,     // ✅ 서버 응답 키와 일치
      //   quote: data.quote,         // ✅ 서버 응답 키와 일치
      //   youtubeResults: data.youtubeResults
      // });

      // EmotionTab으로 이동
      // router.push("/(tabs)/moodMusic");
      
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

          {/* ✅ 히어로 헤더 (이모지 + 굵은 타이틀 + 보조문구 + 그라데이션 바) */}
          <View style={styles.headBlock}>
            <Text style={styles.heroEmoji} accessibilityLabel="Mood prompt">🎭</Text>
            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel="How are you feeling today?"
            >
              How are you feeling today?
            </Text>
            <Text style={styles.caption}>
              Pick one that best matches your mood.
            </Text>

            <LinearGradient
              colors={["#06b6d4", "#22d3ee", "#67e8f9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentBar}
            />
          </View>


          {/* 감정 카드 그룹 (박스 형태) */}
          <View style={styles.cardBox}>
            <EmotionGrid emotions={emotions} onSelect={handleSelect} />
          </View>

          {/* 구분선 */}
          {/* <View style={styles.divider} /> */}

          {/* ✅ 감정 카드 아래 버튼 */}
          {/* <TouchableOpacity
            style={styles.createEchoButton}
            onPress={() => router.push("/create-echo")}
          >
            <Text style={styles.createEchoText}>🎶 Create My Echo</Text>
          </TouchableOpacity> */}
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
  headBlock: {
    marginBottom: 16,
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
  heroEmoji: {
    fontSize: 44,            // ✅ 시선 집중 포인트
    marginBottom: 6,
  },
title: {
    // ✅ 더 크고 굵게 + 살짝의 그림자
    fontSize: 30,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  caption: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  accentBar: {
    marginTop: 12,
    height: 4,
    width: 160,
    borderRadius: 999,
    opacity: 0.95,
  },
});
