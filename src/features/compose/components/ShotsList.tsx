// src/features/compose/components/ShotsList.tsx
import React from "react";
import { FlatList, Image, Text, View } from "react-native";
import type { ShotItem } from "../compose.types";

export default function ShotsList({ shots }: { shots: ShotItem[] }) {
  return (
    <FlatList
      data={shots}
      keyExtractor={(_, i) => `shot-${i}`}
      horizontal
      renderItem={({ item, index }) => (
        <View style={{ width: 250, marginRight: 16, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 14, marginBottom: 8 }}>
            Shot {index + 1} - Time: {item.time}s
          </Text>
          {item.imagePath ? (
            <Image
              source={{ uri: item.imagePath }}
              style={{ width: "100%", height: 135, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)" }}
              resizeMode="contain"
              onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 135,
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.1)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12 }}>No Image</Text>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
}
