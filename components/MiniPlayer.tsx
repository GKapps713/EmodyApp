import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

type MiniPlayerProps = {
  title: string;
  position: number;
  duration: number;
  isPaused: boolean;
  shuffle: boolean;
  repeatMode: "off" | "one" | "all";
  onSeek: (value: number) => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
};

export default function MiniPlayer({
  title,
  position,
  duration,
  isPaused,
  shuffle,
  repeatMode,
  onSeek,
  onPlayPause,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
}: MiniPlayerProps) {
  return (
    <View style={styles.miniPlayer}>
      <Text style={{ color: "white", fontWeight: "600" }} numberOfLines={1}>
        {title}
      </Text>

      <Slider
        style={{ width: "100%", height: 20 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={onSeek}
        minimumTrackTintColor="cyan"
        maximumTrackTintColor="#374151"
        thumbTintColor="cyan"
      />

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onToggleShuffle}>
          <Ionicons
            name="shuffle"
            size={28}
            color={shuffle ? "cyan" : "white"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onPrev}>
          <Ionicons name="play-skip-back" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onPlayPause}>
          <Ionicons
            name={isPaused ? "play-circle" : "pause-circle"}
            size={40}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext}>
          <Ionicons name="play-skip-forward" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onToggleRepeat}>
          <Ionicons
            name="repeat"
            size={28}
            color={repeatMode === "off" ? "white" : "cyan"}
          />
          {repeatMode === "one" && (
            <Text
              style={{
                position: "absolute",
                right: 8,
                bottom: 0,
                color: "cyan",
                fontSize: 10,
              }}
            >
              1
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  miniPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1f2937",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: {
    color: "white",
    fontSize: 12,
  },
});
