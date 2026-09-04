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
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import {
  getStudentHomeDashboardData,
  type StudentHomeDashboardData,
} from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  FileCheck,
  Award,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Target,
  CheckCircle2,
  Trophy,
  Zap,
  FileText,
  Compass,
  ArrowRight,
  Lock,
} from "lucide-react-native";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import SuperAdminRoleSwitcher from "../../components/SuperAdminRoleSwitcher";

export default function StudentHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [dashboardData, setDashboardData] = useState<StudentHomeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getStudentHomeDashboardData(user);
      setDashboardData(data);
    } catch (err) {
      console.error("Error loading student home dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (dashboardData && dashboardData.totalCompletedReports > 0) {
      if (hour < 12) return "Good morning";
      if (hour < 17) return "Good afternoon";
      return "Welcome back";
    }
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Welcome";
  };

  const currentAvatar = user?.avatarUrl || user?.photoURL || (user as any)?.avatar;
  const hasCustomPhoto = Boolean(
    currentAvatar &&
      typeof currentAvatar === "string" &&
      currentAvatar.trim().length > 5 &&
      currentAvatar !== "null" &&
      currentAvatar !== "undefined"
  );

  const handleOpenResource = (url?: string) => {
    if (!url) {
      router.push("/(tabs)/resources");
      return;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      if (Platform.OS === "web") {
        window.open(url, "_blank");
      } else {
        Linking.openURL(url).catch(() => router.push("/(tabs)/resources"));
      }
    } else {
      router.push("/(tabs)/resources");
    }
  };

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

      {/* 1. STUDENT IDENTITY & GREETING */}
      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <TouchableOpacity
            style={styles.avatarHolder}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            {hasCustomPhoto ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(user?.name || "S").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.identityTextCol}>
            <Text style={styles.greetingSub}>
              {getGreeting()},{" "}
              <Text style={styles.greetingName}>{user?.name || "Student"}</Text>
            </Text>
            <Text style={styles.academicMeta}>
              Grade {user?.grade || "10"} • {user?.board || "CBSE"} •{" "}
              {user?.schoolName || "ZeePrep Institutional Academy"}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your academic preparation...</Text>
        </View>
      ) : (
        <>
          {/* 2. PERSONALIZED ACADEMIC SUMMARY */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summarySectionTitle}>YOUR PREPARATION OVERVIEW</Text>
              {dashboardData?.totalCompletedReports ? (
                <View style={styles.completedBadge}>
                  <CheckCircle2 size={12} color="#16A34A" />
                  <Text style={styles.completedBadgeText}>
                    {dashboardData.totalCompletedReports}{" "}
                    {dashboardData.totalCompletedReports === 1
                      ? "Assessment"
                      : "Assessments"}{" "}
                    Completed
                  </Text>
                </View>
              ) : null}
            </View>

            {dashboardData && dashboardData.totalCompletedReports > 0 ? (
              <View style={styles.metricsGrid}>
                {/* Overall Diagnostic Performance */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Overall Performance</Text>
                  <View style={styles.metricValRow}>
                    <Text style={styles.metricVal}>
                      {dashboardData.overallPerformance}%
                    </Text>
                    <View
                      style={[
                        styles.trendChip,
                        dashboardData.recentTrend === "improving"
                          ? styles.trendChipUp
                          : dashboardData.recentTrend === "declining"
                          ? styles.trendChipDown
                          : styles.trendChipStable,
                      ]}
                    >
                      {dashboardData.recentTrend === "improving" ? (
                        <TrendingUp size={12} color="#16A34A" />
                      ) : dashboardData.recentTrend === "declining" ? (
                        <TrendingDown size={12} color="#DC2626" />
                      ) : (
                        <Minus size={12} color="#4F46E5" />
                      )}
                      <Text
                        style={[
                          styles.trendChipText,
                          dashboardData.recentTrend === "improving"
                            ? styles.trendTextUp
                            : dashboardData.recentTrend === "declining"
                            ? styles.trendTextDown
                            : styles.trendTextStable,
                        ]}
                      >
                        {dashboardData.recentTrend === "improving"
                          ? "Improving"
                          : dashboardData.recentTrend === "declining"
                          ? "Needs Focus"
                          : "Stable"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Latest Assessment Score */}
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Latest Assessment</Text>
                  {dashboardData.latestAssessment ? (
                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/results/${dashboardData.latestAssessment?.id}`)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.metricValRow}>
                        <Text style={styles.metricVal}>
                          {dashboardData.latestAssessment.percentage}%
                        </Text>
                        <Text style={styles.latestSubjectText} numberOfLines={1}>
                          {dashboardData.latestAssessment.subject}
                        </Text>
                      </View>
                      <Text style={styles.latestExamTitle} numberOfLines={1}>
                        {dashboardData.latestAssessment.title}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.emptyMetricText}>Pending Attempt</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.emptyOverviewBox}>
                <Compass size={24} color="#4F46E5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyOverviewTitle}>
                    Ready to begin your preparation?
                  </Text>
                  <Text style={styles.emptyOverviewSub}>
                    Complete your first assessment to unlock diagnostic scores, weak topic discovery, and personalized study plans.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 2.5 ACTIVE MULTI-LEVEL ASSESSMENT SERIES */}
          {dashboardData?.multiLevelExamSeries && dashboardData.multiLevelExamSeries.length > 0 && (
            <View style={styles.multiLevelCard}>
              <View style={styles.multiLevelHeader}>
                <View style={styles.multiLevelHeaderLeft}>
                  <View style={styles.seriesIconBadge}>
                    <FileCheck size={18} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.seriesBadgeText}>3-LEVEL PROGRESSIVE ASSESSMENT</Text>
                    <Text style={styles.seriesTitleText}>
                      {dashboardData.multiLevelExamSeries[0].title}
                    </Text>
                  </View>
                </View>
                <View style={styles.seriesLevelPill}>
                  <Text style={styles.seriesLevelPillText}>
                    {dashboardData.multiLevelExamSeries[0].levels.filter((l) => l.isCompleted).length === 3
                      ? "All 3 Completed"
                      : `Level ${dashboardData.multiLevelExamSeries[0].unlockedLevel} of 3 Active`}
                  </Text>
                </View>
              </View>

              <View style={styles.levelsList}>
                {dashboardData.multiLevelExamSeries[0].levels.map((lvl) => (
                  <View
                    key={lvl.examId}
                    style={[
                      styles.levelItemRow,
                      lvl.isCompleted && styles.levelItemRowCompleted,
                      lvl.isLocked && styles.levelItemRowLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.levelNumBadge,
                        lvl.isCompleted && styles.levelNumBadgeCompleted,
                        lvl.isLocked && styles.levelNumBadgeLocked,
                      ]}
                    >
                      {lvl.isCompleted ? (
                        <CheckCircle2 size={16} color="#16A34A" />
                      ) : lvl.isLocked ? (
                        <Lock size={14} color="#94A3B8" />
                      ) : (
                        <Text style={styles.levelNumText}>L{lvl.levelNumber}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.levelRowTitle} numberOfLines={1}>
                        Level {lvl.levelNumber}: {lvl.levelTitle.split("—")[1]?.trim() || lvl.levelTitle}
                      </Text>
                      <Text style={styles.levelRowMeta}>
                        {lvl.questionCount} Questions • {lvl.durationMinutes} Mins (1 Hr)
                        {lvl.isLocked && ` • Requires Level ${lvl.levelNumber - 1}`}
                      </Text>
                    </View>

                    {lvl.isCompleted ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <AnimatedPressable
                          style={styles.levelReportBtn}
                          onPress={() =>
                            router.push(`/results/${lvl.lastReportId || lvl.examId}` as any)
                          }
                          scaleTo={0.94}
                        >
                          <Text style={styles.levelReportBtnText}>
                            {lvl.lastScorePercentage !== undefined
                              ? `${lvl.lastScorePercentage}% Score`
                              : "Report"}
                          </Text>
                          <ArrowRight size={12} color="#16A34A" />
                        </AnimatedPressable>

                        <AnimatedPressable
                          style={[styles.levelStartBtn, { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#4F46E5" }]}
                          onPress={() => router.push(`/exam/${lvl.examId}` as any)}
                          scaleTo={0.94}
                        >
                          <Text style={[styles.levelStartBtnText, { fontSize: 11 }]}>Retake</Text>
                        </AnimatedPressable>
                      </View>
                    ) : lvl.isLocked ? (
                      <View style={styles.levelLockedBadge}>
                        <Lock size={12} color="#94A3B8" />
                        <Text style={styles.levelLockedBadgeText}>Locked</Text>
                      </View>
                    ) : (
                      <AnimatedPressable
                        style={styles.levelStartBtn}
                        onPress={() => router.push(`/exam/${lvl.examId}` as any)}
                        scaleTo={0.95}
                      >
                        <Text style={styles.levelStartBtnText}>Start Level {lvl.levelNumber}</Text>
                        <ArrowRight size={12} color="#FFFFFF" />
                      </AnimatedPressable>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

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
              {/* 3. FOCUS AREAS & WEAK TOPICS */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionEyebrow}>PRIORITY REMEDIATION</Text>
                    <Text style={styles.sectionTitle}>Focus Areas & Weak Topics</Text>
                  </View>
                  <Text style={styles.sectionHeaderStatusBadge}>
                    Needs Review
                  </Text>
                </View>

                {dashboardData && dashboardData.weakTopics.length > 0 ? (
                  <View style={styles.weakTopicsList}>
                    {dashboardData.weakTopics.map((item, idx) => {
                      const isSameName =
                        item.topic.trim().toLowerCase() ===
                        item.subject.trim().toLowerCase();
                      const displayTitle = isSameName
                        ? `${item.subject} • Core Concepts`
                        : item.topic;

                      return (
                        <View key={idx} style={styles.weakTopicCard}>
                          <View style={styles.weakTopicTopRow}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={styles.weakTopicSubject}>
                                {item.subject}
                              </Text>
                              <Text style={styles.weakTopicTitle}>
                                {displayTitle}
                              </Text>
                            </View>
                            <View style={styles.accuracyTag}>
                              <Text style={styles.accuracyTagText}>
                                {item.accuracy}% Accuracy
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.weakTopicSuggestion}>
                            {item.suggestionText}
                          </Text>

                          {item.recommendedResource ? (
                            <TouchableOpacity
                              style={styles.weakTopicActionBtn}
                              onPress={() =>
                                handleOpenResource(item.recommendedResource?.url)
                              }
                              activeOpacity={0.8}
                            >
                              <BookOpen size={14} color="#4F46E5" />
                              <Text
                                style={styles.weakTopicActionBtnText}
                                numberOfLines={1}
                              >
                                Study: {item.recommendedResource.title}
                              </Text>
                              <ArrowUpRight size={14} color="#4F46E5" />
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.weakTopicPracticeNote}>
                              <Text style={styles.weakTopicPracticeText}>
                                Recommended: Review textbook chapters before next assessment.
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyTopicBox}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <Text style={styles.emptyTopicTitle}>
                      {dashboardData && dashboardData.totalCompletedReports > 0
                        ? "Strong performance across evaluated topics."
                        : "No weak topics identified yet."}
                    </Text>
                    <Text style={styles.emptyTopicSub}>
                      {dashboardData && dashboardData.totalCompletedReports > 0
                        ? "You are maintaining solid diagnostic scores across recent assessments."
                        : "Topics requiring revision will automatically be highlighted here once you take tests."}
                    </Text>
                  </View>
                )}
              </View>

              {/* 4. RECOMMENDED STUDY MATERIALS */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionEyebrow}>CURATED LEARNING</Text>
                    <Text style={styles.sectionTitle}>
                      Recommended Study Materials
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/resources")}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {dashboardData && dashboardData.recommendedResources.length > 0 ? (
                  <View style={styles.resourcesList}>
                    {dashboardData.recommendedResources.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.resourceCard}
                        onPress={() => handleOpenResource(item.resource.url)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.resourceIconBox}>
                          <FileText size={18} color="#4F46E5" />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.resourceTitle} numberOfLines={1}>
                            {item.resource.title}
                          </Text>
                          <Text style={styles.resourceReason} numberOfLines={1}>
                            {item.reason}
                          </Text>
                          <Text style={styles.resourceMeta}>
                            {item.resource.subject || "Academic"} • Grade{" "}
                            {item.resource.grade || user?.grade || "10"} •{" "}
                            {String(item.resource.type || "PDF").toUpperCase()}
                          </Text>
                        </View>
                        <ArrowUpRight size={16} color="#64748B" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noResourceBox}>
                    <Text style={styles.noResourceTitle}>
                      No specific materials assigned yet.
                    </Text>
                    <Text style={styles.noResourceSub}>
                      Review core textbook syllabus for Grade {user?.grade || "10"} in your ZeePrep Library.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* RIGHT / SECONDARY COLUMN */}
            <View style={isDesktopWeb ? styles.desktopRightCol : styles.stackedColItem}>
              {/* 5. RECENT ASSESSMENTS */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionEyebrow}>PERFORMANCE HISTORY</Text>
                    <Text style={styles.sectionTitle}>Recent Assessments</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/exams")}>
                    <Text style={styles.viewAllText}>Exams</Text>
                  </TouchableOpacity>
                </View>

                {dashboardData && dashboardData.recentAssessments.length > 0 ? (
                  <View style={styles.recentList}>
                    {dashboardData.recentAssessments.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.recentItemRow}
                        onPress={() => router.push(`/results/${item.id}`)}
                        activeOpacity={0.75}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.recentItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.recentItemMeta}>{item.subject}</Text>
                        </View>

                        <View style={styles.recentScoreCol}>
                          <Text style={styles.recentScoreText}>
                            {item.percentage}%
                          </Text>
                          <Text
                            style={[
                              styles.recentTrendArrow,
                              item.trend === "up"
                                ? styles.trendTextUp
                                : item.trend === "down"
                                ? styles.trendTextDown
                                : styles.trendTextStable,
                            ]}
                          >
                            {item.trend === "up"
                              ? "↑"
                              : item.trend === "down"
                              ? "↓"
                              : "→"}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#64748B" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyRecentBox}>
                    <Text style={styles.emptyRecentText}>
                      No assessments attempted yet.
                    </Text>
                  </View>
                )}
              </View>

              {/* 6. YOUR PROGRESS TREND */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionEyebrow}>DIAGNOSTIC TRAJECTORY</Text>
                    <Text style={styles.sectionTitle}>Your Progress Trend</Text>
                  </View>
                </View>

                {dashboardData?.preparationTrend.isAvailable ? (
                  <View style={styles.trendBox}>
                    <View style={styles.trendScoresRow}>
                      {dashboardData.preparationTrend.scores.map((score, idx) => (
                        <React.Fragment key={idx}>
                          <View style={styles.trendScoreItem}>
                            <Text style={styles.trendScoreNumber}>{score}%</Text>
                          </View>
                          {idx <
                            dashboardData.preparationTrend.scores.length - 1 && (
                            <Text style={styles.trendConnector}>→</Text>
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                    <Text style={styles.trendSummaryText}>
                      {dashboardData.preparationTrend.summaryText}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.trendEmptyText}>
                    {dashboardData?.preparationTrend.summaryText ||
                      "Complete multiple assessments to generate your diagnostic progress curve."}
                  </Text>
                )}
              </View>

              {/* 7. BOARD PREPARATION FORECAST */}
              {dashboardData?.boardForecast && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionEyebrow}>AI PREDICTIVE INSIGHT</Text>
                      <Text style={styles.sectionTitle}>
                        Board Preparation Forecast
                      </Text>
                    </View>
                    <Text style={styles.forecastConfidenceLabel}>
                      {dashboardData.boardForecast.confidence} Confidence
                    </Text>
                  </View>

                  <View style={styles.forecastContentBox}>
                    <Text style={styles.forecastSubject}>
                      {dashboardData.boardForecast.subject}
                    </Text>
                    <View style={styles.forecastScoresRow}>
                      <Text style={styles.forecastScore}>
                        Predicted: {dashboardData.boardForecast.predictedPercentage}%
                      </Text>
                      <Text style={styles.forecastRange}>
                        Range: {dashboardData.boardForecast.rangeMin}%–{dashboardData.boardForecast.rangeMax}%
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 8. RECOMMENDED NEXT STEP */}
              {dashboardData?.nextStep && (
                <View style={styles.nextActionCard}>
                  <View style={styles.nextActionHeader}>
                    <Text style={styles.nextActionLabel}>
                      RECOMMENDED NEXT STEP
                    </Text>
                  </View>
                  <Text style={styles.nextActionTitle}>
                    {dashboardData.nextStep.title}
                  </Text>
                  <Text style={styles.nextActionDesc}>
                    {dashboardData.nextStep.description}
                  </Text>

                  <TouchableOpacity
                    style={styles.nextActionBtn}
                    onPress={() => {
                      if (dashboardData.nextStep.actionType === "resource") {
                        handleOpenResource(dashboardData.nextStep.targetUrl);
                      } else {
                        router.push("/(tabs)/exams");
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nextActionBtnText}>
                      {dashboardData.nextStep.actionLabel}
                    </Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* 9. BOTTOM NAVIGATION & QUICK SHORTCUTS */}
          <View style={styles.bottomNavSection}>
            <Text style={styles.bottomNavTitle}>QUICK PORTAL NAVIGATION</Text>
            <View style={styles.bottomNavGrid}>
              <TouchableOpacity
                style={styles.navTile}
                onPress={() => router.push("/(tabs)/exams")}
                activeOpacity={0.8}
              >
                <FileCheck size={18} color="#4F46E5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navTileTitle}>Active Examinations</Text>
                  <Text style={styles.navTileSub}>
                    {dashboardData?.activeExamsCount || 0} Available for Class{" "}
                    {user?.grade || "10"}
                  </Text>
                </View>
                <ChevronRight size={14} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navTile}
                onPress={() => router.push("/(tabs)/resources")}
                activeOpacity={0.8}
              >
                <BookOpen size={18} color="#0F172A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navTileTitle}>Study Library</Text>
                  <Text style={styles.navTileSub}>
                    Curriculum PDFs, Question Banks & Notes
                  </Text>
                </View>
                <ChevronRight size={14} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navTile}
                onPress={() => router.push("/(tabs)/leaderboard")}
                activeOpacity={0.8}
              >
                <Trophy size={18} color="#0F172A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navTileTitle}>Class Leaderboard</Text>
                  <Text style={styles.navTileSub}>
                    Rankings & Performance Distribution
                  </Text>
                </View>
                <ChevronRight size={14} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navTile}
                onPress={() => router.push("/(tabs)/profile")}
                activeOpacity={0.8}
              >
                <Award size={18} color="#0F172A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.navTileTitle}>Student Profile</Text>
                  <Text style={styles.navTileSub}>
                    Credentials, Institutional ID & Settings
                  </Text>
                </View>
                <ChevronRight size={14} color="#94A3B8" />
              </TouchableOpacity>
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

  /* 1. Identity Header */
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

  /* 2. Academic Summary Card */
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  summarySectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metricVal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  latestSubjectText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
    flex: 1,
  },
  latestExamTitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  emptyMetricText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 4,
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendChipUp: {
    backgroundColor: "#F0FDF4",
  },
  trendChipDown: {
    backgroundColor: "#FEF2F2",
  },
  trendChipStable: {
    backgroundColor: "#EEF2FF",
  },
  trendChipText: {
    fontSize: 10,
    fontWeight: "700",
  },
  trendTextUp: {
    color: "#16A34A",
  },
  trendTextDown: {
    color: "#DC2626",
  },
  trendTextStable: {
    color: "#4F46E5",
  },

  emptyOverviewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyOverviewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyOverviewSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 17,
  },

  /* Responsive Grid on Web / Stacked on Mobile */
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

  /* Section Cards */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 8,
  },
  sectionEyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#6366F1",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  sectionHeaderStatusBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  /* Weak Topics */
  weakTopicsList: {
    gap: 10,
  },
  weakTopicCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  weakTopicTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  weakTopicSubject: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weakTopicTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
  accuracyTag: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  accuracyTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  weakTopicSuggestion: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    marginBottom: 8,
  },
  weakTopicActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  weakTopicActionBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
    flex: 1,
  },
  weakTopicPracticeNote: {
    paddingVertical: 2,
  },
  weakTopicPracticeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyTopicBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  emptyTopicTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  emptyTopicSub: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },

  /* Suggested Study Materials */
  resourcesList: {
    gap: 8,
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  resourceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  resourceReason: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "600",
    marginTop: 1,
  },
  resourceMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  noResourceBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  noResourceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  noResourceSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },

  /* Recent Performance */
  recentList: {
    gap: 4,
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  recentItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  recentItemMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  recentScoreCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentScoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  recentTrendArrow: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyRecentBox: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyRecentText: {
    fontSize: 12,
    color: "#94A3B8",
  },

  /* Trend Section */
  trendBox: {
    gap: 8,
  },
  trendScoresRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  trendScoreItem: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  trendScoreNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  trendConnector: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  trendSummaryText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    lineHeight: 17,
  },
  trendEmptyText: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 18,
  },

  /* Forecast Section */
  forecastConfidenceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },
  forecastContentBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  forecastSubject: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  forecastScoresRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  forecastScore: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  forecastRange: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },

  /* Next Action Card */
  nextActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  nextActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  nextActionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
    letterSpacing: 0.5,
  },
  nextActionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  nextActionDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },
  nextActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nextActionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Bottom Navigation / Quick Options */
  bottomNavSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  bottomNavTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bottomNavGrid: {
    gap: 8,
  },
  navTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  navTileTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  navTileSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },

  /* Multi-Level Assessment Card */
  multiLevelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  multiLevelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  multiLevelHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  seriesIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  seriesBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  seriesTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  seriesLevelPill: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  seriesLevelPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  levelsList: {
    gap: 10,
  },
  levelItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  levelItemRowCompleted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  levelItemRowLocked: {
    backgroundColor: "#F8FAFC",
    borderColor: "#F1F5F9",
    opacity: 0.85,
  },
  levelNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumBadgeCompleted: {
    backgroundColor: "#DCFCE7",
  },
  levelNumBadgeLocked: {
    backgroundColor: "#F1F5F9",
  },
  levelNumText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
  },
  levelRowTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  levelRowMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  levelStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  levelStartBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  levelReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  levelReportBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  levelLockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 4,
  },
  levelLockedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
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
