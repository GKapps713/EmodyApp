import { API_URL } from "@/src/config";
import { saveEcho } from "@/src/storage/echoRepository";
import { Echo } from "@/src/storage/echoTypes";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";

type Props = {
  onPrev: () => void;
  selections: {
    emotion?: string;
    mood?: string;
    rhythm?: string;
    style?: string;
    sounds?: string[]; // ✅ 복수 선택 가능
    extra?: string;
  };
  onSave: (title: string, duration: number) => void;
};

export default function Step7Finalize({ onPrev, selections }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30); // default seconds
  const [loading, setLoading] = useState(false);

  // 🔒 Block back button while loading
  useEffect(() => {
    if (loading) {
      const backAction = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => subscription.remove();
    }
  }, [loading]);

  const handleSave = async () => {
    try {
      setLoading(true);

      // 1) Generate prompt from OpenAI
      const promptResp = await fetch(`${API_URL}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...selections, title, duration }),
      });
      const promptData = await promptResp.json();
      const prompt = promptData.prompt;

      // 2) Generate audio via Stable Audio
      const audioResp = await fetch(`${API_URL}/stable-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, seconds: duration }),
      });
      const rawText = await audioResp.text();
      let audioData;
      try {
        audioData = JSON.parse(rawText);
      } catch (err) {
        throw new Error("Stable Audio returned non-JSON: " + rawText);
      }

      // 3) Create Echo object
      const newEcho: Echo = {
        id: uuidv4(),
        userId: "me", // TODO: integrate with auth
        title,
        duration,
        prompt,
        audioUrl: audioData.audioUrl,
        createdAt: new Date().toISOString(),
        isPublic: false,
        echoScore: 0,
        playCount: 0,
        purchaseCount: 0,
        genre: "",
        expiresAt: undefined,
        isPurchased: false,
        cost: 0,
        fileSize: 0,

        // ✅ selections 반영
        emotion: selections.emotion,
        mood: selections.mood,
        rhythm: selections.rhythm,
        style: selections.style,
        sounds: selections.sounds ?? [],
        extra: selections.extra,
      };

      // 4) Save locally
      await saveEcho(newEcho);

      // 5) Navigate to My Echoes
      router.push("/(tabs)/myechoes");
    } catch (err) {
      console.error("Save Echo Error:", err);
      alert("Error saving echo: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Step 7: Enter track info</Text>

        <Text style={styles.label}>Track title</Text>
        <TextInput
          placeholder="e.g. My First Echo"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Track length (seconds)</Text>
        <View style={styles.quickOptions}>
          {[30, 60, 90, 120, 150, 180].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionButton,
                duration === opt && styles.optionButtonSelected,
              ]}
              onPress={() => setDuration(opt)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  duration === opt && styles.optionButtonTextSelected,
                ]}
              >
                {opt}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
        </View>

        <TextInput
          keyboardType="numeric"
          placeholder="Enter seconds"
          placeholderTextColor="#9ca3af"
          style={styles.durationInput}
          value={String(duration)}
          onChangeText={(val) => {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
              setDuration(Math.max(10, Math.min(num, 180)));
            }
          }}
        />
        <Text style={styles.durationText}>{duration} sec</Text>

        <TouchableOpacity
          style={styles.backLink}
          onPress={onPrev}
          disabled={loading}
        >
          <Text style={styles.backLinkText}>← Previous step</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "cyan" }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Save My Echo</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator size="large" color="cyan" />
          <Text style={styles.overlayText}>
            Generating audio... please wait.
          </Text>
        </View>
      )}
    </View>
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
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionButton: {
    flexBasis: "30%",
    margin: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  optionButtonSelected: {
    backgroundColor: "cyan",
  },
  optionButtonText: {
    color: "white",
    fontSize: 14,
  },
  optionButtonTextSelected: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  sliderBox: { marginBottom: 12 },
  durationInput: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    textAlign: "center",
    color: "white",
  },
  durationText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 4,
    marginBottom: 16,
    color: "white",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#0F172A", fontSize: 16, fontWeight: "600" },
  backLink: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  backLinkText: { color: "cyan", fontSize: 14 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayText: {
    color: "white",
    marginTop: 12,
    fontSize: 16,
  },
});
