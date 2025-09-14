import { echoOptions } from "@/constants/echoOptions";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onNext: () => void;
  onPrev: () => void;
  onSelect: (value: string) => void;
  selected?: string; // ✅ 현재 선택된 값
};

export default function Step3Rhythm({ onNext, onPrev, onSelect, selected }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Step 3: Choose your rhythm</Text>

      {echoOptions.rhythms.map((r) => {
        const isSelected = selected === r;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.option, isSelected && styles.selected]}
            onPress={() => {
              onSelect(r);
              onNext();
            }}
          >
            <Text
              style={[styles.optionText, isSelected && styles.optionTextSelected]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* ✅ Previous step button */}
      <TouchableOpacity style={styles.backLink} onPress={onPrev}>
        <Text style={styles.backLinkText}>← Previous step</Text>
      </TouchableOpacity>
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
  selected: { backgroundColor: "#0ea5e9" }, // cyan highlight
  optionText: { fontSize: 16, color: "white" },
  optionTextSelected: { color: "#0F172A", fontWeight: "bold" },
  backLink: { alignItems: "center", marginTop: 20 },
  backLinkText: { color: "cyan", fontSize: 14 },
});
