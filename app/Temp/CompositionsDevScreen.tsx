import { clearCompositions, loadCompositions, removeComposition, updateComposition } from "@/src/storage/compositionRepository";
import { CompositionRecord } from "@/src/storage/compositionTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CompositionsDevScreen() {
  const [items, setItems] = useState<CompositionRecord[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // CompositionsDevScreen 내부에 버튼 추가
const dumpKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    console.log("🔎 AsyncStorage keys:", keys);
    const row = pairs.find(([k]) => k === "compositions_v1");
    console.log("🔎 compositions_v1 value:", row?.[1]?.slice(0, 500));
    Alert.alert("Dumped", `keys: ${keys.length} (콘솔 확인)`);
  } catch (e) {
    Alert.alert("Dump error", String(e));
  }
};

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
      refresh();                  // 화면이 다시 포커스될 때마다
    }, [])
  );

  const onDelete = async (id: string) => {
    await removeComposition(id);
    refresh();
  };

  const onClearAll = async () => {
    await clearCompositions();
    refresh();
  };

  const onPlay = async (rec: CompositionRecord) => {
    try {
      if (playingId === rec.id) {
        await sound?.stopAsync();
        await sound?.unloadAsync();
        setPlayingId(null);
        return;
      }
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      const source = { uri: rec.track.localAudioPath ?? rec.track.url };
      const { sound: s } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      setSound(s);
      setPlayingId(rec.id);
    } catch (e) {
      Alert.alert("Play error", String(e));
    }
  };

  // 타입 누락을 우회하는 안전 캐스팅 + 폴백
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
    // 웹 등 특수환경 보호
    throw new Error("No writable base directory available on this platform.");
  }
  return base;
}

 const onDownload = async (rec: CompositionRecord) => {
  try {
    if (!rec.track.url) {
      Alert.alert("No URL", "트랙 URL이 없습니다.");
      return;
    }

    // ✅ Web일 경우: 브라우저 다운로드로 우회
    if (Platform.OS === "web") {
      Alert.alert("Opening in browser", "웹에서는 브라우저 다운로드로 열립니다.");
      Linking.openURL(rec.track.url);
      return;
    }

    // ✅ Native(iOS/Android): 앱 샌드박스에 저장
    const baseDir = getWritableBaseDir();
    if (!baseDir) {
      // 극히 드물지만, 네이티브에서 못 받는 경우 마지막 안전장치
      Alert.alert("Download error", "No writable directory. Opening in browser instead.");
      Linking.openURL(rec.track.url);
      return;
    }

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

  const renderItem = ({ item }: { item: CompositionRecord }) => (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {item.track.title}
      </Text>
      <Text style={styles.meta}>
        {new Date(item.createdAt).toLocaleString()} • {item.seconds}s • steps {item.steps}
      </Text>
      <Text style={styles.meta}>Emotion: {item.analysis?.emotion || "-"}</Text>
      <Text style={styles.prompt} numberOfLines={3}>
        {item.track.promptText}
      </Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => onPlay(item)}>
          <Text style={styles.btnText}>{playingId === item.id ? "⏹ Stop" : "▶ Play"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => onDownload(item)}>
          <Text style={styles.btnText}>⬇ Download</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: "#ef4444" }]} onPress={() => onDelete(item.id)}>
          <Text style={styles.btnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>

      {item.mergedUrl ? (
        <Text style={styles.link} numberOfLines={1}>
          Merged: {item.mergedUrl}
        </Text>
      ) : null}
      {item.track.localAudioPath ? (
        <Text style={styles.link} numberOfLines={1}>
          Local: {item.track.localAudioPath}
        </Text>
      ) : null}
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
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { backgroundColor: "#06b6d4", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: "#0b1220", fontWeight: "800" },
  link: { color: "#93c5fd", fontSize: 12, marginTop: 6 },
});
