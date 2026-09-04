import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getTeacherReports } from "../../services/firestore";
import type { Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileBarChart, Search, ChevronRight, GraduationCap, Award, TrendingUp, Users } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherReportsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin" || user?.email === "pa1@skillizee.io";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTeacherReports(user);
      setReports(data);
    } catch (err) {
      console.error("Error loading teacher reports:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (r.studentName || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (r.studentEmail || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (r.examTitle || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (r.grade || "").toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchesClass =
      selectedClassFilter === "all" ||
      String(r.grade || "").includes(selectedClassFilter) ||
      (r.studentName || "").includes(`Class ${selectedClassFilter}`);

    return matchesSearch && matchesClass;
  });

  // Group reports by Class
  const classGroups: { [grade: string]: Report[] } = {};
  filteredReports.forEach((r) => {
    let gr = r.grade ? `Class ${r.grade}` : "Class 11";
    if (r.studentName && r.studentName.includes("Class 11")) {
      gr = "Class 11";
    }
    if (!classGroups[gr]) classGroups[gr] = [];
    classGroups[gr].push(r);
  });

  // Sort reports by submitted date descending
  Object.keys(classGroups).forEach((gr) => {
    classGroups[gr].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  });

  const distinctGrades = Array.from(
    new Set(reports.map((r) => (r.grade ? String(r.grade) : "11")))
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title={isSuperAdmin ? "SuperAdmin Diagnostic Analytics" : "Student Diagnostic Reports"}
        subtitle={
          isSuperAdmin
            ? "Master Institutional View: Class-wise student assessment results"
            : "Class-wise student scorecards & predicted exam levels"
        }
      />

      {/* Class Filter Bar */}
      <View style={styles.classFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.classFilterChip, selectedClassFilter === "all" && styles.classFilterChipActive]}
            onPress={() => setSelectedClassFilter("all")}
          >
            <Text style={[styles.classFilterChipText, selectedClassFilter === "all" && styles.classFilterChipTextActive]}>
              All Classes ({reports.length})
            </Text>
          </TouchableOpacity>
          {["11", "10", "12", "9", "8"].map((c) => {
            const count = reports.filter((r) => String(r.grade || "").includes(c) || (r.studentName || "").includes(`Class ${c}`)).length;
            return (
              <TouchableOpacity
                key={`rep-cls-${c}`}
                style={[styles.classFilterChip, selectedClassFilter === c && styles.classFilterChipActive]}
                onPress={() => setSelectedClassFilter(c)}
              >
                <Text style={[styles.classFilterChipText, selectedClassFilter === c && styles.classFilterChipTextActive]}>
                  Class {c} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.searchBarContainer}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name, exam title, grade..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ZEEPREP_THEME.colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : Object.keys(classGroups).length > 0 ? (
          Object.keys(classGroups).map((className) => {
            const items = classGroups[className];
            const avgScore = Math.round(
              items.reduce((acc, r) => acc + (r.percentage || 0), 0) / (items.length || 1)
            );
            const passCount = items.filter((r) => r.passed).length;

            return (
              <View key={className} style={styles.classSection}>
                {/* Class Header Banner */}
                <View style={styles.classBanner}>
                  <View style={styles.classBannerLeft}>
                    <GraduationCap size={20} color="#4F46E5" />
                    <Text style={styles.classBannerTitle}>{className} Diagnostic Results</Text>
                  </View>
                  <View style={styles.classBannerStats}>
                    <View style={styles.statBadge}>
                      <Users size={12} color="#6366F1" />
                      <Text style={styles.statText}>{items.length} Submissions</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <TrendingUp size={12} color="#059669" />
                      <Text style={styles.statText}>{avgScore}% Avg</Text>
                    </View>
                  </View>
                </View>

                {/* Student Scorecards in this class */}
                {items.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.card}
                    onPress={() => router.push(`/results/${r.id}` as any)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{r.studentName || "Student Attempt"}</Text>
                        <Text style={styles.studentMeta}>
                          {className} • {r.studentEmail || "Student"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.scorePill,
                          { backgroundColor: (r.percentage || 0) >= 50 ? "#ECFDF5" : "#FEF2F2" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreText,
                            { color: (r.percentage || 0) >= 50 ? "#059669" : "#DC2626" },
                          ]}
                        >
                          {r.percentage}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.examTitle}>{r.examTitle || "Assessment Paper"}</Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        Marks: {r.obtainedMarks} / {r.totalMarks}
                      </Text>
                      <Text style={styles.metaText}>
                        Time: {Math.floor((r.timeSpentSeconds || 0) / 60)}m {(r.timeSpentSeconds || 0) % 60}s
                      </Text>
                      <Text style={styles.metaText}>
                        Accuracy: {r.accuracy || 0}%
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Text style={styles.actionText}>View Detailed Faculty Diagnostic & Predictions</Text>
                      <ChevronRight size={16} color="#4F46E5" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <FileBarChart size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Diagnostic Reports Available</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "No reports match your current search query."
                : "Student exam attempts and diagnostic scorecards will appear here."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  classFilterBar: {
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  classFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  classFilterChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  classFilterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  classFilterChipTextActive: {
    color: "#FFFFFF",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  classSection: {
    marginBottom: 24,
  },
  classBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  classBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  classBannerTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  classBannerStats: {
    flexDirection: "row",
    gap: 6,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  scorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "800",
  },
  examTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
