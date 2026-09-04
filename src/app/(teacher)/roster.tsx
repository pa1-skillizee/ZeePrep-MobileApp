import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { showZeeAlert } from "../../stores/alert-store";
import { getAllUsers, getAllStudentReports } from "../../services/firestore";
import type { User, Report } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  Users,
  Search,
  Award,
  BookOpen,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
} from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function TeacherRosterScreen() {
  const teacher = useAuthStore((state) => state.user);

  const [students, setStudents] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("10");
  const [selectedSection, setSelectedSection] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Remark Modal State
  const [selectedStudentForRemark, setSelectedStudentForRemark] = useState<User | null>(null);
  const [remarkText, setRemarkText] = useState("");
  const [sendingRemark, setSendingRemark] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allStudents, allReports] = await Promise.all([
        getAllUsers("student"),
        getAllStudentReports(),
      ]);
      setStudents(allStudents);
      setReports(allReports);
    } catch (err) {
      console.error("Error loading roster:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSendRemark = () => {
    if (!selectedStudentForRemark || !remarkText.trim()) return;
    setSendingRemark(true);
    setTimeout(() => {
      setSendingRemark(false);
      showZeeAlert(
        "Remark Sent",
        `Academic feedback successfully sent to ${selectedStudentForRemark.name}.`,
        [{ text: "OK" }],
        "success"
      );
      setSelectedStudentForRemark(null);
      setRemarkText("");
    }, 600);
  };

  // Filter students matching grade & section + search
  const filteredStudents = students.filter((s) => {
    const matchGrade = !selectedGrade || s.grade === selectedGrade || !s.grade;
    const matchSection = !selectedSection || s.section === selectedSection || !s.section;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.loginId?.toLowerCase().includes(q);
    return matchGrade && matchSection && matchSearch;
  });

  const getStudentStats = (studentUid: string) => {
    const studentReports = reports.filter((r) => r.studentId === studentUid);
    const attemptedCount = studentReports.length;
    if (attemptedCount === 0) {
      return { attemptedCount: 0, avgScore: 0, status: "Pending Evaluation", color: "#64748B", bg: "#F1F5F9" };
    }
    const totalScore = studentReports.reduce((acc, r) => acc + (r.percentage || 0), 0);
    const avgScore = Math.round(totalScore / attemptedCount);

    let status = "On Track";
    let color = "#059669";
    let bg = "#ECFDF5";

    if (avgScore >= 80) {
      status = "High Performer";
      color = "#4F46E5";
      bg = "#EEF2FF";
    } else if (avgScore < 60) {
      status = "Needs Attention";
      color = "#DC2626";
      bg = "#FEF2F2";
    }

    return { attemptedCount, avgScore, status, color, bg };
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Class Roster & Performance"
        subtitle="Student evaluation, tracking, and teacher remarks"
        fallbackRoute="/(teacher)"
      />

      {/* Grade & Section Selectors */}
      <View style={styles.filterRow}>
        <View style={styles.pickerContainer}>
          <Text style={styles.filterLabel}>Grade:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {["9", "10", "11", "12"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, selectedGrade === g && styles.chipActive]}
                onPress={() => setSelectedGrade(g)}
              >
                <Text style={[styles.chipText, selectedGrade === g && styles.chipTextActive]}>
                  Grade {g}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.filterLabel}>Section:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {["A", "B", "C", "D"].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[styles.chip, selectedSection === sec && styles.chipActive]}
                onPress={() => setSelectedSection(sec)}
              >
                <Text style={[styles.chipText, selectedSection === sec && styles.chipTextActive]}>
                  Sec {sec}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search color={ZEEPREP_THEME.colors.textSecondary} size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name or Login ID..."
          placeholderTextColor={ZEEPREP_THEME.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ZEEPREP_THEME.colors.primary} />}
        >
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Users size={36} color={ZEEPREP_THEME.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptySub}>
                No enrolled students matched Grade {selectedGrade}-{selectedSection}
              </Text>
            </View>
          ) : (
            filteredStudents.map((s) => {
              const stats = getStudentStats(s.uid);
              return (
                <View key={s.uid} style={styles.studentCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarText}>{s.name?.charAt(0) || "S"}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <Text style={styles.studentMeta}>
                        ID: {s.loginId || "ZP-STU-10293"} • {s.grade ? `Grade ${s.grade}-${s.section || "A"}` : "Grade 10-A"}
                      </Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: stats.bg }]}>
                      <Text style={[styles.statusText, { color: stats.color }]}>{stats.status}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardStatsRow}>
                    <View style={styles.statBox}>
                      <BookOpen size={14} color={ZEEPREP_THEME.colors.textSecondary} />
                      <Text style={styles.statVal}>{stats.attemptedCount}</Text>
                      <Text style={styles.statLbl}>Exams Taken</Text>
                    </View>

                    <View style={styles.statBox}>
                      <TrendingUp size={14} color={stats.color} />
                      <Text style={[styles.statVal, { color: stats.color }]}>{stats.avgScore}%</Text>
                      <Text style={styles.statLbl}>Avg Score</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.remarkBtn}
                      onPress={() => setSelectedStudentForRemark(s)}
                    >
                      <MessageSquare size={14} color="#4F46E5" />
                      <Text style={styles.remarkBtnText}>Remark</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Teacher Remark Modal */}
      <Modal visible={!!selectedStudentForRemark} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MessageSquare size={18} color="#4F46E5" />
                <Text style={styles.modalTitle}>Send Teacher Feedback</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStudentForRemark(null)}>
                <X size={20} color={ZEEPREP_THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.studentTargetText}>
              Recipient: {selectedStudentForRemark?.name} ({selectedStudentForRemark?.loginId || "Student"})
            </Text>

            <TextInput
              style={styles.remarkInput}
              placeholder="Type academic feedback or improvement guidance..."
              placeholderTextColor={ZEEPREP_THEME.colors.textSecondary}
              multiline
              numberOfLines={4}
              value={remarkText}
              onChangeText={setRemarkText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedStudentForRemark(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendRemark}
                disabled={sendingRemark || !remarkText.trim()}
              >
                {sendingRemark ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" />
                    <Text style={styles.sendText}>Send Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
    paddingTop: 54,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 14,
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
  filterRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginRight: 8,
    width: 55,
  },
  chipScroll: {
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  chipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#A5B4FC",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: "#4338CA",
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    height: 42,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  studentCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4338CA",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  studentMeta: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  remarkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  remarkBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338CA",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  studentTargetText: {
    fontSize: 12,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
    marginBottom: 12,
  },
  remarkInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    padding: 12,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  sendText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
