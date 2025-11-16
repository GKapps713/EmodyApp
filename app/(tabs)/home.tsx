// app/(tabs)/home.tsx
import { SocialShareSheet } from "@/components/SocialShareSheet";
import PulseButton from "@/src/features/compose/components/PulseButton";
import ReviewSheet from "@/src/features/compose/components/ReviewSheet";
import { useComposePipeline } from "@/src/features/compose/hooks/useComposePipeline";
import { useVideoPicker } from "@/src/features/compose/hooks/useVideoPicker";
import { publishToTikTokDraft } from "@/src/sns/tiktokApi";
import { useTikTokAuth } from "@/src/sns/tiktokAuth";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useLogs } from "../../src/context/LogsContext"; // LogsContext에서 제공하는 훅을 가져옵니다

import * as MediaLibrary from 'expo-media-library';

import { Video } from 'expo-av';

export default function ComposeScreen() {
  const progress = useSharedValue(0);
  const [shareVisible, setShareVisible] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);  // 새로 추가된 상태

  const pipeline = useComposePipeline();
  const { pickVideo, probeRef } = useVideoPicker();
  const { addLog } = useLogs(); // LogsContext에서 addLog 함수 가져오기

  const STATUS_TARGET: Record<string, number> = {
    idle: 0.0, uploading: 0.2, analyzing: 0.35, prompting: 0.55,
    generating: 0.8, merging: 1.0, review: 1.0, error: 0.0,
  };

  React.useEffect(() => {
    const target = STATUS_TARGET[pipeline.phase] ?? 0;
    progress.value = withTiming(target, { duration: pipeline.phase === "idle" ? 300 : 420, easing: Easing.out(Easing.cubic) });
    addLog(`Pipeline phase changed to: ${pipeline.phase}`); // 파이프라인 상태 변화 로그 추가
  }, [pipeline.phase]);

    // 비디오 선택 전 권한 상태 확인
  const checkPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    addLog(`MediaLibrary permission status: ${status}`);
    return status === 'granted';
  };

  const onPick = async () => {
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      addLog("No permission to access media library.");
      return;
    }
    addLog("Starting video pick process...");
    
    try {
      const { localUri, durationSec } = await pickVideo();
      addLog(`pickVideo returned - localUri: ${localUri}, durationSec: ${durationSec}`);  // 비디오 선택 후 반환된 값 로그 추가

      if (!localUri) {
        addLog("No video selected.");
        return;
      }

      addLog(`Video selected: ${localUri}`); // 비디오 URI 로그
      addLog(`Video duration: ${durationSec} seconds`); // 비디오 길이 로그

      if (durationSec) {
        pipeline.setPickedDurationSec(durationSec);
      }
      
      addLog("Running pipeline with selected video...");
      await pipeline.run(localUri); // 파이프라인 실행
      addLog("Pipeline run complete.");
    } catch (error: unknown) { // error를 unknown 타입으로 받기
      if (error instanceof Error) { // 타입 가드 사용
        addLog(`Error during video pick or pipeline run: ${error.message}`);
      } else {
        addLog("An unknown error occurred.");
      }
    }
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
        }} ,
      ]
    );
  };

  return (
    <LinearGradient start={{ x:0, y:0 }} end={{ x:1, y:1 }} colors={["#030712", "#0ea5e9", "#000000"]} locations={[0,0.35,1]} style={{ flex:1 }}>
      <View style={{ flex:1, paddingHorizontal:16, justifyContent:"center", alignItems:"center" }}>

        {/* 숨겨진 Video 컴포넌트 */}
        <Video ref={probeRef} style={{ width: 0, height: 0, opacity: 0 }} />

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
