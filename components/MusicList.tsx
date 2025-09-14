// MusicList.tsx

import { FlatList } from "react-native";
import MusicCard from "./MusicCard";

type Music = {
  title: string;
  artist: string;
  videoId: string; // ✅ 추가
};

type MusicListProps = {
  musics: Music[];
  onSelect: (music: Music) => void;
};

export default function MusicList({ musics, onSelect }: MusicListProps) {
  return (
    <FlatList
      data={musics}
      keyExtractor={(item) => item.title + item.artist}
      renderItem={({ item }) => (
        <MusicCard
          title={item.title}
          artist={item.artist}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}
