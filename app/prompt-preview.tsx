import { API_URL } from "@/src/config";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function PromptPreview() {
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const input = payload ? JSON.parse(payload) : null;

  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState<string>("");

  useEffect(() => {
    if (!input) return;

    const fetchPrompt = async () => {
      try {
        const resp = await fetch(`${API_URL}/prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await resp.json();
        setOutput(data.prompt ?? "(no output)");
      } catch (err) {
        console.error(err);
        setOutput("❌ Error: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [payload]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#111827", padding: 20 }}>
      <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>
        OpenAI Prompt Test
      </Text>

      {/* Input Payload */}
      <Text style={{ color: "cyan", marginBottom: 6 }}>▶ Input Payload</Text>
      <View
        style={{
          backgroundColor: "#1f2937",
          borderRadius: 8,
          padding: 10,
          marginBottom: 20,
        }}
      >
        {input &&
          JSON.stringify(input, null, 2)
            .split("\n")
            .map((line, idx) => (
              <Text
                key={idx}
                style={{
                  color: "white",
                  fontFamily: "monospace",
                }}
              >
                {line}
              </Text>
            ))}
      </View>

      {/* Output Prompt */}
      <Text style={{ color: "cyan", marginBottom: 6 }}>
        ▶ Output (Generated Prompt)
      </Text>
      {loading ? (
        <ActivityIndicator color="cyan" />
      ) : (
        <Text style={{ color: "white" }}>{output}</Text>
      )}
    </ScrollView>
  );
}
