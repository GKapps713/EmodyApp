import { emotionColorMap, emotionEmojiMap } from "@/constants/echoColors";
import { PublicEcho } from "@/src/storage/dummyEchoes";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  item: PublicEcho;
  isPlaying: boolean;
  onPlayPause: () => void;
  onToggleLike: () => void;
  rank?: number;
  isLiked?: boolean; // ✅ 현재 사용자 좋아요 여부
};

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
const rankIcons = ["🥇", "🥈", "🥉"];

export default function OurEchoCard({
  item,
  isPlaying,
  onPlayPause,
  onToggleLike,
  rank,
  isLiked,
}: Props) {
  const rankColor = rank ? rankColors[rank - 1] : undefined;
  const rankIcon = rank ? rankIcons[rank - 1] : undefined;
  const emotion = item.emotion ?? "Unknown";

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: rankColor ?? emotionColorMap[emotion] ?? "#374151" },
      ]}
    >
      {/* 랭킹 */}
      {rank && (
        <View style={styles.rankBox}>
          <Text style={styles.rankText}>#{rank}</Text>
          <Text style={[styles.rankIcon, { color: rankColor }]}>{rankIcon}</Text>
        </View>
      )}

      {/* 썸네일 */}
      {item.thumbnail && (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      )}

      {/* 정보 */}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>
          by {item.creator} · {Math.floor(item.duration / 60)}:
          {String(item.duration % 60).padStart(2, "0")}
        </Text>

        {/* 감정 칩 */}
        {emotion !== "Unknown" && (
          <View style={styles.tagsRow}>
            <Text
              style={[
                styles.tagChip,
                { backgroundColor: emotionColorMap[emotion] ?? "#374151" },
              ]}
            >
              {emotionEmojiMap[emotion] ?? "🎵"} {emotion}
            </Text>
          </View>
        )}
      </View>

      {/* 좋아요 */}
      {item.isPublic && (
        <View style={styles.likeBox}>
          <TouchableOpacity onPress={onToggleLike} style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "red" : "white"}
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: "cyan", fontWeight: "bold", fontSize: 14 }}>
              {item.likes}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Play/Pause */}
      <TouchableOpacity onPress={onPlayPause}>
        <Ionicons
          name={isPlaying ? "pause-circle" : "play-circle"}
          size={36}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    borderLeftWidth: 4,
  },
  rankBox: {
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  rankIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: "gray",
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tagChip: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    color: "black",
    fontWeight: "600",
    marginRight: 4,
  },
  likeBox: {
    alignItems: "center",
    marginRight: 8,
  },
});
