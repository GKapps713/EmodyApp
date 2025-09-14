import MusicPlayer from "@/components/MusicPlayer";
import { useResult } from "@/src/ResultContext";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmotionTab() {
  const { result } = useResult();
  const [selectedMusic, setSelectedMusic] = useState<any | null>(null);
  const router = useRouter();

  // ✅ 스크롤 제어용 ref
  const scrollRef = useRef<ScrollView>(null);
  const playerRef = useRef<View>(null);

  const handleSelectMusic = (item: any) => {
    setSelectedMusic(item);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (!result.emotion) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="cyan" />
        <Text style={styles.text}>No emotion selected yet.</Text>
        <Text style={styles.text}>Go to Home and pick an emotion 🎭</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ 헤더 */}
      {/* <View style={styles.headerWrapper}>
        <View style={styles.headerTop}>
          <Image
            source={require("@/assets/images/emody.png")}
            style={styles.icon}
          />
          <Text style={styles.headerTitle}>Emody</Text>
        </View>
      </View> */}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        {/* 감정 카드 */}
        <View style={styles.emotionCard}>
          <Text style={styles.emoji}>{getEmoji(result.emotion)}</Text>
          <Text style={styles.emotionTitle}>{result.emotion}</Text>
          {result.comfort && (
            <Text style={styles.emotionText}>{result.comfort}</Text>
          )}
          {result.quote && (
            <Text style={styles.quote}>💬 {result.quote}</Text>
          )}
        </View>

        {/* 추천 음악 */}
        {result.youtubeResults && (
          <View style={styles.musicGroup}>
            <Text style={styles.sectionTitle}>
              🎵 Recommended Music ({result.youtubeResults.length})
            </Text>
            <View style={styles.musicListBox}>
              {result.youtubeResults.map((item, idx) => {
                const isSelected = selectedMusic?.videoId === item.videoId;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.musicItem,
                      isSelected && styles.musicItemSelected,
                    ]}
                    onPress={() => handleSelectMusic(item)}
                  >
                    <Image
                      source={{
                        uri: `https://img.youtube.com/vi/${item.videoId}/0.jpg`,
                      }}
                      style={styles.thumbnail}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[
                          styles.musicTitle,
                          isSelected && { color: "cyan" },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.musicArtist}>{item.artist}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 선택된 음악 플레이어 */}
        {selectedMusic && (
          <View ref={playerRef} style={{ marginTop: 20 }}>
            <Text style={styles.selected}>
              ▶ Now Playing: {selectedMusic.title}
            </Text>
            <MusicPlayer key={selectedMusic.videoId} videoId={selectedMusic.videoId} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getEmoji(emotion: string) {
  const map: Record<string, string> = {
    Sad: "😢",
    Happy: "🙂",
    Anxious: "😟",
    Angry: "😡",
    Tired: "😴",
    Fearful: "😨",
    Moved: "😭",
    Confident: "😎",
    Bored: "🥱",
  };
  return map[emotion] ?? "🎵";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // 네이비톤 배경
  },
  // 헤더
  headerWrapper: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  icon: {
    width: 28,
    height: 28,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  back: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  // 컨텐츠
  scrollContent: {
    padding: 20,
  },
  emotionCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: 10 },
  emotionTitle: { fontSize: 24, fontWeight: "bold", color: "white" },
  emotionText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  quote: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 10,
    fontStyle: "italic",
    textAlign: "center",
  },

  // 추천 음악
  musicGroup: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  musicListBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 10,
  },
  musicItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  musicItemSelected: {
    borderWidth: 2,
    borderColor: "cyan",
    backgroundColor: "#273A5D",
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  musicTitle: { fontSize: 16, fontWeight: "500", color: "white" },
  musicArtist: { fontSize: 14, color: "#9ca3af" },
  selected: {
    marginTop: 10,
    fontSize: 16,
    color: "cyan",
    textAlign: "center",
  },

  // 기본 텍스트
  text: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
});
