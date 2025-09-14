// MusicCard.tsx

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MusicCardProps = {
  title: string;
  artist: string;
  onPress: () => void;
};

export default function MusicCard({ title, artist, onPress }: MusicCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.artist}>{artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  title: { fontSize: 16, fontWeight: "bold", color: "white" },
  artist: { fontSize: 14, color: "#9ca3af" },
});
