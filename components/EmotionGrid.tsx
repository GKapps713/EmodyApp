import { FlatList, StyleSheet, View } from "react-native";
import EmotionCard from "./EmotionCard";

type Emotion = {
  emoji: string;
  label: string;
};

type EmotionGridProps = {
  emotions: Emotion[];
  onSelect: (label: string) => void;
};

export default function EmotionGrid({ emotions, onSelect }: EmotionGridProps) {
  return (
    <View style={styles.grid}>
      <FlatList
        data={emotions}
        keyExtractor={(item) => item.label}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: "space-around" }}
        renderItem={({ item }) => (
          <EmotionCard
            emoji={item.emoji}
            label={item.label}
            onPress={() => onSelect(item.label)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { marginTop: 20 },
});
