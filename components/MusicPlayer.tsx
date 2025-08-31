import { StyleSheet, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

type MusicPlayerProps = {
  videoId: string; // YouTube 영상 ID
};

export default function MusicPlayer({ videoId }: MusicPlayerProps) {
  return (
    <View style={styles.container}>
      <YoutubePlayer
        height={220}
        play={true}
        videoId={videoId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
});
