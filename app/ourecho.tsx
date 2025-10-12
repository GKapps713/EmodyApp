import MiniPlayer from "@/components/MiniPlayer";
import OurEchoCard from "@/components/OurEchoCard";
import { echoOptions } from "@/constants/echoOptions";
import { dummyEchoes, PublicEcho } from "@/src/storage/dummyEchoes";
import { UserLike } from "@/src/storage/echoTypes";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function isNewEcho(createdAt: string, days = 3): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) <= days;
}

function isBoosted(boostedUntil?: string): boolean {
  return boostedUntil ? new Date(boostedUntil) > new Date() : false;
}

function getTopEchoes(
  echoes: PublicEcho[],
  range: "day" | "week" | "month"
): PublicEcho[] {
  const now = new Date();
  const rangeDays = range === "day" ? 1 : range === "week" ? 7 : 30;

  return echoes
    .map((echo) => {
      let total = 0;
      if (echo.likesHistory) {
        for (const entry of echo.likesHistory) {
          const date = new Date(entry.date);
          const diff =
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= rangeDays) total += entry.count;
        }
      }
      return { ...echo, totalLikes: total };
    })
    .filter((e) => e.totalLikes > 0)
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 3);
}

export default function OurEchoScreen() {
  const [echoes, setEchoes] = useState<PublicEcho[]>(dummyEchoes);
  const [userLikes, setUserLikes] = useState<UserLike[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const [filterEmotion, setFilterEmotion] = useState<string | null>(null);

  const currentUserId = "me"; // ✅ 로그인 연동 전 임시 사용자

  // ✅ 좋아요 토글
  const toggleLike = (echoId: string) => {
    const hasLiked = userLikes.find(
      (l) => l.echoId === echoId && l.userId === currentUserId && l.liked
    );

    setUserLikes((prev) => {
      const exists = prev.find((l) => l.echoId === echoId && l.userId === currentUserId);
      if (exists) {
        return prev.map((l) =>
          l.echoId === echoId && l.userId === currentUserId
            ? { ...l, liked: !l.liked }
            : l
        );
      } else {
        return [...prev, { echoId, userId: currentUserId, liked: true }];
      }
    });

    setEchoes((prev) =>
      prev.map((e) =>
        e.id === echoId
          ? { ...e, likes: e.likes + (hasLiked ? -1 : 1) }
          : e
      )
    );
  };

  // ✅ 감정 필터
  const applyFilter = (list: PublicEcho[]) => {
    if (!filterEmotion) return list;
    return list.filter((e) => e.emotion === filterEmotion);
  };

  const boosted = applyFilter(echoes.filter((e) => isBoosted(e.boostedUntil)));
  const newEchoes = applyFilter(
    echoes.filter(
      (e) => !isBoosted(e.boostedUntil) && isNewEcho(e.createdAt, 3)
    )
  );
  const popular = applyFilter(
    echoes
      .filter((e) => !isBoosted(e.boostedUntil) && !isNewEcho(e.createdAt, 3))
      .sort((a, b) => b.echoScore - a.echoScore)
  );
  const topEchoes = applyFilter(getTopEchoes(echoes, range));

  // ✅ 특정 Echo 좋아요 여부 조회
  const isEchoLiked = (echoId: string) =>
    userLikes.some((l) => l.echoId === echoId && l.userId === currentUserId && l.liked);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 감정 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterEmotion && { backgroundColor: "cyan" },
            ]}
            onPress={() => setFilterEmotion(null)}
          >
            <Text style={styles.filterText}>All</Text>
          </TouchableOpacity>
          {echoOptions.emotions.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.filterChip,
                filterEmotion === opt.label && { backgroundColor: "cyan" },
              ]}
              onPress={() =>
                setFilterEmotion(filterEmotion === opt.label ? null : opt.label)
              }
            >
              <Text style={styles.filterText}>
                {opt.emoji} {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Echoes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🏆 Top Echoes</Text>
          <View style={styles.rangeRow}>
            {["day", "week", "month"].map((r) => (
              <TouchableOpacity key={r} onPress={() => setRange(r as any)}>
                <Text
                  style={[
                    styles.rangeText,
                    range === r && { color: "cyan", fontWeight: "bold" },
                  ]}
                >
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {topEchoes.map((item, idx) => (
            <OurEchoCard
              key={item.id}
              item={item}
              isPlaying={currentId === item.id}
              isLiked={isEchoLiked(item.id)}
              onPlayPause={() =>
                setCurrentId(currentId === item.id ? null : item.id)
              }
              onToggleLike={() => toggleLike(item.id)}
              rank={idx + 1}
            />
          ))}
        </View>

        {/* Boosted */}
        {boosted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>🚀 Boosted Echoes</Text>
            {boosted.map((item) => (
              <OurEchoCard
                key={item.id}
                item={item}
                isPlaying={currentId === item.id}
                isLiked={isEchoLiked(item.id)}
                onPlayPause={() =>
                  setCurrentId(currentId === item.id ? null : item.id)
                }
                onToggleLike={() => toggleLike(item.id)}
              />
            ))}
          </View>
        )}

        {/* New */}
        {newEchoes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>✨ New Echoes</Text>
            {newEchoes.map((item) => (
              <OurEchoCard
                key={item.id}
                item={item}
                isPlaying={currentId === item.id}
                isLiked={isEchoLiked(item.id)}
                onPlayPause={() =>
                  setCurrentId(currentId === item.id ? null : item.id)
                }
                onToggleLike={() => toggleLike(item.id)}
              />
            ))}
          </View>
        )}

        {/* Popular */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🔥 Popular Echoes</Text>
          {popular.map((item) => (
            <OurEchoCard
              key={item.id}
              item={item}
              isPlaying={currentId === item.id}
              isLiked={isEchoLiked(item.id)}
              onPlayPause={() =>
                setCurrentId(currentId === item.id ? null : item.id)
              }
              onToggleLike={() => toggleLike(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* MiniPlayer */}
      {currentId && (
        <MiniPlayer
          title={echoes.find((e) => e.id === currentId)?.title ?? "Unknown"}
          position={30 * 1000}
          duration={120 * 1000}
          isPaused={false}
          shuffle={false}
          repeatMode="off"
          onSeek={(v) => console.log("Seek", v)}
          onPlayPause={() => console.log("Play/Pause")}
          onNext={() => console.log("Next")}
          onPrev={() => console.log("Prev")}
          onToggleShuffle={() => console.log("Shuffle")}
          onToggleRepeat={() => console.log("Repeat")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", padding: 16 },
  section: { marginBottom: 20 },
  sectionHeader: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  rangeText: {
    color: "gray",
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#374151",
    marginRight: 6,
  },
  filterText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
});
