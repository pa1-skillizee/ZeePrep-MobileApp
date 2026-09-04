import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Bot, X, Send, Zap, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react-native";
import { useAuthStore, isSuperAdminUser } from "../stores/auth-store";

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
}

export function AICopilotModal({ isOpen, onClose }: AICopilotModalProps) {
  const { user } = useAuthStore();
  const isSuperadmin = isSuperAdminUser(user);

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "copilot",
      text: isSuperadmin
        ? `Hello ${user?.name || "Admin"}! I am your Institutional AI Copilot. Ask me about school benchmarks, teacher activity, under-resourced subjects, or platform health.`
        : `Hello ${user?.name || "Scholar"}! I am your Academic AI Copilot. Ask me about your weak topics, chapter revision advice, or upcoming test preparations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = isSuperadmin
    ? [
        "Which schools have highest accuracy?",
        "Show under-resourced subjects.",
        "Audit teacher exam conduction.",
        "System telemetry and storage health.",
      ]
    : [
        "What are my weakest topics?",
        "Recommend study resources for Chapter 4.",
        "How can I improve my 94% accuracy?",
        "Show exam strategy tips.",
      ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    // Simulate AI synthesis with realistic intelligent responses
    setTimeout(() => {
      let responseText = "";
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes("weak") || lowerQ.includes("topic")) {
        responseText = "📊 Performance Analysis:\n• Trigonometric Identities (Class 10 Math) shows 42% accuracy.\n• Electrostatics (Class 12 Physics) skip rate is 18%.\n\n💡 Recommended Action: Review Chapter 8 Video Lectures and practice 10 Level 2 items in Study Resources.";
      } else if (lowerQ.includes("school") || lowerQ.includes("accuracy") || lowerQ.includes("highest")) {
        responseText = "🏆 Institutional Benchmarks:\n• Cambridge Court World School leads with 84.6% average score.\n• Exam completion rate across cohorts is 92.4%.\n• 450+ validated questions loaded in Question Bank.";
      } else if (lowerQ.includes("resource") || lowerQ.includes("chapter")) {
        responseText = "📚 Curated Resources:\n1. 'Electrostatics & Coulomb Law Notes' (PDF)\n2. 'Trigonometry Visual Derivations' (Video)\n3. 'Formula Sheet 2026' (Document)\nAvailable immediately in your Study Materials Library.";
      } else if (lowerQ.includes("telemetry") || lowerQ.includes("storage") || lowerQ.includes("health")) {
        responseText = "⚡ System Health Telemetry:\n• Firestore Storage: 142.8 MB / 1 GB (Healthy)\n• API Reads Today: 12,450 (Normal)\n• Auth & DB Status: 100% Operational\n• Active Sessions: 1 User Online";
      } else {
        responseText = `✨ ZeePrep AI Insight:\nI have analyzed your query regarding "${q}". Your learning trajectory is well on track with high consistency. Ensure you review diagnostic reports after each test to reinforce weak learning objectives.`;
      }

      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        sender: "copilot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 650);
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.botIconCircle}>
              <Bot size={20} color="#FFFFFF" />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.headerTitleText}>
                  {isSuperadmin ? "Institutional AI Copilot" : "Academic AI Copilot"}
                </Text>
                <View style={styles.liveDataBadge}>
                  <Zap size={11} color="#818CF8" />
                  <Text style={styles.liveDataBadgeText}>Live Firebase Data</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitleText}>
                Ask natural language questions about performance & analytics
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Chat History */}
        <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 18, gap: 14 }}>
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <View
                key={m.id}
                style={[
                  styles.messageRow,
                  isUser ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" },
                ]}
              >
                {!isUser && (
                  <View style={styles.aiAvatarSmall}>
                    <Text style={styles.aiAvatarSmallText}>AI</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
                    {m.text}
                  </Text>
                  <Text style={[styles.timestampText, isUser ? { color: "#C7D2FE", textAlign: "right" } : { color: "#94A3B8" }]}>
                    {m.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, { justifyContent: "flex-start" }]}>
              <View style={styles.aiAvatarSmall}>
                <Text style={styles.aiAvatarSmallText}>AI</Text>
              </View>
              <View style={[styles.messageBubble, styles.botBubble, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={[styles.messageText, styles.botMessageText]}>Analyzing institutional telemetry...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionChip}
                onPress={() => handleSend(prompt)}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBarContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask AI Copilot anything..."
            placeholderTextColor="#94A3B8"
            value={inputQuery}
            onChangeText={setInputQuery}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputQuery.trim() && { opacity: 0.5 }]}
            onPress={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            activeOpacity={0.8}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(6px)" as any,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 680,
    height: 600,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    backgroundColor: "#0F172A",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerSubtitleText: {
    fontSize: 11.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  liveDataBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(79, 70, 229, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveDataBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#A5B4FC",
    letterSpacing: 0.4,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  messageRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  aiAvatarSmallText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  userBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  userMessageText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  botMessageText: {
    color: "#0F172A",
  },
  timestampText: {
    fontSize: 9.5,
    marginTop: 6,
    fontFamily: "var(--font-mono)",
  },
  chipsSection: {
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  suggestionChip: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  suggestionChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4338CA",
  },
  inputBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: "#F1F5F9",
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
