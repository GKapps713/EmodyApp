import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import Step1Emotion from "@/components/create-echo/steps/Step1Emotion";
import Step2Mood from "@/components/create-echo/steps/Step2Mood";
import Step3Rhythm from "@/components/create-echo/steps/Step3Rhythm";
import Step4Style from "@/components/create-echo/steps/Step4Style";
import Step5Sounds from "@/components/create-echo/steps/Step5Sounds";
import Step6Extra from "@/components/create-echo/steps/Step6Extra";
import Step7Finalize from "@/components/create-echo/steps/Step7Finalize";

export default function CreateEcho() {

  const insets = useSafeAreaInsets(); // ✅ 안전영역 값 가져오기
  const router = useRouter();
  const totalSteps = 7;
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<any>({});

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const saveSelection = (key: string, value: string | string[] | number) => {
    setSelections((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      {/* expo-router 기본 Header 숨기기 */}
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />

      {/* ✅ 커스텀 헤더 (Back + Title) */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>🎵 Create My Echo</Text>
      </View>

      {/* Step 1 */}
      {step === 1 && (
        <Step1Emotion
          onNext={nextStep}
          onSelect={(val) => saveSelection("emotion", val)}
          selected={selections.emotion}
        />
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Step2Mood
          onNext={nextStep}
          onPrev={prevStep}
          onSelect={(val) => saveSelection("mood", val)}
          selected={selections.mood}
        />
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Step3Rhythm
          onNext={nextStep}
          onPrev={prevStep}
          onSelect={(val) => saveSelection("rhythm", val)}
          selected={selections.rhythm}
        />
      )}

      {/* Step 4 */}
      {step === 4 && (
        <Step4Style
          onNext={nextStep}
          onPrev={prevStep}
          onSelect={(val) => saveSelection("style", val)}
          selected={selections.style}
        />
      )}

      {/* Step 5 */}
      {step === 5 && (
        <Step5Sounds
          onNext={nextStep}
          onPrev={prevStep}
          onSelect={(val) => saveSelection("sounds", val)}
          selected={selections.sounds || []}
        />
      )}

      {/* Step 6 */}
      {step === 6 && (
        <Step6Extra
          onNext={nextStep}
          onPrev={prevStep}
          onSelect={(val) => saveSelection("extra", val)}
          selected={selections.extra}
        />
      )}

      {/* Step 7 */}
      {step === 7 && (
        <Step7Finalize
        onPrev={prevStep}
        selections={selections} // ✅ 현재까지 모인 선택값 전달
        onSave={(title, duration) => {
        saveSelection("title", title);
        saveSelection("duration", duration);

      const finalSelections = { ...selections, title, duration };
      console.log("Final selections:", finalSelections);
    }}
  />
      )}

      {/* Step indicator */}
      <View
        style={[
          styles.stepIndicator,
          { marginBottom: insets.bottom + 10 }, // ✅ 홈인디케이터 피해서 여백 추가
        ]}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              step === i + 1 ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827", // same as Home
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    color: "cyan",
    fontSize: 16,
    marginRight: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: "cyan" },
  dotInactive: { backgroundColor: "#374151" },
});
