import { FlatList, StyleSheet, View } from "react-native";
import EmotionCard from "./EmotionCard";

type Emotion = {
  emoji: string;
  label: string;
};

type EmotionGridProps = {
  emotions: Emotion[];
  onSelect: (label: string) => void;
  ListHeaderComponent?: React.ReactElement; // ✅ 추가
};

export default function EmotionGrid({
  emotions,
  onSelect,
  ListHeaderComponent, // ✅ 구조분해에 포함
}: EmotionGridProps) {
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
        ListHeaderComponent={ListHeaderComponent} // ✅ 이제 정상 작동
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { marginTop: 20 },
});
