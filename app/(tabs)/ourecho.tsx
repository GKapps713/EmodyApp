import { StyleSheet, Text, View } from "react-native";

export default function OurEchoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🌍 Our Echo</Text>
      <Text style={styles.subtext}>Shared community Echoes will appear here.</Text>
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
