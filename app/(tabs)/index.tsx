// (tabs)/index.tsx
import EmotionGrid from "@/components/EmotionGrid";
import OwnMusicToggle from "@/components/OwnMusicToggle"; // ✅ 추가
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

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
  const [ownMusic, setOwnMusic] = useState(false); // ✅ 토글 상태

  const handleSelect = (label: string) => {
    // EmotionGrid에서 선택된 감정으로 이동
    // ownMusic 상태를 쿼리스트링으로 전달 → result 페이지에서 사용
    router.push(`/result?emotion=${label}&ownMusic=${ownMusic}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Emody</Text>
      <Text style={styles.subtitle}>Please enter your current emotion.</Text>

      {/* ✅ 나만의 음악 토글 */}
      <OwnMusicToggle onChange={setOwnMusic} />

      {/* 감정 카드 그리드 */}
      <EmotionGrid emotions={emotions} onSelect={handleSelect} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#111827",
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
});
