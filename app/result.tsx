// app/result.tsx

import MusicList from "@/components/MusicList";
import MusicPlayer from "@/components/MusicPlayer";
import { API_URL } from "@/src/config";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Music = {
  title: string;
  artist: string;
  videoId: string;
};

export default function ResultScreen() {
  const { emotion } = useLocalSearchParams<{ emotion: string }>();
  const [musics, setMusics] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);

  const [comfort, setComfort] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/analyze-emotion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: emotion, language: "ko", useAiMusic: false }),
        });
        const data = await res.json();

        console.log("Analysis result:", data);

        setComfort(data.comfortMessage);
        setQuote(data.inspirationalQuote);
        setMusics(data.youtubeResults);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [emotion]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="cyan" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Selected Emotion: {emotion}</Text>

      {comfort && <Text style={styles.text}>💡 {comfort}</Text>}
      {quote && <Text style={styles.text}>📖 {quote}</Text>}

      <MusicList musics={musics} onSelect={(m) => setSelectedMusic(m)} />

      {selectedMusic && (
        <>
          <Text style={styles.selected}>
            ▶ Now Playing: {selectedMusic.title}
          </Text>
          <MusicPlayer videoId={selectedMusic.videoId} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 20 },
  text: { fontSize: 16, color: "white", marginBottom: 10 },
  selected: { marginTop: 20, fontSize: 16, color: "cyan", textAlign: "center" },
});
