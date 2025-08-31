import { StyleSheet, Text, TouchableOpacity } from "react-native";

type EmotionCardProps = {
  emoji: string;
  label: string;
  onPress: () => void;
};

export default function EmotionCard({ emoji, label, onPress }: EmotionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

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
