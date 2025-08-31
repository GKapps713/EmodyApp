// app/result.tsx

import MusicList from "@/components/MusicList";
import MusicPlayer from "@/components/MusicPlayer";
import { API_URL } from "@/src/config"; // 경로 맞춰 import
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const res = await fetch(`http://<YOUR_PC_IP>:3000/api/music?emotion=${emotion}`);
        //const res = await fetch(`http://172.30.1.78:3000/api/music?emotion=${emotion}`);
        const res = await fetch(`${API_URL}/music?emotion=${emotion}`);
        const data = await res.json();
        setMusics(data);
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
  selected: { marginTop: 20, fontSize: 16, color: "cyan", textAlign: "center" },
});
