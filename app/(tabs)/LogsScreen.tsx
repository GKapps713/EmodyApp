// app/(tabs)/LogsScreen.tsx
import React from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLogs } from "../../src/context/LogsContext"; // LogsContext에서 제공하는 훅을 가져옵니다

const LogsScreen = () => {
  const { logs, clearLogs } = useLogs();  // LogsContext에서 관리되는 logs 상태를 가져옵니다

  return (
    <View style={styles.container}>
      {/* 로그 클리어 버튼 추가 */}
      <Button title="Clear Logs" onPress={clearLogs} />

      {/* 스크롤 가능한 로그 출력 */}
      <ScrollView style={styles.logContainer}>
        {logs.length === 0 ? (
          <Text style={styles.noLogs}>No logs yet...</Text>  // 로그가 없으면 메시지 출력
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logContainer: {
    marginTop: 20,
    width: "100%",
    height: "70%",
    padding: 10,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
  },
  logText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  noLogs: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
  },
});

export default LogsScreen;
