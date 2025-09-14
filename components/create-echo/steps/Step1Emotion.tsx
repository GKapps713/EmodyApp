import { echoOptions } from "@/constants/echoOptions";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onNext: () => void;
  onSelect: (value: string) => void;
  selected?: string; // ✅ 현재 선택된 값
};

export default function Step1Emotion({ onNext, onSelect, selected }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Step 1: Choose your emotion</Text>
      {echoOptions.emotions.map((e) => {
        const isSelected = selected === e.label;
        return (
          <TouchableOpacity
            key={e.label}
            style={[styles.option, isSelected && styles.selected]}
            onPress={() => {
              onSelect(e.label);
              onNext();
            }}
          >
            <Text
              style={[styles.optionText, isSelected && styles.optionTextSelected]}
            >
              {e.emoji} {e.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "white",
  },
  option: {
    padding: 14,
    backgroundColor: "#1f2937", // dark tone
    borderRadius: 12,
    marginBottom: 10,
  },
selected: {
  backgroundColor: "#0ea5e9",
  borderWidth: 2,
},
  optionText: { fontSize: 16, color: "white" },
  optionTextSelected: {
  color: "#0F172A",
  fontWeight: "bold",
},
});
