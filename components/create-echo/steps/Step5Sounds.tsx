import { echoOptions } from "@/constants/echoOptions";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

type Props = {
  onNext: () => void;
  onPrev: () => void;
  onSelect: (values: string[]) => void;
  selected?: string[]; // ✅ 이전에 선택된 값
};

export default function Step5Sounds({
  onNext,
  onPrev,
  onSelect,
  selected = [],
}: Props) {
  const [current, setCurrent] = useState<string[]>(selected);

  useEffect(() => {
    setCurrent(selected);
  }, [selected]);

  const toggle = (sound: string) => {
    setCurrent((prev) =>
      prev.includes(sound) ? prev.filter((s) => s !== sound) : [...prev, sound]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Step 5: Choose sound effects (multiple selection)
      </Text>
      {echoOptions.sounds.map((s) => {
        const isSelected = current.includes(s);
        return (
          <TouchableOpacity
            key={s}
            style={[styles.option, isSelected && styles.selected]}
            onPress={() => toggle(s)}
          >
            <Text
              style={[styles.optionText, isSelected && styles.optionTextSelected]}
            >
              {s}
            </Text>
            {isSelected && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        );
      })}

      {/* ✅ Prev & Next buttons */}
      <TouchableOpacity style={styles.backLink} onPress={onPrev}>
        <Text style={styles.backLinkText}>← Previous step</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.nextButton,
          current.length === 0 && styles.nextButtonDisabled,
        ]}
        disabled={current.length === 0}
        onPress={() => {
          onSelect(current);
          onNext();
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
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
    flexDirection: "row", // 텍스트 + 체크 아이콘
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#1f2937", // dark tone
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selected: {
    backgroundColor: "#0ea5e9", // cyan highlight
    borderColor: "#22d3ee",
  },
  optionText: { fontSize: 16, color: "white" },
  optionTextSelected: { color: "#0F172A", fontWeight: "bold" },
  checkMark: { fontSize: 18, color: "#0F172A", fontWeight: "bold" },

  backLink: { alignItems: "center", marginTop: 10 },
  backLinkText: { color: "cyan", fontSize: 14 },

  nextButton: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "cyan",
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#4b5563",
  },
  nextButtonText: { color: "#0F172A", fontSize: 16, fontWeight: "600" },
});
