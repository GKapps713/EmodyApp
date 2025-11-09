// src/screens/CompositionsDevScreen.tsx
import { clearCompositions, loadCompositions, updateComposition } from "@/src/storage/compositionRepository";
import { CompositionRecord } from "@/src/storage/compositionTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CompositionsDevScreen() {
  const [items, setItems] = useState<CompositionRecord[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // Debug: AsyncStorage 덤프
  // ─────────────────────────────────────────────────────────
  const dumpKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      console.log("🔎 AsyncStorage keys:", keys);
      const row = pairs.find(([k]) => k === "compositions_v1");
      console.log("🔎 compositions_v1 value:", row?.[1]?.slice(0, 1000));
      Alert.alert("Dumped", `keys: ${keys.length} (콘솔 확인)`);
    } catch (e) {
      Alert.alert("Dump error", String(e));
    }
  };

  // ─────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    refresh();
    return () => { sound?.unloadAsync(); };
  }, []);

  const refresh = async () => {
    const list = await loadCompositions();
    setItems(list);
  };

  useFocusEffect(
    useCallback(() => {
      refresh(); // 화면 포커스될 때마다 갱신
    }, [])
  );

  // ─────────────────────────────────────────────────────────
  // CRUD / Actions
  // ─────────────────────────────────────────────────────────
  const onClearAll = async () => {
    await clearCompositions();
    refresh();
  };

  // ─────────────────────────────────────────────────────────
// Audio helpers
// ─────────────────────────────────────────────────────────
async function safeUnload(current?: Audio.Sound | null) {
  if (!current) return;
  try {
    const st = await current.getStatusAsync();
    if (st.isLoaded) {
      if (st.isPlaying) {
        await current.stopAsync();
      }
      await current.unloadAsync();
    }
  } catch {
    // ignore
  }
}

async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,   // iOS 무음 스위치에서도 재생
      staysActiveInBackground: false,
      shouldDuckAndroid: true,      // 다른 소리 위에 살짝 볼륨 줄이기
      playThroughEarpieceAndroid: false,
      // interruptionModeIOS / interruptionModeAndroid 옵션은 제거 (SDK 최신 타입에 없음)
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────
// 재생 버튼
// ─────────────────────────────────────────────────────────
const onPlay = async (rec: CompositionRecord) => {
  try {
    const url = rec.track.localAudioPath ?? rec.track.url;
    if (!url) {
      Alert.alert("Play error", "오디오 URL이 없습니다.");
      return;
    }

    // 같은 카드 다시 누르면 정지/정리
    if (playingId === rec.id) {
      await safeUnload(sound);
      setSound(null);
      setPlayingId(null);
      return;
    }

    // 다른 소리 재생 중이면 정리
    await safeUnload(sound);

    await ensureAudioMode();

    // 로드 & 즉시 재생
    const { sound: s, status } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );

    // 종료되면 자동 정리
    s.setOnPlaybackStatusUpdate(async (st) => {
      if (!st.isLoaded) return;
      if ((st as any).didJustFinish) {
        setPlayingId(null);
        try { await s.unloadAsync(); } catch {}
      }
    });

    setSound(s);
    setPlayingId(rec.id);
  } catch (e: any) {
    Alert.alert("Play error", String(e?.message || e));
  }
};
  // ─────────────────────────────────────────────────────────
  // FileSystem helpers
  // ─────────────────────────────────────────────────────────
  const FS_ANY = FileSystem as unknown as {
    cacheDirectory?: string | null;
    documentDirectory?: string | null;
  };

  function getWritableBaseDir(): string {
    const base =
      FS_ANY.documentDirectory ??
      FS_ANY.cacheDirectory ??
      null;

    if (!base) {
      throw new Error("No writable base directory available on this platform.");
    }
    return base;
  }

  const onOpenLink = (url?: string | null) => {
    if (!url) {
      Alert.alert("No URL", "열 수 있는 URL이 없습니다.");
      return;
    }
    Linking.openURL(url);
  };

  // 오디오 파일 다운로드
  const onDownloadAudio = async (rec: CompositionRecord) => {
    try {
      if (!rec.track.url) {
        Alert.alert("No URL", "트랙 URL이 없습니다.");
        return;
      }

      if (Platform.OS === "web") {
        Alert.alert("Opening in browser", "웹에서는 브라우저 다운로드로 열립니다.");
        Linking.openURL(rec.track.url);
        return;
      }

      const baseDir = getWritableBaseDir();
      const appDir = baseDir + "compositions/";
      await FileSystem.makeDirectoryAsync(appDir, { intermediates: true }).catch(() => {});

      const filename = `${rec.track.trackId || `audio_${Date.now()}`}.mp3`;
      const dest = appDir + filename;

      const { uri, status } = await FileSystem.downloadAsync(rec.track.url, dest);
      if (status >= 200 && status < 300) {
        await updateComposition(rec.id, {
          track: { ...rec.track, localAudioPath: uri },
        });
        Alert.alert("Saved", `Saved to: ${uri}`);
        refresh();
      } else {
        Alert.alert("Download failed", `status ${status}`);
      }
    } catch (e) {
      Alert.alert("Download error", String(e));
    }
  };

  // 머지된 비디오 다운로드
  const onDownloadVideo = async (rec: CompositionRecord) => {
    try {
      if (!rec.mergedUrl) {
        Alert.alert("No URL", "머지된 영상 URL이 없습니다.");
        return;
      }

      if (Platform.OS === "web") {
        Alert.alert("Opening in browser", "웹에서는 브라우저 다운로드로 열립니다.");
        Linking.openURL(rec.mergedUrl);
        return;
      }

      const baseDir = getWritableBaseDir();
      const appDir = baseDir + "compositions/";
      await FileSystem.makeDirectoryAsync(appDir, { intermediates: true }).catch(() => {});

      const filename = `${rec.id || `video_${Date.now()}`}.mp4`;
      const dest = appDir + filename;

      const { uri, status } = await FileSystem.downloadAsync(rec.mergedUrl, dest);
      if (status >= 200 && status < 300) {
        // 타입 스키마에 mergedLocalPath가 없다면 any로 저장하거나 스키마에 추가하세요.
        await updateComposition(rec.id, { ...(rec as any), mergedLocalPath: uri } as any);
        Alert.alert("Saved", `Saved to: ${uri}`);
        refresh();
      } else {
        Alert.alert("Download failed", `status ${status}`);
      }
    } catch (e) {
      Alert.alert("Download error", String(e));
    }
  };

  // ─────────────────────────────────────────────────────────
  // Prompt Helpers (Stage1/Stage2)
  // ─────────────────────────────────────────────────────────
  function buildStage1PromptFromAnalysis(rec: CompositionRecord) {
    const a = rec.analysis || {};
    const lines = [
      `Emotion: ${a.emotion ?? "-"}`,
      `Genre: ${a.genre ?? "-"}`,
      `Style: ${a.style ?? "-"}`,
      `Mood: ${a.mood ?? "-"}`,
      `Description: ${a.description ?? "-"}`,
      `Duration: ${rec.seconds ?? a.durationSec ?? "-"}s`,
    ];
    return lines.join("\n");
  }

  function getStage2Prompt(rec: CompositionRecord) {
    return rec.track?.promptText || "";
  }

  const onViewStage1 = (rec: CompositionRecord) => {
    Alert.alert("Prompt (1)", buildStage1PromptFromAnalysis(rec));
  };

  const onShareStage1 = async (rec: CompositionRecord) => {
    await Share.share({ message: buildStage1PromptFromAnalysis(rec) });
  };

  const onViewStage2 = (rec: CompositionRecord) => {
    Alert.alert("Prompt (2)", getStage2Prompt(rec) || "(no prompt)");
  };

  const onShareStage2 = async (rec: CompositionRecord) => {
    const p = getStage2Prompt(rec);
    if (!p) return Alert.alert("No prompt", "2단계 프롬프트가 없습니다.");
    await Share.share({ message: p });
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: CompositionRecord }) => (
    <View style={styles.card}>
      
      <Text style={styles.title} numberOfLines={1}>
        {item.track.title}
      </Text>
      
      {/* 재생 / 오디오 다운로드 */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => onPlay(item)}>
          <Text style={styles.btnText}>{playingId === item.id ? "⏹ Stop" : "▶ Play Audio"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => onDownloadAudio(item)}>
          <Text style={styles.btnText}>⬇ Download</Text>
        </TouchableOpacity>
      </View>

      {/* 머지 영상: 열기 / 다운로드 */}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#10b981" }]} onPress={() => onOpenLink(item.mergedUrl)}>
          <Text style={styles.btnText}>🎬 Open Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#22c55e" }]} onPress={() => onDownloadVideo(item)}>
          <Text style={styles.btnText}>⬇ Download</Text>
        </TouchableOpacity>
      </View>

      {/* Stage 1 (썸네일→GPT 요약) 액션 */}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#6366f1" }]} onPress={() => onViewStage1(item)}>
          <Text style={styles.btnText}>👁 Prompt (1)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => onShareStage1(item)}>
          <Text style={styles.btnText}>📤 Share</Text>
        </TouchableOpacity>

      </View>

      {/* Stage 2 (최종 Stable Audio 프롬프트) 액션 */}
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#4f46e5" }]} onPress={() => onViewStage2(item)}>
          <Text style={styles.btnText}>👁 Prompt (2)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#0284c7" }]} onPress={() => onShareStage2(item)}>
          <Text style={styles.btnText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>🧪 Compositions (Dev)</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#334155" }]} onPress={onClearAll}>
          <Text style={styles.btnText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#64748b" }]} onPress={dumpKeys}>
          <Text style={styles.btnText}>Dump</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  header: { color: "white", fontSize: 18, fontWeight: "bold" },
  card: { backgroundColor: "#111827", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1f2937" },
  title: { color: "white", fontSize: 16, fontWeight: "700" },
  meta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  prompt: { color: "#cbd5e1", fontSize: 12, marginTop: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  btn: { backgroundColor: "#06b6d4", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: "#0b1220", fontWeight: "800" },
  link: { color: "#93c5fd", fontSize: 12, marginTop: 6 },
});
