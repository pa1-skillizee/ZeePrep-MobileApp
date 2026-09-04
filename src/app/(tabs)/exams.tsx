import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { showZeeAlert } from "../../stores/alert-store";
import { getStudentExams, getStudentExamAttempts } from "../../services/firestore";
import type { Exam, ExamAttempt } from "../../types";
import {
  Brain,
  Clock,
  BookOpen,
  ArrowRight,
  FileCheck,
  Lock,
} from "lucide-react-native";
import { AnimatedPressable } from "../../components/AnimatedPressable";

export default function StudentExamsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [exams, setExams] = useState<Exam[]>([]);
  const [attemptsMap, setAttemptsMap] = useState<Record<string, ExamAttempt[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const studentGrade = user?.grade || "12";

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getStudentExams(user);

      // Sort exams: multi-level series first by levelNumber, then by createdAt desc
      data.sort((a, b) => {
        if (a.seriesId && b.seriesId && a.seriesId === b.seriesId) {
          return (a.levelNumber || 1) - (b.levelNumber || 1);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setExams(data);

      if (user?.uid) {
        const attMap: Record<string, ExamAttempt[]> = {};
        for (const ex of data) {
          const list = await getStudentExamAttempts(ex.id, user.uid);
          attMap[ex.id] = list;
        }
        setAttemptsMap(attMap);
      }
    } catch (err) {
      console.error("Error loading exams:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const handleStartExam = (
    exam: Exam,
    isLimitReached: boolean,
    maxAttemptsSetting: number | string,
    isLocked: boolean,
    prerequisiteExamTitle?: string
  ) => {
    if (isLocked) {
      showZeeAlert(
        "Level Locked",
        `You must complete and submit ${prerequisiteExamTitle || "the previous level"} before unlocking this level.`,
        [{ text: "OK" }],
        "warning"
      );
      return;
    }

    if (isLimitReached) {
      showZeeAlert(
        "Attempt Limit Reached",
        `You have used all ${maxAttemptsSetting} attempts allowed for this examination.`,
        [{ text: "OK" }],
        "warning"
      );
      return;
    }
    router.push(`/exam/${exam.id}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktopWeb && styles.desktopContentContainer,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#4F46E5"
        />
      }
    >
      {/* 1. Page Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Examinations</Text>
        <Text style={styles.headerSubtitle}>
          Active curriculum assessments for Class {studentGrade}
        </Text>
      </View>

      {/* 2. Examinations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#4F46E5" size="large" />
          <Text style={styles.loadingText}>Loading assigned examinations...</Text>
        </View>
      ) : exams.length > 0 ? (
        <View style={[styles.examListWrapper, isDesktopWeb && styles.desktopCardGrid]}>
          {exams.map((exam) => {
            const userAttempts = attemptsMap[exam.id] || [];
            const usedCount = userAttempts.length;
            const maxAttemptsSetting = exam.maxAttempts || 1;
            const isUnlimited = maxAttemptsSetting === "unlimited";
            const maxAttemptsNum = isUnlimited ? Infinity : Number(maxAttemptsSetting);
            const isLimitReached = !isUnlimited && usedCount >= maxAttemptsNum;
            const hasAttempted = usedCount > 0;
            const lastAttempt = userAttempts[userAttempts.length - 1];

            // Prerequisite checking
            let isLocked = false;
            let prerequisiteExamTitle: string | undefined;
            if (exam.prerequisiteExamId) {
              const prereqAttempts = attemptsMap[exam.prerequisiteExamId] || [];
              const isPrereqCompleted = prereqAttempts.length > 0;
              if (!isPrereqCompleted) {
                isLocked = true;
                const prereqExam = exams.find((e) => e.id === exam.prerequisiteExamId);
                prerequisiteExamTitle = prereqExam?.title || `Level ${exam.levelNumber ? exam.levelNumber - 1 : 1}`;
              }
            }

            const subjectTag =
              exam.subject ||
              ((exam as any).subjectIds && (exam as any).subjectIds[0]) ||
              "Academic";
            const questionCount =
              (exam as any).questionCount ||
              ((exam as any).questionIds
                ? (exam as any).questionIds.length
                : exam.questions
                ? exam.questions.length
                : 25);
            const durationMins =
              exam.durationMinutes || (exam as any).duration || 60;
            const difficultyLevel =
              exam.levelNumber ? `Level ${exam.levelNumber}` : (exam.level || (exam as any).difficulty || "Standard");

            return (
              <View
                key={exam.id}
                style={[
                  styles.examCard,
                  isLocked && { opacity: 0.85, borderColor: "#E2E8F0" },
                  isDesktopWeb && styles.desktopCardItem,
                ]}
              >
                {/* Top Row: Subject Meta & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeftGroup}>
                    <FileCheck size={18} color="#4F46E5" />
                    <Text style={styles.subjectMetaText}>
                      {String(subjectTag || "Academic").toUpperCase()} • {String(difficultyLevel || "Standard").toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {exam.examType && (
                      <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0" }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#475569", textTransform: "capitalize" }}>
                          {exam.examType.replace(/_/g, " ")}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.statusPill,
                        hasAttempted
                          ? styles.statusPillCompleted
                          : isLocked
                          ? { backgroundColor: "#F1F5F9" }
                          : styles.statusPillActive,
                      ]}
                    >
                      {isLocked && <Lock size={11} color="#64748B" style={{ marginRight: 3 }} />}
                      <Text
                        style={[
                          styles.statusPillText,
                          hasAttempted
                            ? styles.statusPillTextCompleted
                            : isLocked
                            ? { color: "#64748B" }
                            : styles.statusPillTextActive,
                        ]}
                      >
                        {hasAttempted ? "Completed" : isLocked ? "Locked" : "Active"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Title & Description / Code */}
                <View style={styles.cardBody}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text style={styles.examCode} numberOfLines={2}>
                    {isLocked
                      ? `🔒 Requires completion of ${prerequisiteExamTitle}`
                      : exam.description || (exam as any).code || "Assessment Paper"}
                  </Text>
                </View>

                {/* Bottom Row: Qs, Time, Attempt Badge, CTA Button */}
                <View style={styles.cardFooter}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <BookOpen size={14} color="#64748B" />
                      <Text style={styles.metaText}>{questionCount} Qs</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={14} color="#64748B" />
                      <Text style={styles.metaText}>{durationMins} mins</Text>
                    </View>
                  </View>

                  <View style={styles.actionGroup}>
                    {hasAttempted ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <AnimatedPressable
                          style={styles.scorecardBtn}
                          onPress={() =>
                            router.push(`/results/${lastAttempt?.id || exam.id}` as any)
                          }
                          scaleTo={0.94}
                        >
                          <Text style={styles.scorecardBtnText}>Scorecard</Text>
                          <ArrowRight size={13} color="#4F46E5" />
                        </AnimatedPressable>

                        {!isLimitReached && !isLocked && (
                          <AnimatedPressable
                            style={[styles.startBtn, { backgroundColor: "#16A34A" }]}
                            onPress={() =>
                              handleStartExam(exam, isLimitReached, maxAttemptsSetting, isLocked)
                            }
                            scaleTo={0.94}
                          >
                            <Text style={styles.startBtnText}>Retake</Text>
                          </AnimatedPressable>
                        )}
                      </View>
                    ) : isLocked ? (
                      <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: "#F1F5F9" }]}
                        onPress={() =>
                          handleStartExam(exam, isLimitReached, maxAttemptsSetting, isLocked, prerequisiteExamTitle)
                        }
                        activeOpacity={0.7}
                      >
                        <Lock size={12} color="#64748B" />
                        <Text style={[styles.startBtnText, { color: "#64748B" }]}>
                          Level {exam.levelNumber || 2} Locked
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <AnimatedPressable
                        style={styles.startBtn}
                        onPress={() =>
                          handleStartExam(exam, isLimitReached, maxAttemptsSetting, isLocked)
                        }
                        scaleTo={0.95}
                      >
                        <Text style={styles.startBtnText}>Start Exam</Text>
                        <ArrowRight size={13} color="#FFFFFF" />
                      </AnimatedPressable>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyCard}>
          <BookOpen size={40} color="#94A3B8" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No examinations available</Text>
          <Text style={styles.emptySub}>
            Your faculty has not published any examinations for your class at this time.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 44 : 20,
    paddingBottom: 56,
  },
  desktopContentContainer: {
    maxWidth: 1140,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 32,
    paddingTop: 28,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  examListWrapper: {
    gap: 12,
  },
  desktopCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  desktopCardItem: {
    width: "48%",
  },
  examCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subjectMetaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillCompleted: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  statusPillActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusPillTextCompleted: {
    color: "#64748B",
  },
  statusPillTextActive: {
    color: "#16A34A",
  },
  cardBody: {
    gap: 2,
  },
  examTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  examCode: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexWrap: "wrap",
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attemptCompletedNote: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  scorecardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scorecardBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 320,
  },
});
