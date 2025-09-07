// components/OwnMusicToggle.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";

const KEY = "ownMusicEnabled";

export default function OwnMusicToggle({
  onChange,
}: { onChange?: (v: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(KEY);
      if (v !== null) setEnabled(v === "1");
    })();
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await AsyncStorage.setItem(KEY, next ? "1" : "0");
    onChange?.(next);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
      <Switch value={enabled} onValueChange={toggle} />
      <Text style={{ marginLeft: 8, fontSize: 16, color: "white" }}>AI Music</Text>
    </View>
  );
}

export async function isOwnMusicEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "1";
}
