// import { API_URL } from "@/src/config";
// import { useState } from "react";
// import {
//     ActivityIndicator,
//     FlatList,
//     KeyboardAvoidingView,
//     Platform,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from "react-native";

// type ChatMessage = {
//   role: "user" | "assistant";
//   content: string;
// };

// export default function ChatTab() {
//   const [messages, setMessages] = useState<ChatMessage[]>([
//     {
//       role: "assistant",
//       content:
//         "Hello 👋 I'm Emody, your emotional companion. How are you feeling today?",
//     },
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const newMessage: ChatMessage = { role: "user", content: input };
//     const updatedMessages = [...messages, newMessage];
//     setMessages(updatedMessages);
//     setInput("");
//     setLoading(true);

//     try {
//       const response = await fetch(`${API_URL}/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ messages: updatedMessages }),
//       });

//       const data = await response.json();

//       if (data.error) {
//         throw new Error(data.error);
//       }

//       const replyMessage: ChatMessage = {
//         role: "assistant",
//         content: data.reply,
//       };

//       setMessages([...updatedMessages, replyMessage]);
//     } catch (error) {
//       console.error("Chat error:", error);
//       const errorMessage: ChatMessage = {
//         role: "assistant",
//         content: "Sorry, I had trouble responding. Please try again.",
//       };
//       setMessages([...updatedMessages, errorMessage]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"} // ✅ 키보드 보정
//       keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // ✅ 헤더 높이 보정
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>💬 Emody Chat</Text>
//       </View>

//       {/* Chat list */}
//       <FlatList
//         data={messages}
//         keyExtractor={(_, idx) => idx.toString()}
//         renderItem={({ item }) => (
//           <View
//             style={[
//               styles.messageBubble,
//               item.role === "user"
//                 ? styles.userBubble
//                 : styles.assistantBubble,
//             ]}
//           >
//             <Text style={styles.messageText}>{item.content}</Text>
//           </View>
//         )}
//         contentContainerStyle={styles.chatContent}
//       />

//       {/* Loading spinner */}
//       {loading && (
//         <ActivityIndicator size="small" color="cyan" style={{ marginBottom: 10 }} />
//       )}

//       {/* Input box */}
//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           value={input}
//           onChangeText={setInput}
//           placeholder="Type your message..."
//           placeholderTextColor="#9CA3AF"
//           multiline
//         />
//         <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
//           <Text style={styles.sendText}>Send</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#0F172A" },
//   header: {
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#1E293B",
//     backgroundColor: "#0F172A",
//   },
//   headerTitle: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   chatContent: { padding: 15, flexGrow: 1 },
//   messageBubble: {
//     padding: 10,
//     borderRadius: 12,
//     marginBottom: 10,
//     maxWidth: "80%",
//   },
//   userBubble: {
//     backgroundColor: "#2563EB",
//     alignSelf: "flex-end",
//   },
//   assistantBubble: {
//     backgroundColor: "#1E293B",
//     alignSelf: "flex-start",
//   },
//   messageText: { color: "white", fontSize: 16 },
//   inputRow: {
//     flexDirection: "row",
//     padding: 10,
//     borderTopWidth: 1,
//     borderTopColor: "#1E293B",
//     backgroundColor: "#111827",
//     alignItems: "flex-end",
//   },
//   input: {
//     flex: 1,
//     backgroundColor: "#1E293B",
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     color: "white",
//     maxHeight: 120,
//   },
//   sendButton: {
//     marginLeft: 8,
//     backgroundColor: "cyan",
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   sendText: { color: "#0F172A", fontWeight: "bold" },
// });
