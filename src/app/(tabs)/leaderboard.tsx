import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { getAggregatedLeaderboard } from "../../services/firestore";
import { useAuthStore } from "../../stores/auth-store";
import type { LeaderboardEntry } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Zap,
  TrendingUp,
  Target,
  CheckCircle2,
  BookOpen,
  Filter,
  GraduationCap,
  School,
  X,
  UserCheck,
  ChevronRight,
  Flame,
  Star,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export default function StudentLeaderboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;
  const currentUser = useAuthStore((state) => state.user);

  // Initialize selected grade to the current student's grade if available, or "10"
  const userGradeVal = currentUser?.grade ? String(currentUser.grade).replace(/[^0-9]/g, "") : "10";
  const [selectedGrade, setSelectedGrade] = useState<string>(userGradeVal || "10");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected student for full profile inspect modal
  const [inspectedStudent, setInspectedStudent] = useState<LeaderboardEntry | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getAggregatedLeaderboard(
        selectedGrade !== "all" ? selectedGrade : undefined
      );
      setLeaderboard(data);
    } catch (err) {
      console.error("Error loading class leaderboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGrade]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  // Find current user's standing in the selected class leaderboard
  const myStanding = useMemo(() => {
    if (!currentUser || !leaderboard.length) return null;
    return (
      leaderboard.find(
        (entry) =>
          entry.studentId === currentUser.uid ||
          (entry.studentEmail &&
            currentUser.email &&
            entry.studentEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (entry.studentName &&
            currentUser.name &&
            entry.studentName.toLowerCase() === currentUser.name.toLowerCase())
      ) || null
    );
  }, [currentUser, leaderboard]);

  // Top 10 Ranked Students
  const top10 = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);
  const top1 = top10[0];
  const top2 = top10[1];
  const top3 = top10[2];

  const renderAvatar = (
    entry: LeaderboardEntry | Partial<LeaderboardEntry>,
    size: number = 44
  ) => {
    const avatar = entry.avatarUrl;
    if (
      avatar &&
      (avatar.startsWith("http://") ||
        avatar.startsWith("https://") ||
        avatar.startsWith("data:image"))
    ) {
      return (
        <Image
          source={{ uri: avatar }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      );
    }
    return (
      <View
        style={[
          styles.avatarFallback,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>
          {((entry.studentName || "S").charAt(0) || "S").toUpperCase()}
        </Text>
      </View>
    );
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" };
    if (rank === 2) return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
    if (rank === 3) return { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" };
    return { bg: "#EEF2FF", text: "#4F46E5", border: "#E0E7FF" };
  };

  const getPerformanceHonor = (entry: LeaderboardEntry) => {
    if (entry.rank === 1) return "🌟 Class Valedictorian";
    if (entry.rank === 2) return "🥈 Class Salutatorian";
    if (entry.rank === 3) return "🥉 High Distinction";
    if (entry.bestPercentage >= 90) return "🚀 Top 5% Elite Performer";
    if (entry.bestPercentage >= 80) return "🎯 Academic Scholar";
    if (entry.bestPercentage >= 65) return "📈 Rising Star";
    return "⚡ Active Contender";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isDesktopWeb && {
          maxWidth: 1000,
          alignSelf: "center",
          width: "100%",
          paddingHorizontal: 32,
          paddingTop: 24,
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
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleIconBox}>
            <Trophy size={24} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Class Leaderboards</Text>
            <Text style={styles.headerSubtitle}>
              Official academic rankings & top 10 diagnostic accuracy standings
            </Text>
          </View>
        </View>
      </View>

      {/* Class / Grade Selector Tabs */}
      <View style={styles.classSelectorContainer}>
        <Text style={styles.sectionLabel}>Select Class Leaderboard:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classScroll}
        >
          {[
            {
              id: userGradeVal || "10",
              label: `My Class (Grade ${userGradeVal || "10"})`,
              isMyClass: true,
            },
            { id: "9", label: "Grade 9" },
            { id: "10", label: "Grade 10" },
            { id: "11", label: "Grade 11" },
            { id: "12", label: "Grade 12" },
            { id: "all", label: "All Classes" },
          ]
            // Deduplicate if user grade matches one of the options
            .filter((item, idx, arr) => arr.findIndex((t) => t.id === item.id) === idx)
            .map((tab) => {
              const isSelected = selectedGrade === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.classPill,
                    isSelected && styles.classPillActive,
                    tab.isMyClass && !isSelected && styles.classPillMyClass,
                  ]}
                  onPress={() => setSelectedGrade(tab.id)}
                  activeOpacity={0.8}
                >
                  {tab.isMyClass && <Star size={13} color={isSelected ? "#FFFFFF" : "#4F46E5"} />}
                  <Text
                    style={[
                      styles.classPillText,
                      isSelected && styles.classPillTextActive,
                      tab.isMyClass && !isSelected && styles.classPillTextMyClass,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      {/* Current Student's Rank Card (ALWAYS VISIBLE) */}
      <View style={styles.myRankCard}>
        <View style={styles.myRankHeaderRow}>
          <View style={styles.myRankBadge}>
            <Text style={styles.myRankBadgeText}>YOUR CLASS STANDING</Text>
          </View>
          <View style={styles.classTag}>
            <Text style={styles.classTagText}>
              {selectedGrade === "all" ? "Global Ranking" : `Grade ${selectedGrade}`}
            </Text>
          </View>
        </View>

        <View style={styles.myRankMainRow}>
          <View style={styles.myRankAvatarHolder}>
            {renderAvatar(
              {
                studentName: currentUser?.name || "Student",
                avatarUrl: currentUser?.avatarUrl || currentUser?.photoURL,
              },
              52
            )}
            <View style={styles.myRankIconOverlay}>
              <Flame size={12} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.myRankInfo}>
            <Text style={styles.myRankName} numberOfLines={1}>
              {currentUser?.name || "Student User"}
            </Text>
            <Text style={styles.myRankInstitution} numberOfLines={1}>
              {currentUser?.schoolName || "ZeePrep Academy"} • Section {currentUser?.section || "A"}
            </Text>
          </View>

          <View style={styles.myRankNumberBox}>
            <Text style={styles.myRankNumberLabel}>YOUR RANK</Text>
            <Text style={styles.myRankNumberVal}>
              {myStanding ? `#${myStanding.rank}` : "Unranked"}
            </Text>
          </View>
        </View>

        <View style={styles.myRankMetricsGrid}>
          <View style={styles.myMetricItem}>
            <Text style={styles.myMetricVal}>
              {myStanding ? `${myStanding.bestPercentage}%` : "0%"}
            </Text>
            <Text style={styles.myMetricLabel}>Best Score</Text>
          </View>

          <View style={styles.myMetricDivider} />

          <View style={styles.myMetricItem}>
            <Text style={styles.myMetricVal}>
              {myStanding ? `${myStanding.accuracy}%` : "0%"}
            </Text>
            <Text style={styles.myMetricLabel}>Accuracy</Text>
          </View>

          <View style={styles.myMetricDivider} />

          <View style={styles.myMetricItem}>
            <Text style={styles.myMetricVal}>
              {myStanding ? myStanding.totalAssessments : 0}
            </Text>
            <Text style={styles.myMetricLabel}>Tests Taken</Text>
          </View>

          <View style={styles.myMetricDivider} />

          <View style={styles.myMetricItem}>
            <Text style={styles.myMetricVal}>
              ⭐ {myStanding ? myStanding.xpPoints : 0}
            </Text>
            <Text style={styles.myMetricLabel}>XP Points</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} size="large" />
          <Text style={styles.loadingText}>
            Calculating Grade {selectedGrade === "all" ? "All" : selectedGrade} Standings...
          </Text>
        </View>
      ) : top10.length > 0 ? (
        <>
          {/* Top 3 Podium (If at least 2 students exist) */}
          {top10.length >= 2 && (
            <View style={styles.podiumContainer}>
              {/* Rank 2 (Silver) */}
              {top2 && (
                <TouchableOpacity
                  style={[styles.podiumCol, styles.podiumCol2]}
                  onPress={() => setInspectedStudent(top2)}
                  activeOpacity={0.85}
                >
                  <View style={styles.podiumAvatarWrap}>
                    {renderAvatar(top2, 54)}
                    <View style={[styles.podiumBadge, styles.badgeSilver]}>
                      <Medal size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top2.studentName}
                  </Text>
                  <Text style={styles.podiumScore}>{top2.bestPercentage}%</Text>
                  <View style={styles.podiumStep2}>
                    <Text style={styles.podiumStepNum}>#2</Text>
                    <Text style={styles.podiumStepSub}>{top2.xpPoints} XP</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Rank 1 (Gold - Tallest) */}
              {top1 && (
                <TouchableOpacity
                  style={[styles.podiumCol, styles.podiumCol1]}
                  onPress={() => setInspectedStudent(top1)}
                  activeOpacity={0.85}
                >
                  <View style={styles.crownWrap}>
                    <Crown size={22} color="#D97706" />
                  </View>
                  <View style={styles.podiumAvatarWrap}>
                    {renderAvatar(top1, 64)}
                    <View style={[styles.podiumBadge, styles.badgeGold]}>
                      <Text style={styles.goldNumber}>1</Text>
                    </View>
                  </View>
                  <Text style={[styles.podiumName, styles.podiumName1]} numberOfLines={1}>
                    {top1.studentName}
                  </Text>
                  <Text style={[styles.podiumScore, styles.podiumScore1]}>
                    {top1.bestPercentage}%
                  </Text>
                  <View style={styles.podiumStep1}>
                    <Text style={styles.podiumStepNum1}>#1</Text>
                    <Text style={styles.podiumStepSub1}>{top1.xpPoints} XP</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Rank 3 (Bronze) */}
              {top3 && (
                <TouchableOpacity
                  style={[styles.podiumCol, styles.podiumCol3]}
                  onPress={() => setInspectedStudent(top3)}
                  activeOpacity={0.85}
                >
                  <View style={styles.podiumAvatarWrap}>
                    {renderAvatar(top3, 50)}
                    <View style={[styles.podiumBadge, styles.badgeBronze]}>
                      <Award size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3.studentName}
                  </Text>
                  <Text style={styles.podiumScore}>{top3.bestPercentage}%</Text>
                  <View style={styles.podiumStep3}>
                    <Text style={styles.podiumStepNum}>#3</Text>
                    <Text style={styles.podiumStepSub}>{top3.xpPoints} XP</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Current Top 10 Student Profiles */}
          <View style={styles.listSection}>
            <View style={styles.listSectionHeader}>
              <Text style={styles.listSectionTitle}>
                Top 10 Ranked Students • {selectedGrade === "all" ? "Global" : `Grade ${selectedGrade}`}
              </Text>
              <Text style={styles.listSectionSub}>Tap any student card to view full profile & scores</Text>
            </View>

            {top10.map((item) => {
              const isCurrentUser =
                currentUser &&
                (item.studentId === currentUser.uid ||
                  (item.studentEmail &&
                    currentUser.email &&
                    item.studentEmail.toLowerCase() === currentUser.email.toLowerCase()));
              const rank = item.rank || 1;
              const badgeStyle = getRankBadgeColor(rank);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.rankCard,
                    isCurrentUser && styles.rankCardMe,
                    rank === 1 && styles.rankCard1,
                    rank === 2 && styles.rankCard2,
                    rank === 3 && styles.rankCard3,
                  ]}
                  onPress={() => setInspectedStudent(item)}
                  activeOpacity={0.75}
                >
                  {/* Rank Number / Icon */}
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor: badgeStyle.bg,
                        borderColor: badgeStyle.border,
                      },
                    ]}
                  >
                    {rank === 1 ? (
                      <Crown size={18} color="#D97706" />
                    ) : rank === 2 ? (
                      <Medal size={18} color="#475569" />
                    ) : rank === 3 ? (
                      <Award size={18} color="#C2410C" />
                    ) : (
                      <Text style={[styles.rankNumber, { color: badgeStyle.text }]}>
                        #{rank}
                      </Text>
                    )}
                  </View>

                  {/* Student Photo */}
                  <View style={styles.avatarHolder}>{renderAvatar(item, 44)}</View>

                  {/* Student Info */}
                  <View style={styles.studentInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {item.studentName}
                      </Text>
                      {isCurrentUser && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.studentSub} numberOfLines={1}>
                      Grade {item.grade || "10"}-{item.section || "A"} • {item.schoolName || "ZeePrep Academy"}
                    </Text>
                  </View>

                  {/* Score & XP Badge */}
                  <View style={styles.scoreContainer}>
                    <View
                      style={[
                        styles.scorePill,
                        item.bestPercentage >= 85
                          ? styles.scorePillHigh
                          : item.bestPercentage >= 65
                          ? styles.scorePillMid
                          : styles.scorePillLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreText,
                          item.bestPercentage >= 85
                            ? styles.scoreTextHigh
                            : item.bestPercentage >= 65
                            ? styles.scoreTextMid
                            : styles.scoreTextLow,
                        ]}
                      >
                        {item.bestPercentage}%
                      </Text>
                    </View>
                    <Text style={styles.xpText}>⭐ {item.xpPoints || 0} XP</Text>
                  </View>

                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Trophy size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            No Rankings for Grade {selectedGrade === "all" ? "All" : selectedGrade} Yet
          </Text>
          <Text style={styles.emptySub}>
            Be the first student in this class to complete a diagnostic assessment and take Rank #1!
          </Text>
          <TouchableOpacity
            style={styles.takeTestBtn}
            onPress={() => router.push("/(tabs)/exams")}
            activeOpacity={0.85}
          >
            <Zap size={16} color="#FFFFFF" />
            <Text style={styles.takeTestBtnText}>Start First Assessment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Student Profile Inspection Modal ("Who they are & What is their score") */}
      <Modal
        visible={Boolean(inspectedStudent)}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {inspectedStudent && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalRankTag}>
                    <Trophy size={14} color="#D97706" />
                    <Text style={styles.modalRankTagText}>
                      Rank #{inspectedStudent.rank} in Grade {inspectedStudent.grade || "10"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setInspectedStudent(null)}
                    style={styles.closeBtn}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Profile Banner */}
                <View style={styles.modalProfileRow}>
                  {renderAvatar(inspectedStudent, 68)}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalStudentName} numberOfLines={1}>
                      {inspectedStudent.studentName}
                    </Text>
                    <Text style={styles.modalHonorText}>
                      {getPerformanceHonor(inspectedStudent)}
                    </Text>
                    <View style={styles.modalMetaRow}>
                      <School size={12} color="#64748B" />
                      <Text style={styles.modalMetaText} numberOfLines={1}>
                        {inspectedStudent.schoolName || "ZeePrep Institutional Academy"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Score & Academic Breakdown Grid */}
                <View style={styles.modalScoresGrid}>
                  <View style={styles.modalScoreItem}>
                    <Text style={styles.modalScoreVal}>{inspectedStudent.bestPercentage}%</Text>
                    <Text style={styles.modalScoreLabel}>Best Accuracy</Text>
                  </View>

                  <View style={styles.modalScoreItem}>
                    <Text style={styles.modalScoreVal}>{inspectedStudent.accuracy}%</Text>
                    <Text style={styles.modalScoreLabel}>Avg Diagnostic</Text>
                  </View>

                  <View style={styles.modalScoreItem}>
                    <Text style={styles.modalScoreVal}>
                      {inspectedStudent.totalAssessments}
                    </Text>
                    <Text style={styles.modalScoreLabel}>Tests Completed</Text>
                  </View>

                  <View style={styles.modalScoreItem}>
                    <Text style={styles.modalScoreVal}>⭐ {inspectedStudent.xpPoints}</Text>
                    <Text style={styles.modalScoreLabel}>XP Earned</Text>
                  </View>
                </View>

                {/* Class Details Card */}
                <View style={styles.modalDetailsCard}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Academic Class:</Text>
                    <Text style={styles.modalDetailVal}>
                      Grade {inspectedStudent.grade || "10"} (Section {inspectedStudent.section || "A"})
                    </Text>
                  </View>

                  {inspectedStudent.latestExamTitle ? (
                    <>
                      <View style={styles.modalDetailDivider} />
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Latest Test:</Text>
                        <Text style={styles.modalDetailVal} numberOfLines={1}>
                          {inspectedStudent.latestExamTitle}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  {inspectedStudent.subject ? (
                    <>
                      <View style={styles.modalDetailDivider} />
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Subject Focus:</Text>
                        <Text style={styles.modalDetailVal}>{inspectedStudent.subject}</Text>
                      </View>
                    </>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setInspectedStudent(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },

  classSelectorContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  classScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  classPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  classPillActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  classPillMyClass: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  classPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  classPillTextActive: {
    color: "#FFFFFF",
  },
  classPillTextMyClass: {
    color: "#4F46E5",
  },

  /* Current Student's Rank Banner */
  myRankCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#3730A3",
  },
  myRankHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  myRankBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  myRankBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#A5B4FC",
    letterSpacing: 0.8,
  },
  classTag: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  myRankMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  myRankAvatarHolder: {
    position: "relative",
  },
  myRankIconOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#EA580C",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1E1B4B",
  },
  myRankInfo: {
    flex: 1,
  },
  myRankName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  myRankInstitution: {
    fontSize: 12,
    color: "#C7D2FE",
    marginTop: 2,
  },
  myRankNumberBox: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  myRankNumberLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#A5B4FC",
    letterSpacing: 0.5,
  },
  myRankNumberVal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FDE047",
    marginTop: 1,
  },
  myRankMetricsGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  myMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  myMetricVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  myMetricLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#A5B4FC",
    marginTop: 2,
  },
  myMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  /* Podium */
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  podiumCol: {
    flex: 1,
    alignItems: "center",
  },
  podiumCol1: {
    zIndex: 3,
  },
  podiumCol2: {
    zIndex: 2,
  },
  podiumCol3: {
    zIndex: 1,
  },
  crownWrap: {
    marginBottom: -4,
  },
  podiumAvatarWrap: {
    position: "relative",
    marginBottom: 6,
  },
  podiumBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeGold: {
    backgroundColor: "#F59E0B",
  },
  goldNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  badgeSilver: {
    backgroundColor: "#64748B",
  },
  badgeBronze: {
    backgroundColor: "#C2410C",
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    maxWidth: 90,
  },
  podiumName1: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  podiumScore: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 1,
  },
  podiumScore1: {
    color: "#D97706",
    fontSize: 14,
  },
  podiumStep1: {
    width: "100%",
    backgroundColor: "#FEF3C7",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#FDE68A",
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  podiumStepNum1: {
    fontSize: 22,
    fontWeight: "900",
    color: "#D97706",
  },
  podiumStepSub1: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
    marginTop: 2,
  },
  podiumStep2: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#CBD5E1",
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  podiumStep3: {
    width: "100%",
    backgroundColor: "#FFEDD5",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#FED7AA",
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  podiumStepNum: {
    fontSize: 18,
    fontWeight: "900",
    color: "#475569",
  },
  podiumStepSub: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 1,
  },

  /* Top 10 List Section */
  listSection: {
    marginTop: 6,
    gap: 10,
  },
  listSectionHeader: {
    marginBottom: 4,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  listSectionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 10,
  },
  rankCardMe: {
    borderColor: "#818CF8",
    backgroundColor: "#F5F3FF",
  },
  rankCard1: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFDF7",
  },
  rankCard2: {
    borderColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
  },
  rankCard3: {
    borderColor: "#FED7AA",
    backgroundColor: "#FFFBF7",
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: "800",
  },
  avatarHolder: {
    position: "relative",
  },
  avatarFallback: {
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  youBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scorePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scorePillHigh: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  scorePillMid: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  scorePillLow: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "800",
  },
  scoreTextHigh: {
    color: "#059669",
  },
  scoreTextMid: {
    color: "#4F46E5",
  },
  scoreTextLow: {
    color: "#DC2626",
  },
  xpText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 2,
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  takeTestBtn: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  takeTestBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalRankTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  modalRankTagText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
  },
  closeBtn: {
    padding: 4,
  },
  modalProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 6,
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalHonorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 2,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  modalMetaText: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
  },

  modalScoresGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalScoreItem: {
    alignItems: "center",
    flex: 1,
  },
  modalScoreVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalScoreLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
  },

  modalDetailsCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    gap: 8,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4338CA",
  },
  modalDetailVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  modalDetailDivider: {
    height: 1,
    backgroundColor: "#C7D2FE",
  },

  modalDoneBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
