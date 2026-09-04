import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Bot, Send, BrainCircuit, BookOpen, CheckCircle2, HelpCircle } from "lucide-react-native";
import { generateAITutorResponse } from "../../services/ai";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function StudentAITutorScreen() {
  const user = useAuthStore((state) => state.user);

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: `Hello ${user?.name || "Student"}! I am your ZeePrep AI Study Assistant for Grade ${user?.grade || "12"}. Ask me any question, formula breakdown, or concept explanation in ${user?.stream || "Science"}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = async () => {
    if (!inputQuery.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputQuery.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const queryText = inputQuery.trim();
    setInputQuery("");
    setLoading(true);

    try {
      const responseText = await generateAITutorResponse(
        queryText,
        user?.grade || "12",
        user?.stream || "Science"
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("AI Tutor response error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.botAvatar}>
            <Bot color="#FFFFFF" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ZeePrep AI Study Copilot</Text>
            <Text style={styles.headerSubtitle}>Instant Curriculum Explanations & Problem Solving</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.msgWrapper, msg.sender === "user" ? styles.msgUser : styles.msgAI]}
          >
            {msg.sender === "ai" ? (
              <View style={styles.aiBadgeRow}>
                <BrainCircuit size={13} color={ZEEPREP_THEME.colors.primary} />
                <Text style={styles.aiBadgeText}>AI TUTOR</Text>
              </View>
            ) : null}
            <Text style={[styles.msgText, msg.sender === "user" && styles.msgTextUser]}>{msg.text}</Text>
            <Text style={[styles.msgTime, msg.sender === "user" && styles.msgTimeUser]}>{msg.timestamp}</Text>
          </View>
        ))}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={ZEEPREP_THEME.colors.primary} size="small" />
            <Text style={styles.loadingText}>AI Assistant is thinking...</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask a question or topic explanation..."
          placeholderTextColor="#94A3B8"
          value={inputQuery}
          onChangeText={setInputQuery}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
          <Send color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  chatScroll: {
    padding: 20,
    paddingBottom: 20,
  },
  msgWrapper: {
    maxWidth: "85%",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  msgAI: {
    alignSelf: "flex-start",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  msgUser: {
    alignSelf: "flex-end",
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  aiBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  msgText: {
    fontSize: 14,
    color: ZEEPREP_THEME.colors.textPrimary,
    lineHeight: 20,
  },
  msgTextUser: {
    color: "#FFFFFF",
  },
  msgTime: {
    fontSize: 10,
    color: ZEEPREP_THEME.colors.textMuted,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  msgTimeUser: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  loadingText: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: ZEEPREP_THEME.colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
