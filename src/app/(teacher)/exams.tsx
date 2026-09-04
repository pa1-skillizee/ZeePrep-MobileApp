import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { getTeacherExams } from "../../services/firestore";
import type { Exam } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { FileCheck, Plus, Clock, ChevronRight, GraduationCap, BookOpen, Layers } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

export default function TeacherExamsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin" || user?.email === "pa1@skillizee.io";

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  const fetchExams = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTeacherExams(user);
      setExams(data);
    } catch (err) {
      console.error("Error fetching exams:", err);
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

  const filteredExams = exams.filter((exam) => {
    if (selectedClassFilter === "all") return true;
    return String(exam.grade || "").includes(selectedClassFilter);
  });

  // Group Class-wise -> Subject-wise
  const examGroups: { [grade: string]: { [subject: string]: Exam[] } } = {};
  filteredExams.forEach((exam) => {
    const gr = exam.grade ? `Class ${exam.grade}` : "Class 11";
    const sub = exam.subject || "Mathematics";
    if (!examGroups[gr]) examGroups[gr] = {};
    if (!examGroups[gr][sub]) examGroups[gr][sub] = [];
    examGroups[gr][sub].push(exam);
  });

  return (
    <View style={styles.container}>
      <AppHeader
        title={isSuperAdmin ? "Global Examination Hub" : "Created Assessments"}
        subtitle={
          isSuperAdmin
            ? "Class-wise & Subject-wise institutional examination index"
            : "Class-wise & Subject-wise diagnostic examination repository"
        }
        fallbackRoute="/(teacher)"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/(teacher)/exam-builder")}
          >
            <Plus color="#FFFFFF" size={16} />
            <Text style={styles.addBtnText}>New Exam</Text>
          </TouchableOpacity>
        }
      />

      {/* Class Filter Tabs */}
      <View style={styles.classFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.classFilterChip, selectedClassFilter === "all" && styles.classFilterChipActive]}
            onPress={() => setSelectedClassFilter("all")}
          >
            <Text style={[styles.classFilterChipText, selectedClassFilter === "all" && styles.classFilterChipTextActive]}>
              All Classes ({exams.length})
            </Text>
          </TouchableOpacity>
          {["11", "10", "12", "9", "8"].map((c) => {
            const count = exams.filter((e) => String(e.grade || "").includes(c)).length;
            return (
              <TouchableOpacity
                key={`exam-cls-${c}`}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ZEEPREP_THEME.colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : Object.keys(examGroups).length > 0 ? (
          Object.keys(examGroups).map((className) => (
            <View key={className} style={styles.classGroupContainer}>
              <View style={styles.classGroupHeader}>
                <GraduationCap size={20} color="#4F46E5" />
                <Text style={styles.classGroupTitle}>{className}</Text>
                <View style={styles.classTotalBadge}>
                  <Text style={styles.classTotalText}>
                    {Object.values(examGroups[className]).reduce((acc, curr) => acc + curr.length, 0)} Papers
                  </Text>
                </View>
              </View>

              {Object.keys(examGroups[className]).map((subjectName) => (
                <View key={`${className}-${subjectName}`} style={styles.subjectCardSection}>
                  <View style={styles.subjectTitleRow}>
                    <BookOpen size={16} color="#059669" />
                    <Text style={styles.subjectSectionName}>{subjectName.toUpperCase()}</Text>
                    <Text style={styles.paperCountTag}>
                      {examGroups[className][subjectName].length} Exam{examGroups[className][subjectName].length > 1 ? "s" : ""}
                    </Text>
                  </View>

                  {examGroups[className][subjectName].map((exam) => (
                    <TouchableOpacity
                      key={exam.id}
                      style={styles.card}
                      onPress={() => router.push("/(teacher)/submissions")}
                      activeOpacity={0.85}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.subjectChip}>
                          <Text style={styles.subjectChipText}>{exam.examType || "DIAGNOSTIC TEST"}</Text>
                        </View>
                        <View style={styles.durationBadge}>
                          <Clock size={12} color="#64748B" />
                          <Text style={styles.durationText}>{exam.durationMinutes || 60} Mins</Text>
                        </View>
                      </View>

                      <Text style={styles.examTitle}>{exam.title}</Text>
                      <Text style={styles.metaText}>
                        {className} • Sec {exam.section || "A"} • {exam.totalMarks || 100} Marks • Max Attempts:{" "}
                        {exam.maxAttempts === "unlimited" ? "Unlimited" : exam.maxAttempts || 1}
                      </Text>

                      <View style={styles.cardFooterRow}>
                        <Text style={styles.submissionsLink}>View Submissions & Class Report</Text>
                        <ChevronRight size={14} color="#4F46E5" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <FileCheck size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Assessments Created</Text>
            <Text style={styles.emptySubtitle}>Tap "New Exam" to construct your first exam paper.</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  classGroupContainer: {
    marginBottom: 24,
  },
  classGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  classGroupTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  classTotalBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  classTotalText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  subjectCardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subjectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  subjectSectionName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  paperCountTag: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginLeft: "auto",
  },
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectChipText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#4F46E5",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "600",
  },
  examTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: "#64748B",
    marginBottom: 8,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  submissionsLink: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#4F46E5",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
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
  },
});
