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
  Clipboard,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useAuthStore } from "../../stores/auth-store";
import { showZeeAlert } from "../../stores/alert-store";
import { getClassGrades, getAcademicSessions } from "../../services/firestore";
import type { ClassGrade, AcademicSession } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Layers, Calendar, School, Link2, Copy, CheckCircle2 } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function AcademicHierarchyScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Link Generator State
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cList, sList] = await Promise.all([
        getClassGrades(),
        getAcademicSessions(),
      ]);
      setClasses(cList);
      setSessions(sList);
    } catch (err) {
      console.error("Error fetching academic hierarchy:", err);
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

  const handleGenerateLink = () => {
    if (!inviteEmail.trim()) {
      showZeeAlert("Required Email", "Please enter an email address for the invite link.", [{ text: "OK" }], "warning");
      return;
    }
    const token = Math.random().toString(36).substring(2, 12);
    const link = `https://zeeprep01.web.app/invite?token=${token}&email=${encodeURIComponent(inviteEmail.trim())}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    Clipboard.setString(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <View style={[styles.container, isDesktopWeb && { maxWidth: 1280, alignSelf: "center", width: "100%", paddingHorizontal: 32, paddingTop: 24 }]}>
      <AppHeader
        title="Academic Hierarchy & Invites"
        subtitle="Boards, Sessions, Grades, Sections & Faculty Registration Links"
        fallbackRoute="/(superadmin)"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ZEEPREP_THEME.colors.primary}
          />
        }
      >
        {/* Exception Faculty Registration Link Generator */}
        <Text style={styles.sectionTitle}>Faculty Registration Link Generator</Text>
        <View style={styles.inviteCard}>
          <View style={styles.cardHeaderRow}>
            <Link2 size={20} color={ZEEPREP_THEME.colors.primary} />
            <Text style={styles.cardHeaderTitle}>Generate Exception Registration Link</Text>
          </View>
          <Text style={styles.cardHeaderSub}>
            Create direct invitation tokens for external faculty members to register without domain restrictions.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="faculty@externaldomain.com"
              placeholderTextColor="#94A3B8"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateLink}>
              <Link2 size={16} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Generate</Text>
            </TouchableOpacity>
          </View>

          {generatedLink ? (
            <View style={styles.linkBox}>
              <Text style={styles.generatedLinkText} numberOfLines={1}>
                {generatedLink}
              </Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
                {copied ? (
                  <CheckCircle2 size={16} color="#059669" />
                ) : (
                  <Copy size={16} color={ZEEPREP_THEME.colors.primary} />
                )}
                <Text style={[styles.copyBtnText, copied && { color: "#059669" }]}>
                  {copied ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Active Academic Session Card */}
        <Text style={styles.sectionTitle}>Active Academic Session</Text>
        <View style={styles.sessionCard}>
          <Calendar color={ZEEPREP_THEME.colors.primary} size={24} />
          <View style={styles.sessionContent}>
            <Text style={styles.sessionName}>Session 2026 - 2027</Text>
            <Text style={styles.sessionSub}>Primary Active Institutional Session</Text>
          </View>
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        </View>

        {/* Grades & Sections List */}
        <Text style={styles.sectionTitle}>Configured Grades & Sections</Text>

        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 20 }} />
        ) : classes.length > 0 ? (
          classes.map((cls) => (
            <View key={cls.id} style={styles.gradeCard}>
              <View style={styles.gradeHeader}>
                <School color={ZEEPREP_THEME.colors.primary} size={20} />
                <Text style={styles.gradeTitle}>{cls.name || `Grade ${cls.gradeNumber}`}</Text>
                <View style={styles.boardBadge}>
                  <Text style={styles.boardBadgeText}>{cls.board || "CBSE"}</Text>
                </View>
              </View>

              <View style={styles.sectionsRow}>
                <Text style={styles.label}>Sections:</Text>
                {cls.sections?.map((sec) => (
                  <View key={sec} style={styles.secChip}>
                    <Text style={styles.secChipText}>Sec {sec}</Text>
                  </View>
                ))}
              </View>

              {cls.streams && cls.streams.length > 0 ? (
                <View style={styles.sectionsRow}>
                  <Text style={styles.label}>Streams:</Text>
                  {cls.streams.map((str) => (
                    <View key={str} style={styles.streamChip}>
                      <Text style={styles.streamChipText}>{str}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Layers size={36} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>Standard Academic Hierarchy</Text>
            <Text style={styles.emptySub}>
              Grades 6 through 12 configured with Sections A to E and Science/Commerce streams.
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
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  inviteCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  cardHeaderSub: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  generateBtn: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  generateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  generatedLinkText: {
    flex: 1,
    fontSize: 12,
    color: ZEEPREP_THEME.colors.primary,
    fontWeight: "600",
    marginRight: 8,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.primary,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 24,
  },
  sessionContent: {
    flex: 1,
    marginLeft: 14,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  sessionSub: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  gradeCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  gradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  gradeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  boardBadge: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  boardBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.primary,
  },
  sectionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textSecondary,
    marginRight: 4,
  },
  secChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secChipText: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textPrimary,
    fontWeight: "600",
  },
  streamChip: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  streamChipText: {
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
});
