import { emotionColorMap, emotionEmojiMap } from "@/constants/echoColors";
import { Echo } from "@/src/storage/echoTypes";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EchoCardProps = {
  item: Echo;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDelete: () => void;
  onTogglePurchase: () => void;
  onTogglePublic: (resetLikes?: boolean) => void; // ✅ 비공개 시 좋아요 초기화
};

export default function EchoCard({
  item,
  isPlaying,
  onPlayPause,
  onDelete,
  onTogglePurchase,
  onTogglePublic,
}: EchoCardProps) {
  const emotion = item.emotion ?? "Unknown";

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: emotionColorMap[emotion] ?? "#374151" },
      ]}
    >
      {/* 썸네일 */}
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbBox}>
          <Ionicons name="musical-notes" size={24} color="white" />
        </View>
      )}

      {/* 정보 */}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>
          {Math.floor(item.duration / 60)}:
          {String(item.duration % 60).padStart(2, "0")} sec
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

        {/* ✅ 좋아요 표시 (공개일 때만) */}
        {item.isPublic && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: "cyan", fontWeight: "bold", fontSize: 14 }}>
              ❤️ {item.likes ?? 0}
            </Text>
          </View>
        )}
      </View>

      {/* 버튼들 */}
      <View style={styles.actions}>
        {/* ▶️ 재생/일시정지 */}
        <TouchableOpacity onPress={onPlayPause}>
          <Ionicons
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={32}
            color="white"
          />
        </TouchableOpacity>

        {/* 💳 구매 */}
        <TouchableOpacity onPress={onTogglePurchase}>
          <Ionicons
            name="card"
            size={24}
            color={item.isPurchased ? "cyan" : "gray"}
          />
        </TouchableOpacity>

        {/* 🌍 공개/비공개 */}
        {item.isPurchased && (
          <TouchableOpacity
            onPress={() => {
              if (item.isPublic) {
                // ✅ 비공개로 바꿀 때 좋아요 초기화
                onTogglePublic(true);
              } else {
                onTogglePublic(false);
              }
            }}
          >
            <Ionicons
              name={item.isPublic ? "eye" : "eye-off"}
              size={24}
              color={item.isPublic ? "cyan" : "gray"}
            />
          </TouchableOpacity>
        )}

        {/* 🗑 삭제 */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Delete Echo", `Delete "${item.title}"?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: onDelete },
            ])
          }
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </View>
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
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 11,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    color: "black",
    fontWeight: "600",
    overflow: "hidden",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
});
