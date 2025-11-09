// src/features/compose/components/ReviewSheet.tsx
import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import type { ShotItem } from "../compose.types";
import ShotsList from "./ShotsList";
import VideoPreview from "./VideoPreview"; // 기존 import 유지

const BOTTOM_SHEET_HEIGHT = 230;

export default function ReviewSheet({
  mergedUrl,
  uploadedUrl,
  shots,
  onShare,
  onRestart,
}: {
  mergedUrl: string | null;
  uploadedUrl: string | null;
  shots: ShotItem[];
  onShare: () => void;
  onRestart: () => void;
}) {
  const [active, setActive] = useState<"video" | "shots">("video");
  const sheetY = useSharedValue(0);
  const videoRef = useRef(null); // ref가 타입에 맞게 업데이트

  // 등장 애니메이션
  React.useEffect(() => {
    sheetY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, []);

  const videoUri = mergedUrl || uploadedUrl || null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 24,
        transform: [{ translateY: sheetY }],
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(17, 24, 39, 0.85)",
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          minHeight: BOTTOM_SHEET_HEIGHT - 24,
        }}
      >
        {/* 탭 */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <Pressable
            onPress={() => setActive("video")}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: active === "video" ? "#06b6d4" : "transparent",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: active === "video" ? "#fff" : "#bdbdbd" }}>Video</Text>
          </Pressable>
          <Pressable
            onPress={() => setActive("shots")}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: active === "shots" ? "#06b6d4" : "transparent",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: active === "shots" ? "#fff" : "#bdbdbd" }}>Shots</Text>
          </Pressable>
        </View>

        {active === "video" ? (
          // VideoPreview 컴포넌트에 ref 전달 (기존대로)
          <VideoPreview ref={videoRef} uri={videoUri} />
        ) : (
          <ShotsList shots={shots} />
        )}

        {/* 하단 버튼 */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <Pressable
            onPress={onShare}
            style={{
              flex: 1,
              backgroundColor: "#06b6d4",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#0b1220", fontWeight: "800" }}>Share</Text>
          </Pressable>

          <Pressable
            onPress={onRestart}
            style={{
              flex: 1,
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1e293b",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Restart</Text> {/* 텍스트 수정 */}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
