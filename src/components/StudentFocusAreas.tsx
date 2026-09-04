import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Target,
  CheckSquare,
  Square,
  BookOpen,
  Zap,
  ArrowRight,
  TrendingDown,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react-native";

export interface FocusTopicItem {
  id: string;
  subject: string;
  topic: string;
  accuracy: number;
  completed: boolean;
  resourceId?: string;
  recommendedResourceTitle: string;
}

interface StudentFocusAreasProps {
  initialTopics?: FocusTopicItem[];
}

export function StudentFocusAreas({ initialTopics }: StudentFocusAreasProps) {
  const router = useRouter();

  const [topics, setTopics] = useState<FocusTopicItem[]>(
    initialTopics || [
      {
        id: "p1",
        subject: "Physics",
        topic: "Speed, Motion & Kinematics",
        accuracy: 12,
        completed: false,
        recommendedResourceTitle: "Motion in 1D & 2D Formula Sheet",
      },
      {
        id: "p2",
        subject: "Physics",
        topic: "Ray Optics & Wave Parameters in Light",
        accuracy: 28,
        completed: false,
        recommendedResourceTitle: "Optics Derivations & Solved Examples",
      },
      {
        id: "c1",
        subject: "Chemistry",
        topic: "Chemical Equilibrium & Le Chatelier Principle",
        accuracy: 35,
        completed: true,
        recommendedResourceTitle: "Equilibrium Constant Quick Notes",
      },
      {
        id: "m1",
        subject: "Mathematics",
        topic: "Definite Integrals & Areas under Curves",
        accuracy: 25,
        completed: false,
        recommendedResourceTitle: "Calculus Standard Integrals Guide",
      },
    ]
  );

  const toggleTopic = (id: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = topics.filter((t) => t.completed).length;
  const totalCount = topics.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Group topics by subject
  const subjects = Array.from(new Set(topics.map((t) => t.subject)));

  return (
    <View style={styles.cardContainer}>
      {/* 1. Component Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Target size={20} color="#7C3AED" />
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.title}>Academic Focus Areas & Weak Topics</Text>
              <View style={styles.aiBadge}>
                <BrainCircuit size={12} color="#7C3AED" />
                <Text style={styles.aiBadgeText}>AI Action Plan</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Identified from your recent examination performance. Complete review checklist below.
            </Text>
          </View>
        </View>

        {/* Progress Pill */}
        <View style={styles.progressCapsule}>
          <Text style={styles.progressText}>
            {completedCount} / {totalCount} Reviewed ({progressPercent}%)
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      {/* 2. Subject-wise Topic Checklist */}
      <View style={styles.subjectsContainer}>
        {subjects.map((subject) => {
          const subjectTopics = topics.filter((t) => t.subject === subject);
          return (
            <View key={subject} style={styles.subjectBlock}>
              <View style={styles.subjectHeader}>
                <View style={styles.subjectDot} />
                <Text style={styles.subjectTitle}>{subject}</Text>
                <Text style={styles.subjectCount}>({subjectTopics.length} areas to improve)</Text>
              </View>

              <View style={styles.topicList}>
                {subjectTopics.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.topicRowCard,
                      item.completed && styles.topicRowCardCompleted,
                    ]}
                  >
                    {/* Left: Checkbox & Topic Name */}
                    <TouchableOpacity
                      style={styles.topicCheckboxRow}
                      onPress={() => toggleTopic(item.id)}
                      activeOpacity={0.7}
                    >
                      {item.completed ? (
                        <CheckCircle2 size={20} color="#059669" />
                      ) : (
                        <Square size={20} color="#94A3B8" />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.topicName,
                            item.completed && styles.topicNameCompleted,
                          ]}
                        >
                          {item.topic}
                        </Text>
                        <Text style={styles.resourceHint}>
                          Recommended Material: {item.recommendedResourceTitle}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Right: Accuracy Badge + Direct Resource Button */}
                    <View style={styles.actionRight}>
                      <View
                        style={[
                          styles.accuracyBadge,
                          item.accuracy < 20
                            ? styles.accuracyBadgeCritical
                            : styles.accuracyBadgeWarning,
                        ]}
                      >
                        <TrendingDown
                          size={12}
                          color={item.accuracy < 20 ? "#DC2626" : "#D97706"}
                        />
                        <Text
                          style={[
                            styles.accuracyText,
                            item.accuracy < 20
                              ? styles.accuracyTextCritical
                              : styles.accuracyTextWarning,
                          ]}
                        >
                          {item.accuracy}% Accuracy
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.resourceBtn}
                        onPress={() => router.push("/(tabs)/resources")}
                        activeOpacity={0.8}
                      >
                        <BookOpen size={13} color="#4F46E5" />
                        <Text style={styles.resourceBtnText}>Study Material</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* 3. Bottom CTA Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerTip}>
          💡 Completing focus topics increases your predicted mock exam score by ~15%.
        </Text>
        <TouchableOpacity
          style={styles.practiceQuizBtn}
          onPress={() => router.push("/(tabs)/exams")}
          activeOpacity={0.85}
        >
          <Zap size={14} color="#FFFFFF" />
          <Text style={styles.practiceQuizBtnText}>Generate Weak Area Practice Quiz</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
  },
  progressCapsule: {
    minWidth: 180,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 6,
    textAlign: "right",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 3,
  },
  subjectsContainer: {
    paddingVertical: 14,
    gap: 16,
  },
  subjectBlock: {
    gap: 8,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  subjectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4F46E5",
  },
  subjectTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  subjectCount: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  topicList: {
    gap: 8,
  },
  topicRowCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  topicRowCardCompleted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    opacity: 0.85,
  },
  topicCheckboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  topicName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 18,
  },
  topicNameCompleted: {
    textDecorationLine: "line-through",
    color: "#64748B",
  },
  resourceHint: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  actionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  accuracyBadgeCritical: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  accuracyBadgeWarning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  accuracyText: {
    fontSize: 11,
    fontWeight: "800",
  },
  accuracyTextCritical: {
    color: "#DC2626",
  },
  accuracyTextWarning: {
    color: "#D97706",
  },
  resourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resourceBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexWrap: "wrap",
    gap: 12,
  },
  footerTip: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "500",
    flex: 1,
    minWidth: 240,
  },
  practiceQuizBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  practiceQuizBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
