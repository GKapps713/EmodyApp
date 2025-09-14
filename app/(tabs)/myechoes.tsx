import { StyleSheet, Text, View } from "react-native";

export default function MyEchoesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎶 My Echoes</Text>
      <Text style={styles.subtext}>Your created AI music will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "white", fontSize: 20, fontWeight: "bold" },
  subtext: { color: "#9ca3af", fontSize: 14, marginTop: 8 },
});
