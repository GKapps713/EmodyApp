// app/dev.tsx
import { Audio, ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { generateTracks, requestMerge, uploadVideo, type Track, type UploadedVideo } from "../../src/utils/api";

type Step = "idle" | "uploading" | "uploaded" | "genWorking" | "tracksReady" | "merging" | "merged" | "error";

const Button = ({ title, onPress, disabled }: { title: string; onPress?: () => void; disabled?: boolean }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => ({
      opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
      backgroundColor: "#111827",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginRight: 8,
    })}
  >
    <Text style={{ color: "white", fontWeight: "600" }}>{title}</Text>
  </Pressable>
);

export default function DevPage() {
  const [step, setStep] = useState<Step>("idle");
  const [err, setErr] = useState<string | null>(null);

  // Step1
  const [uploaded, setUploaded] = useState<UploadedVideo | null>(null);

  // Step2
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const previewRef = useRef<Audio.Sound | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  // Step3
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  // ✅ Sharing 사용 가능 여부 비동기 초기화
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const available = await Sharing.isAvailableAsync();
        setCanShare(available);
      } catch {
        setCanShare(false);
      }
    })();

    // 미리보기 사운드 정리
    return () => {
      if (previewRef.current) {
        previewRef.current.unloadAsync().catch(() => {});
        previewRef.current = null;
      }
    };
  }, []);

  const pickVideo = async () => {
    setErr(null);
    setMergedUrl(null);
    setSelectedTrack(null);
    setTracks([]);

    let localUri: string | undefined;

    const result = await DocumentPicker.getDocumentAsync({
      type: ["video/*"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      localUri = result.assets[0].uri;
    }

    if (!localUri && Platform.OS !== "web") {
      const lib = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
      });
      if (!lib.canceled && lib.assets.length) localUri = lib.assets[0].uri;
    }

    if (!localUri) return;

    try {
      setStep("uploading");
      const up = await uploadVideo(localUri);
      setUploaded(up);
      setStep("uploaded");
    } catch (e: any) {
      setErr(e.message ?? "Upload error");
      setStep("error");
    }
  };

  const createMusic = async () => {
    if (!uploaded) {
      console.log("Upload not completed, exiting createMusic");
      return;
    }
    setErr(null);
    try {
      setStep("genWorking");
      const result = await generateTracks({
        prompt: "uplifting cinematic ambient for social video",
        seconds: 5,
        style: "cinematic",
        count: 1,
      });
      setTracks(result);
      setStep("tracksReady");
    } catch (e: any) {
      const errorMessage = e.message ?? "Generate error";
      setErr(errorMessage);
      setStep("error");
    }
  };

  const togglePreview = async (item: Track) => {
    if (selectedTrack?.trackId === item.trackId && previewRef.current) {
      const status = await previewRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await previewRef.current.pauseAsync();
        setPreviewPlaying(false);
      } else {
        await previewRef.current.playAsync();
        setPreviewPlaying(true);
      }
      return;
    }

    try {
      setPreviewLoading(true);
      if (previewRef.current) {
        await previewRef.current.unloadAsync();
        previewRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: item.url }, { shouldPlay: true });
      previewRef.current = sound;
      setSelectedTrack(item);
      setPreviewPlaying(true);
    } catch (e: any) {
      Alert.alert("Preview Error", e.message ?? "failed to preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const mergeNow = async () => {
    if (!uploaded || !selectedTrack) return;
    setErr(null);
    try {
      setStep("merging");
      const merged = await requestMerge(uploaded.videoId, selectedTrack.trackId);
      console.log("[mergeNow] merged result:", merged);
      setMergedUrl(merged.mergedUrl);
      setStep("merged");
    } catch (e: any) {
      setErr(e.message ?? "Merge error");
      setStep("error");
    }
  };

  // ✅ 플랫폼별 다운로드 처리
const downloadMerged = async () => {
  if (!mergedUrl) return;
  try {
    if (Platform.OS === "web") {
      // 🌐 Web: 브라우저 다운로드 링크 트리거
      const a = document.createElement("a");
      a.href = mergedUrl;
      a.download = `merged_${Date.now()}.mp4`;
      a.click();
      return;
    }

    // 📱 모바일: 갤러리 저장
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Please allow access to save files.");
      return;
    }

    const filename = `merged_${Date.now()}.mp4`;

    // ✅ 타입 안전 캐스팅 (TS2339 해결)
    const cacheDir = (FileSystem as any).cacheDirectory as string | null;
    if (!cacheDir) throw new Error("No cache directory available");

    const dest = cacheDir + filename;
    const { uri } = await FileSystem.downloadAsync(mergedUrl, dest);
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Downloaded", "Video saved to your gallery!");
  } catch (e: any) {
    Alert.alert("Download Error", e.message ?? "failed to download");
  }
};

  const shareLink = async () => {
    if (!mergedUrl) return;
    try {
      if (!canShare) {
        Alert.alert("Share", "Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(mergedUrl);
    } catch (e: any) {
      Alert.alert("Share Error", e.message ?? "failed to share");
    }
  };

  return (
    <ScrollView
      // ✅ 스크롤 문제 해결: contentContainerStyle로 바닥 여백 확보
      contentContainerStyle={{
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 120, // 하단 제스처 바/네비를 고려한 충분한 여백
      }}
      keyboardShouldPersistTaps="handled"
      // (옵션) 안드로이드 특정 기기에서 도움됨
      nestedScrollEnabled
      // style은 배경만 주고 flex는 제거 (일부 레이아웃에서 스크롤 저해 요인)
      style={{ backgroundColor: "#0b1220" }}
      scrollIndicatorInsets={{ bottom: 80 }}
    >
      <Text style={{ color: "white", fontSize: 20, fontWeight: "800", marginBottom: 8 }}>EmodyApp DEV</Text>
      <Text style={{ color: "#93c5fd", marginBottom: 16 }}>MVP — Upload → Create music → Merge → Download/Share</Text>

      {/* STEP 1 */}
      <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8 }}>Step 1 — Upload video</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <Button title="Pick & Upload" onPress={pickVideo} disabled={step === "uploading"} />
          {step === "uploading" && <ActivityIndicator style={{ marginLeft: 8 }} />}
        </View>
        {uploaded && (
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#d1d5db" }}>videoId: {uploaded.videoId}</Text>
            <Text style={{ color: "#d1d5db" }} numberOfLines={1}>url: {uploaded.videoUrl}</Text>
            <Video
              ref={videoRef}
              source={{ uri: uploaded.videoUrl }}
              style={{ width: "100%", height: 200, backgroundColor: "black", borderRadius: 8, marginTop: 8 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          </View>
        )}
      </View>

      {/* STEP 2 */}
      <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8 }}>Step 2 — Create music (Stable Audio)</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <Button title="Generate Track" onPress={createMusic} disabled={step === "genWorking" || !uploaded} />
          {step === "genWorking" && <ActivityIndicator style={{ marginLeft: 8 }} />}
        </View>

        <FlatList
          data={tracks}
          keyExtractor={(t) => t.trackId}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = selectedTrack?.trackId === item.trackId;
            return (
              <Pressable
                onPress={() => togglePreview(item)}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: isSelected ? "#1f2937" : "#0f172a",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{item.title || item.trackId}</Text>
                <Text style={{ color: "#9ca3af" }} numberOfLines={1}>{item.url}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  {previewLoading && isSelected ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={{ color: "#a7f3d0" }}>
                      {isSelected && previewPlaying ? "▶ Playing" : "Tap to Preview"}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={{ color: "#9ca3af" }}>No tracks yet.</Text>}
        />
      </View>

      {/* STEP 3 */}
      <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8 }}>Step 3 — Merge</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <Button title="Merge Video + Track" onPress={mergeNow} disabled={!uploaded || !selectedTrack || step === "merging"} />
          {step === "merging" && <ActivityIndicator style={{ marginLeft: 8 }} />}
        </View>
        {mergedUrl && (
          <View>
            <Text style={{ color: "#d1d5db" }} numberOfLines={1}>mergedUrl: {mergedUrl}</Text>
            <Video
              source={{ uri: mergedUrl }}
              style={{ width: "100%", height: 220, backgroundColor: "black", borderRadius: 8, marginTop: 8 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          </View>
        )}
      </View>

      {/* STEP 4 */}
      <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8 }}>Step 4 — Download / Share</Text>
        <View style={{ flexDirection: "row" }}>
          <Button title="Download (dev)" onPress={downloadMerged} disabled={!mergedUrl} />
          {/* <Button title="Share link" onPress={shareLink} disabled={!mergedUrl || !canShare} /> */}
        </View>
      </View>

      {/* ✅ 스크롤 여유 공간 (안전 여백) */}
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
