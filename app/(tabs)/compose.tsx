import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { Easing, useSharedValue, withTiming } from "react-native-reanimated";

import { SocialShareSheet } from "@/components/SocialShareSheet";
import PulseButton from "@/src/features/compose/components/PulseButton";
import ReviewSheet from "@/src/features/compose/components/ReviewSheet";
import { useComposePipeline } from "@/src/features/compose/hooks/useComposePipeline";
import { useVideoPicker } from "@/src/features/compose/hooks/useVideoPicker";
import { publishToTikTokDraft } from "@/src/sns/tiktokApi";
import { useTikTokAuth } from "@/src/sns/tiktokAuth";

export default function ComposeScreen() {
  const progress = useSharedValue(0);
  const [shareVisible, setShareVisible] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);  // 새로 추가된 상태

  const pipeline = useComposePipeline({ flags: { dummyGenerate: true } });
  const { pickVideo } = useVideoPicker();

  const STATUS_TARGET: Record<string, number> = {
    idle: 0.0, uploading: 0.2, analyzing: 0.35, prompting: 0.55,
    generating: 0.8, merging: 1.0, review: 1.0, error: 0.0,
  };

  React.useEffect(() => {
    const target = STATUS_TARGET[pipeline.phase] ?? 0;
    progress.value = withTiming(target, { duration: pipeline.phase === "idle" ? 300 : 420, easing: Easing.out(Easing.cubic) });
  }, [pipeline.phase]);

  const onPick = async () => {
    const { localUri, durationSec } = await pickVideo();
    if (!localUri) return;
    if (durationSec) pipeline.setPickedDurationSec(durationSec);
    await pipeline.run(localUri);
  };

  const { promptAsync: tkPrompt, accessToken: tkToken } = useTikTokAuth("sbawnrsbuf67bc6cwi");
  const handleShareSelect = async (target: { key: string; label: string }) => {
    if (target.key !== "tiktok") { setShareVisible(false); return; }
    if (!pipeline.mergedUrl) return;
    if (!tkToken) { await tkPrompt?.(); return; }
    await publishToTikTokDraft({ accessToken: tkToken, mergedUrl: pipeline.mergedUrl, title: "Made with EmodyApp 🎵", visibility: "PUBLIC" });
    setShareVisible(false);
  };

  const handleRestart = () => {
    Alert.alert(
      "Restart",
      "Are you sure you want to start over? All progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => {
            // 상태 초기화
            pipeline.setPhase("idle");
            setIsPreviewing(false);
            progress.value = 0;
        }},
      ]
    );
  };

  return (
    <LinearGradient start={{ x:0, y:0 }} end={{ x:1, y:1 }} colors={["#030712", "#0ea5e9", "#000000"]} locations={[0,0.35,1]} style={{ flex:1 }}>
      <View style={{ flex:1, paddingHorizontal:16, justifyContent:"center", alignItems:"center" }}>
        <PulseButton
          onPress={onPick}
          iconSource={require("../../assets/images/emody.png")}
          disabled={isPreviewing} // Previewing 중에는 클릭 불가능
          progress={progress}
          phase={pipeline.phase}
        />
        <Animated.View style={{ marginTop:18 }}>
          <Text style={{ color:"rgba(255,255,255,0.85)", fontSize:14, fontWeight:"700" }}>
            {pipeline.statusText}
          </Text>
        </Animated.View>
      </View>

      {pipeline.phase === "review" && (
        <ReviewSheet
          mergedUrl={pipeline.mergedUrl}
          uploadedUrl={pipeline.uploadedUrl}
          shots={pipeline.shots}
          onShare={() => setShareVisible(true)}
          onRestart={handleRestart} // Restart 핸들러 추가
        />
      )}

      <SocialShareSheet visible={shareVisible} onClose={() => setShareVisible(false)} onSelect={handleShareSelect} />
    </LinearGradient>
  );
}
