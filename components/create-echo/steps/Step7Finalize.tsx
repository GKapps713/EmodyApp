import Slider from "@react-native-community/slider"; // expo install @react-native-community/slider
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  onPrev: () => void;
  onSave: (title: string, duration: number) => void;
};

export default function Step7Finalize({ onPrev, onSave }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30); // default 30 seconds

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Step 7: Enter track info</Text>

      {/* Track title */}
      <Text style={styles.label}>Track title</Text>
      <TextInput
        placeholder="e.g. My First Echo"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      {/* Duration */}
      <Text style={styles.label}>Track length (seconds)</Text>
      <View style={styles.sliderBox}>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={10}
          maximumValue={180}
          step={1}
          value={duration}
          onValueChange={setDuration}
          minimumTrackTintColor="cyan"
          maximumTrackTintColor="#374151"
          thumbTintColor="cyan"
        />
        <Text style={styles.durationText}>{duration} sec</Text>
      </View>

      {/* ✅ Prev button (same style as Step6, 위치는 Save 위) */}
      <TouchableOpacity style={styles.backLink} onPress={onPrev}>
        <Text style={styles.backLinkText}>← Previous step</Text>
      </TouchableOpacity>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "cyan" }]}
        onPress={() => {
          onSave(title, duration);
          router.push("/(tabs)/emotion"); // TODO: later redirect to My Echoes
        }}
      >
        <Text style={styles.buttonText}>Save My Echo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "white",
  },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8, color: "white" },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    color: "white",
  },
  sliderBox: { marginBottom: 20 },
  durationText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 8,
    color: "white",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#0F172A", fontSize: 16, fontWeight: "600" },

  // ✅ Step6과 동일한 Prev 스타일
  backLink: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  backLinkText: { color: "cyan", fontSize: 14 },
});
