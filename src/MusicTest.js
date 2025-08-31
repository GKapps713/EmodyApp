// src/MusicTest.js
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { fetchMusic } from "./services/musicApi";

export default function MusicTest() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    fetchMusic("happy").then(setTracks).catch(console.error);
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>추천 음악</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.videoId}
        renderItem={({ item }) => (
          <Text>- {item.title} ({item.artist})</Text>
        )}
      />
    </View>
  );
}
