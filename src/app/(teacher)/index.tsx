import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import {
  getTeacherHomeDashboardData,
  type TeacherHomeDashboardData,
  subscribeToTeacherNotifications,
  markNotificationAsRead,
  type TeacherResourceNotification,
} from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  BookOpen,
  FileCheck,
  Users,
  Award,
  HelpCircle,
  PlusCircle,
  FolderKanban,
  FileBarChart,
  FileText,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  School,
  Bell,
  ArrowRight,
  Check,
} from "lucide-react-native";
import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";

export default function TeacherHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [dashboardData, setDashboardData] = useState<TeacherHomeDashboardData | null>(null);
  const [resourceRequests, setResourceRequests] = useState<TeacherResourceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTeacherHomeDashboardData(user);
      setDashboardData(data);
    } catch (err) {
      console.error("Error loading teacher home dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTeacherNotifications(
      (notifs) => {
        const unreadRequests = notifs.filter((n) => !n.read);
        setResourceRequests(unreadRequests);
      },
      user.subject,
      user.grade
    );
    return () => unsub();
  }, [user?.uid, user?.subject, user?.grade]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Welcome back";
  };

  const currentAvatar = user?.avatarUrl || user?.photoURL || (user as any)?.avatar;
  const hasCustomPhoto = Boolean(
    currentAvatar &&
      typeof currentAvatar === "string" &&
      currentAvatar.trim().length > 5 &&
      currentAvatar !== "null" &&
      currentAvatar !== "undefined"
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktopWeb && {
          maxWidth: 1140,
          alignSelf: "center",
          width: "100%",
          paddingHorizontal: 32,
          paddingTop: 28,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ZEEPREP_THEME.colors.primary}
        />
      }
    >
      <SuperAdminRoleSwitcher />

      {/* 1. TEACHER IDENTITY AT THE TOP */}
      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <TouchableOpacity
            style={styles.avatarHolder}
            onPress={() => router.push("/(teacher)/profile")}
            activeOpacity={0.8}
          >
            {hasCustomPhoto ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(user?.name || "T").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.identityTextCol}>
            <Text style={styles.greetingSub}>
              {getGreeting()},{" "}
              <Text style={styles.greetingName}>{user?.name || "Faculty Member"}</Text>
            </Text>
            <Text style={styles.academicMeta}>
              {user?.subject || "General"} Faculty •{" "}
              {user?.schoolName || "ZeePrep Institutional Academy"}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading faculty dashboard...</Text>
        </View>
      ) : (
        <>
          {/* 2. TEACHER OVERVIEW METRICS */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionHeaderTitle}>ACADEMIC OVERVIEW</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewTile}>
                <Text style={styles.overviewNum}>
                  {dashboardData?.overview.activeExamsCount || 0}
                </Text>
                <Text style={styles.overviewLabel}>Active Exams</Text>
              </View>

              <View style={styles.overviewTile}>
                <Text style={styles.overviewNum}>
                  {dashboardData?.overview.submissionsPendingCount || 0}
                </Text>
                <Text style={styles.overviewLabel}>Submissions</Text>
              </View>

              <View style={styles.overviewTile}>
                <Text style={styles.overviewNum}>
                  {dashboardData?.overview.reportsAvailableCount || 0}
                </Text>
                <Text style={styles.overviewLabel}>Reports Generated</Text>
              </View>

              <View style={styles.overviewTile}>
                <Text style={styles.overviewNum}>
                  {dashboardData?.overview.questionsCount || 0}
                </Text>
                <Text style={styles.overviewLabel}>Questions Created</Text>
              </View>
            </View>
          </View>

          {/* DESKTOP 2-COLUMN WRAPPER (On Web) / STACKED (On Mobile) */}
          <View
            style={
              isDesktopWeb
                ? styles.desktopColumnsContainer
                : styles.mobileStackedContainer
            }
          >
            {/* LEFT / PRIMARY COLUMN */}
            <View style={isDesktopWeb ? styles.desktopLeftCol : styles.stackedColItem}>
              {/* 2.5 STUDENT STUDY MATERIAL REQUESTS (Live Notifications) */}
              {resourceRequests.length > 0 && (
                <View style={[styles.sectionCard, { borderColor: "#C7D2FE", borderWidth: 1.5, backgroundColor: "#F8FAFC", marginBottom: 16 }]}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderTitleGroup}>
                      <Bell size={18} color="#4F46E5" />
                      <Text style={[styles.sectionTitle, { color: "#4F46E5" }]}>
                        Student Resource Requests ({resourceRequests.length})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={async () => {
                        for (const req of resourceRequests) {
                          await markNotificationAsRead(req.id).catch(() => {});
                        }
                      }}
                    >
                      <Text style={styles.actionLinkText}>Mark All Done</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 10, marginTop: 10 }}>
                    {resourceRequests.map((req) => (
                      <View
                        key={req.id}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <Text style={{ fontWeight: "700", color: "#1E293B", fontSize: 13 }}>
                                {req.studentName || "Student"}
                              </Text>
                              <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: "700", color: "#4F46E5" }}>
                                  Class {req.grade || "10"}-{req.section || "A"}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 12, color: "#475569", lineHeight: 17 }}>
                              Requested practice & revision materials for <Text style={{ fontWeight: "700", color: "#1E293B" }}>"{req.topic}"</Text> in {req.subject || "Subject"}.
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#4F46E5",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                            }}
                            onPress={async () => {
                              await markNotificationAsRead(req.id).catch(() => {});
                              router.push("/(teacher)/resources" as any);
                            }}
                          >
                            <BookOpen size={13} color="#FFFFFF" />
                            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
                              Upload Material
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#F1F5F9",
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                            }}
                            onPress={async () => {
                              await markNotificationAsRead(req.id).catch(() => {});
                            }}
                          >
                            <Check size={13} color="#64748B" />
                            <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "600" }}>
                              Dismiss
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 3. ACTIVE EXAMS */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderTitleGroup}>
                    <FileCheck size={18} color="#0F172A" />
                    <Text style={styles.sectionTitle}>
                      Active & Published Examinations
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/(teacher)/exam-builder")}>
                    <Text style={styles.actionLinkText}>+ New Exam</Text>
                  </TouchableOpacity>
                </View>

                {dashboardData && dashboardData.activeExams.length > 0 ? (
                  <View style={styles.activeExamsList}>
                    {dashboardData.activeExams.map((exam) => (
                      <View key={exam.id} style={styles.examCard}>
                        <View style={styles.examTopRow}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.examBadgeRow}>
                              <Text style={styles.examGradeBadge}>
                                Grade {exam.grade} • {exam.subject}
                              </Text>
                              <View style={styles.activeStatusChip}>
                                <Text style={styles.activeStatusText}>LIVE</Text>
                              </View>
                            </View>
                            <Text style={styles.examTitle}>{exam.title}</Text>
                          </View>
                        </View>

                        <View style={styles.examMetricsRow}>
                          <Text style={styles.examMetaText}>
                            ⏱ {exam.durationMinutes} Mins • 📝 {exam.totalQuestions} Questions
                          </Text>
                          <Text style={styles.examSubmissionCount}>
                            {exam.submissionsCount} Submissions
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.viewExamBtn}
                          onPress={() => router.push("/(teacher)/reports")}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.viewExamBtnText}>
                            View Submissions & Reports
                          </Text>
                          <ArrowUpRight size={14} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyCardBox}>
                    <FileCheck size={28} color="#94A3B8" />
                    <Text style={styles.emptyCardTitle}>No Active Exams</Text>
                    <Text style={styles.emptyCardSub}>
                      Create an assessment from the question bank to assign it to your class.
                    </Text>
                    <TouchableOpacity
                      style={styles.createExamBtn}
                      onPress={() => router.push("/(teacher)/exam-builder")}
                      activeOpacity={0.85}
                    >
                      <PlusCircle size={15} color="#FFFFFF" />
                      <Text style={styles.createExamBtnText}>Create Assessment</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 4. REPORTS & SUBMISSIONS NEEDING ATTENTION */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderTitleGroup}>
                    <AlertCircle size={18} color="#0F172A" />
                    <Text style={styles.sectionTitle}>
                      Submissions Needing Review
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/(teacher)/reports")}>
                    <Text style={styles.actionLinkText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {dashboardData &&
                dashboardData.submissionsNeedingAttention.length > 0 ? (
                  <View style={styles.submissionsList}>
                    {dashboardData.submissionsNeedingAttention.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.submissionCard}
                        onPress={() => router.push(`/results/${sub.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.subStudentName}>{sub.studentName}</Text>
                          <Text style={styles.subExamTitle} numberOfLines={1}>
                            {sub.examTitle}
                          </Text>
                          <Text style={styles.subMeta}>
                            Grade {sub.grade}-{sub.section || "A"} • {sub.subject}
                          </Text>
                        </View>

                        <View style={styles.subRightCol}>
                          <Text style={styles.subScoreNum}>{sub.percentage}%</Text>
                          <Text
                            style={[
                              styles.subScoreStatus,
                              sub.percentage < 40 && { color: "#DC2626" },
                            ]}
                          >
                            {sub.percentage < 40 ? "Needs Remediation" : "Needs Review"}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyAttentionBox}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <Text style={styles.emptyAttentionTitle}>
                      All submissions reviewed and evaluated.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* RIGHT / SECONDARY COLUMN */}
            <View style={isDesktopWeb ? styles.desktopRightCol : styles.stackedColItem}>
              {/* 5. QUICK ACTIONS FOR TEACHER */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Teacher Workspace</Text>
                <View style={styles.shortcutsGrid}>
                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => router.push("/(teacher)/exam-builder")}
                    activeOpacity={0.8}
                  >
                    <PlusCircle size={16} color="#4F46E5" />
                    <Text style={styles.shortcutBtnText}>Create Assessment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => router.push("/(teacher)/exams")}
                    activeOpacity={0.8}
                  >
                    <FolderKanban size={16} color="#0F172A" />
                    <Text style={styles.shortcutBtnText}>Question Bank</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => router.push("/(teacher)/reports")}
                    activeOpacity={0.8}
                  >
                    <FileBarChart size={16} color="#0F172A" />
                    <Text style={styles.shortcutBtnText}>Gradebook Reports</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => router.push("/(teacher)/resources")}
                    activeOpacity={0.8}
                  >
                    <BookOpen size={16} color="#0F172A" />
                    <Text style={styles.shortcutBtnText}>Upload Materials</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 6. CLASS PERFORMANCE OVERVIEW */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderTitleGroup}>
                    <School size={18} color="#0F172A" />
                    <Text style={styles.sectionTitle}>Cohort Performance</Text>
                  </View>
                </View>
                <View style={styles.classOverviewBox}>
                  <Text style={styles.classStatVal}>
                    {dashboardData?.overview.reportsAvailableCount || 0}
                  </Text>
                  <Text style={styles.classStatLabel}>
                    Total Diagnostic Reports Filed
                  </Text>
                  <Text style={styles.classStatDesc}>
                    Diagnostic data is automatically calibrated using classical test theory and IRT analytics.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
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

  /* 1. Identity Card */
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarHolder: {
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#4F46E5",
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  identityTextCol: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  greetingName: {
    color: "#4F46E5",
  },
  academicMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "500",
  },

  /* 2. Overview Metrics */
  overviewSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  overviewTile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  overviewNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },

  /* Layout */
  desktopColumnsContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  desktopLeftCol: {
    flex: 3,
  },
  desktopRightCol: {
    flex: 2,
  },
  mobileStackedContainer: {
    gap: 0,
  },
  stackedColItem: {
    gap: 0,
  },

  /* Cards */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 8,
  },
  sectionHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },

  /* Active Exams */
  activeExamsList: {
    gap: 10,
  },
  examCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  examTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  examBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  examGradeBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  activeStatusChip: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  activeStatusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#16A34A",
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  examMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  examMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  examSubmissionCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  viewExamBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  viewExamBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },

  /* Empty state */
  emptyCardBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  emptyCardSub: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
  },
  createExamBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  createExamBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Submissions needing attention */
  submissionsList: {
    gap: 8,
  },
  submissionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  subStudentName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  subExamTitle: {
    fontSize: 12,
    color: "#475569",
    marginTop: 1,
  },
  subMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  subRightCol: {
    alignItems: "flex-end",
  },
  subScoreNum: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  subScoreStatus: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  emptyAttentionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
  },
  emptyAttentionTitle: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },

  /* Shortcuts */
  shortcutsGrid: {
    gap: 8,
    marginTop: 4,
  },
  shortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  shortcutBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },

  /* Class overview */
  classOverviewBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
  },
  classStatVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  classStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  classStatDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
    marginTop: 4,
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
});
