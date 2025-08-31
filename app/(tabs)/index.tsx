import EmotionGrid from "@/components/EmotionGrid";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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

  const handleSelect = (label: string) => {
    router.push(`/result?emotion=${label}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Emody</Text>
      <Text style={styles.subtitle}>Please enter your current emotion.</Text>

      <EmotionGrid emotions={emotions} onSelect={handleSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: "bold", color: "white", textAlign: "center", marginBottom: 20 },
  subtitle: { fontSize: 16, color: "white", textAlign: "center", marginBottom: 10 },
});
