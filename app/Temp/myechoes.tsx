import EchoCard from "@/components/EchoCard";
import MiniPlayer from "@/components/MiniPlayer";
import { loadEchoes, setEchoes } from "@/src/storage/echoRepository";
import { Echo } from "@/src/storage/echoTypes";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function MyEchoesScreen() {
  const [echoes, setLocalEchoes] = useState<Echo[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    loadEchoes().then(setLocalEchoes);
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  // keep updating slider position
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sound && playingId && !isPaused) {
      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis ?? 0);
          setDuration(status.durationMillis ?? 0);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [sound, playingId, isPaused]);

  // ▶️ Play / Pause
  const handlePlayPause = async (item: Echo) => {
    try {
      if (playingId === item.id) {
        if (isPaused) {
          await sound?.playAsync();
          setIsPaused(false);
        } else {
          await sound?.pauseAsync();
          setIsPaused(true);
        }
        return;
      }

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.audioUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(item.id);
      setIsPaused(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if ("didJustFinish" in status && status.didJustFinish) {
          if (repeatMode === "one") {
            handlePlayPause(item);
          } else if (repeatMode === "all") {
            playNext();
          } else {
            setPlayingId(null);
            setIsPaused(false);
            setPosition(0);
          }
        }
      });
    } catch (e) {
      console.error("❌ play error:", e);
    }
  };

  // ⏭ Next
  const playNext = () => {
    if (!playingId) return;
    let nextIdx;
    const idx = echoes.findIndex((e) => e.id === playingId);

    if (shuffle) {
      nextIdx = Math.floor(Math.random() * echoes.length);
    } else {
      nextIdx = idx + 1;
      if (nextIdx >= echoes.length) {
        if (repeatMode === "all") nextIdx = 0;
        else return;
      }
    }
    handlePlayPause(echoes[nextIdx]);
  };

  // ⏮ Prev
  const playPrev = () => {
    if (!playingId) return;
    let prevIdx;
    const idx = echoes.findIndex((e) => e.id === playingId);

    if (shuffle) {
      prevIdx = Math.floor(Math.random() * echoes.length);
    } else {
      prevIdx = idx - 1;
      if (prevIdx < 0) {
        if (repeatMode === "all") prevIdx = echoes.length - 1;
        else return;
      }
    }
    handlePlayPause(echoes[prevIdx]);
  };

  // ⏩ Seek
  const onSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  // 💳 Purchase
  const handlePurchase = async (id: string) => {
    const updated = echoes.map((e) =>
      e.id === id ? { ...e, isPurchased: true, expiresAt: undefined } : e
    );
    await setEchoes(updated);
    setLocalEchoes(updated);
  };

  // ✅ 구매 상태 토글
const handleTogglePurchase = async (id: string) => {
  const updated = echoes.map((e) =>
    e.id === id
      ? { ...e, isPurchased: !e.isPurchased, expiresAt: undefined }
      : e
  );
  await setEchoes(updated);
  setLocalEchoes(updated);
};

  // 🌍 Public toggle
  const togglePublic = async (id: string) => {
    const updated = echoes.map((e) =>
      e.id === id && e.isPurchased ? { ...e, isPublic: !e.isPublic } : e
    );
    await setEchoes(updated);
    setLocalEchoes(updated);
  };

  // 🗑 Delete
  const handleDelete = async (id: string) => {
    const updated = echoes.filter((e) => e.id !== id);
    await setEchoes(updated);
    setLocalEchoes(updated);
    if (playingId === id) {
      await sound?.stopAsync();
      setPlayingId(null);
    }
  };

  const currentTrack = echoes.find((e) => e.id === playingId);

  return (
    <View style={{ flex: 1, backgroundColor: "#111827", padding: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🎶 My Echoes</Text>
      </View>

      {/* List */}
      <FlatList
        data={echoes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 200 }}
        renderItem={({ item }) => {
          const isPlaying = playingId === item.id && !isPaused;
          return (
            <EchoCard
              item={item}
              isPlaying={isPlaying}
              onPlayPause={() => handlePlayPause(item)}
              onDelete={() => handleDelete(item.id)}
              onTogglePurchase={() => handleTogglePurchase(item.id)}
              onTogglePublic={() => togglePublic(item.id)}
            />
          );
        }}
      />

      {/* Mini Player */}
      {currentTrack && (
        <MiniPlayer
          title={currentTrack.title}
          position={position}
          duration={duration}
          isPaused={isPaused}
          shuffle={shuffle}
          repeatMode={repeatMode}
          onSeek={onSeek}
          onPlayPause={() => handlePlayPause(currentTrack)}
          onNext={playNext}
          onPrev={playPrev}
          onToggleShuffle={() => setShuffle(!shuffle)}
          onToggleRepeat={() =>
            setRepeatMode(
              repeatMode === "off"
                ? "one"
                : repeatMode === "one"
                ? "all"
                : "off"
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: { color: "white", fontSize: 20, fontWeight: "bold" },
});
