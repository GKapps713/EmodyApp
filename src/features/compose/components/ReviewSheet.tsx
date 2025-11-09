// src/features/compose/components/ReviewSheet.tsx
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import React, { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { ShotItem } from "../compose.types";
import ShotsList from "./ShotsList";
import VideoPreview from "./VideoPreview";

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
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0); // 0~1
  const sheetY = useSharedValue(24); // 초기값을 약간 아래로 줬다가 등장 애니메이션
  const videoRef = useRef(null);

  React.useEffect(() => {
    sheetY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const videoUri = mergedUrl || uploadedUrl || null;

   async function handleDownload() {
    try {
      if (!mergedUrl) {
        Alert.alert("No video", "아직 머지된 영상이 없습니다.");
        return;
      }

      // 권한 요청
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "갤러리 저장 권한이 필요합니다.");
        return;
      }

      setDownloading(true);
      setDlProgress(0);

      const fileName = `emody_${Date.now()}.mp4`;
      const fs = FileSystem as unknown as { documentDirectory?: string | null; cacheDirectory?: string | null };
      const baseDir = fs.documentDirectory ?? fs.cacheDirectory ?? "";
      if (!baseDir) throw new Error("No suitable base directory from expo-file-system.");
      const dest = baseDir + fileName;

      const dl = FileSystem.createDownloadResumable(
        mergedUrl,
        dest,
        {},
        (p) => {
          if (p.totalBytesExpectedToWrite > 0) {
            setDlProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
          }
        }
      );

      const result = await dl.downloadAsync();
      if (!result?.uri) throw new Error("Download failed");

      // 갤러리에 저장
      await MediaLibrary.saveToLibraryAsync(result.uri);

      Alert.alert("Saved", "머지된 영상을 갤러리에 저장했어요.");
    } catch (e: any) {
      Alert.alert("Download error", e?.message ?? "저장 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
      setDlProgress(0);
    }
  }

  return (
    <Animated.View style={[{ position: "absolute", left: 16, right: 16, bottom: 24 }, sheetStyle]}>
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

          {/* 간격은 gap 대신 간단한 여백 View 사용 (RN 버전 호환성) */}
          <View style={{ width: 8 }} />

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
          <VideoPreview ref={videoRef} uri={videoUri ?? undefined} />
        ) : (
          <ShotsList shots={shots} />
        )}

        {/* 하단 버튼 */}
        {/* 하단 버튼 */}
        <View style={{ flexDirection: "row", marginTop: 10, alignItems: "center" }}>
          <Pressable
            onPress={handleDownload}
            disabled={downloading}
            style={{
              flex: 1,
              backgroundColor: downloading ? "#0891b2" : "#06b6d4",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
              opacity: downloading ? 0.85 : 1,
            }}
          >
            <Text style={{ color: "#0b1220", fontWeight: "800" }}>
              {downloading ? `Downloading ${Math.round(dlProgress * 100)}%` : "Download"}
            </Text>
          </Pressable>

          <View style={{ width: 8 }} />

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
            <Text style={{ color: "white", fontWeight: "700" }}>Restart</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
