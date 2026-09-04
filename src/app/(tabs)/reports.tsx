import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getStudentReportsList, getGlobalReportStatus } from "../../services/firestore";
import { buildGlobalStudentReport } from "../../services/global-report-engine";
import GlobalReportCard from "../../components/GlobalReportCard";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  FileBarChart,
  Award,
  Clock,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileCheck,
  Lock,
  LineChart,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";

export default function StudentReportsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [globalStatus, setGlobalStatus] = useState<{
    isUnlocked: boolean;
    completedCount: number;
    activeExamsCount: number;
    requiredCompletedCount: number;
    completionPercentage: number;
  }>({
    isUnlocked: false,
    completedCount: 0,
    activeExamsCount: 1,
    requiredCompletedCount: 1,
    completionPercentage: 0,
  });

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    try {
      console.log("[ZeePrep Student Reports] Loading persistent reports for student:", user.uid);
      const [data, status] = await Promise.all([
        getStudentReportsList(user.uid),
        getGlobalReportStatus(user),
      ]);
      setReports(data);
      setGlobalStatus(status);
    } catch (err: any) {
      console.error("[ZeePrep Student Reports] Error loading student reports:", err);
      setFetchError("Unable to load reports. Please check your internet connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [user?.uid])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const avgPercentage =
    reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + (r.percentage || 0), 0) / reports.length)
      : 0;

  const passedCount = reports.filter((r) => r.passed).length;

  const globalReport = useMemo(
    () => (user ? buildGlobalStudentReport(reports, user.uid, user.grade) : null),
    [reports, user?.uid, user?.grade]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktopWeb && { maxWidth: 1280, alignSelf: "center", width: "100%", paddingHorizontal: 32, paddingTop: 24 },
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
      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diagnostic Reports</Text>
        <Text style={styles.headerSubtitle}>
          Detailed scorecards & performance analysis
        </Text>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <FileCheck size={20} color={ZEEPREP_THEME.colors.primary} />
          <Text style={styles.metricNumber}>{reports.length}</Text>
          <Text style={styles.metricLabel}>Total Attempts</Text>
        </View>

        <View style={styles.metricCard}>
          <TrendingUp size={20} color={ZEEPREP_THEME.colors.success} />
          <Text style={styles.metricNumber}>{avgPercentage}%</Text>
          <Text style={styles.metricLabel}>Average Score</Text>
        </View>

        <View style={styles.metricCard}>
          <Award size={20} color={ZEEPREP_THEME.colors.warning} />
          <Text style={styles.metricNumber}>{passedCount}</Text>
          <Text style={styles.metricLabel}>Passed Exams</Text>
        </View>
      </View>

      {/* Global Diagnostic Report Banner (70% Threshold Rule) */}
      <View style={[styles.globalReportBanner, globalStatus.isUnlocked ? styles.globalUnlocked : styles.globalLocked]}>
        <View style={styles.globalHeaderRow}>
          {globalStatus.isUnlocked ? (
            <LineChart size={20} color="#4F46E5" />
          ) : (
            <Lock size={20} color="#D97706" />
          )}
          <Text style={styles.globalTitle}>
            {globalStatus.isUnlocked ? "Global Diagnostic Report Available" : "Global Report Locked"}
          </Text>
        </View>
        <Text style={styles.globalSub}>
          {globalStatus.isUnlocked
            ? `You have completed ${globalStatus.completedCount} of ${globalStatus.activeExamsCount} assigned exams (${globalStatus.completionPercentage}%). Your comprehensive cross-subject report is ready.`
            : `Progress: ${globalStatus.completedCount} of ${globalStatus.activeExamsCount} exams completed (${globalStatus.completionPercentage}%). Complete ${Math.max(1, globalStatus.requiredCompletedCount - globalStatus.completedCount)} more exam(s) to reach 70% and unlock your Global Report.`}
        </Text>
        {/* Progress Bar */}
        <View style={styles.globalProgressTrack}>
          <View
            style={[
              styles.globalProgressFill,
              { width: `${Math.min(100, globalStatus.completionPercentage)}%` },
            ]}
          />
        </View>
      </View>

      {/* Global Preparation Report — composed from per-subject forecasts */}
      <GlobalReportCard report={globalReport} isDesktopWeb={isDesktopWeb} width={width} />

      {/* Reports List */}
      <Text style={styles.sectionTitle}>Examination Reports</Text>

      {fetchError ? (
        <View style={styles.errorCard}>
          <AlertCircle size={28} color="#DC2626" />
          <Text style={styles.errorCardTitle}>Unable to Load Reports</Text>
          <Text style={styles.errorCardSub}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports} activeOpacity={0.8}>
            <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Retry Now</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginVertical: 30 }} />
      ) : reports.length > 0 ? (
        <View style={[styles.reportListWrapper, isDesktopWeb && styles.desktopCardGrid]}>
          {reports.map((report) => {
            const mins = Math.floor((report.timeSpentSeconds || 0) / 60);
            return (
              <TouchableOpacity
                key={report.id}
                style={[styles.reportCard, isDesktopWeb && styles.desktopCardItem]}
                onPress={() => router.push(`/results/${report.id || report.examId}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.passBadge,
                      report.passed ? styles.passBadgePassed : styles.passBadgeFailed,
                    ]}
                  >
                    {report.passed ? (
                      <CheckCircle2 size={14} color="#059669" />
                    ) : (
                      <XCircle size={14} color="#DC2626" />
                    )}
                    <Text
                      style={[
                        styles.passBadgeText,
                        report.passed ? styles.passTextPassed : styles.passTextFailed,
                      ]}
                    >
                      {report.passed ? "PASSED" : "NEEDS REVISION"}
                    </Text>
                  </View>

                  <View style={styles.timeBadge}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.timeBadgeText}>Attempt {report.attemptNumber || 1} • {mins} mins</Text>
                  </View>
                </View>

                <Text style={styles.examTitle}>{report.examTitle || "ZeePrep Assessment"}</Text>

                <View style={styles.scoreRow}>
                  <View>
                    <Text style={styles.scoreNumber}>
                      {report.obtainedMarks} <Text style={styles.totalMarksText}>/ {report.totalMarks}</Text>
                    </Text>
                    <Text style={styles.scoreLabel}>Score Obtained</Text>
                  </View>

                  <View style={styles.percentagePill}>
                    <Text style={styles.percentagePillText}>{report.percentage}%</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailsText}>View Full Scorecard & Analytics</Text>
                  <ChevronRight size={16} color={ZEEPREP_THEME.colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <FileBarChart size={36} color={ZEEPREP_THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Exam Reports Yet</Text>
          <Text style={styles.emptySub}>
            Complete an active exam to generate diagnostic scorecards and topic analytics.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
  },
  reportCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  passBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passBadgePassed: {
    backgroundColor: "#ECFDF5",
  },
  passBadgeFailed: {
    backgroundColor: "#FEF2F2",
  },
  passBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  passTextPassed: {
    color: "#059669",
  },
  passTextFailed: {
    color: "#DC2626",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  totalMarksText: {
    fontSize: 14,
    color: ZEEPREP_THEME.colors.textSecondary,
    fontWeight: "500",
  },
  scoreLabel: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  percentagePill: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentagePillText: {
    fontSize: 15,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.primary,
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  globalReportBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  globalUnlocked: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  globalLocked: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  globalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  globalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  globalSub: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  globalProgressTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  globalProgressFill: {
    height: "100%",
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 3,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginVertical: 12,
  },
  errorCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#991B1B",
    marginTop: 8,
  },
  errorCardSub: {
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  reportListWrapper: {
    gap: 12,
  },
  desktopCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  desktopCardItem: {
    flex: 1,
    minWidth: 340,
    maxWidth: "49%",
    marginBottom: 0,
  },
});
