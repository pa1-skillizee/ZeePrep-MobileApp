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
import { getQuestionBank, addQuestionToBank } from "../../services/firestore";
import { suggestQuestionItems, type AIGeneratedQuestionSuggestion } from "../../services/ai";
import type { Question, QuestionLevel } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { safeUpperCase, getOptionText } from "../../utils/safe-helpers";
import {
  HelpCircle,
  Plus,
  Filter,
  CheckCircle2,
  Bookmark,
  X,
  Upload,
  BrainCircuit,
  Cpu,
  PlusCircle,
  History,
} from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";
import { normalizeQuestion } from "../../utils/question-normalizer";
import { QuestionSheetUploadModal } from "../../components/QuestionSheetUploadModal";
import {
  getSubjectsForGrade,
  getExamTypesForGrade,
  ALL_GRADES,
} from "../../constants/academic-subjects";

export default function TeacherQuestionBankScreen() {
  const user = useAuthStore((state) => state.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<QuestionLevel | "all">("all");
  const [activeNavTab, setActiveNavTab] = useState<"bank" | "upload" | "ai" | "single" | "versions">("bank");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Manual Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetUploadVisible, setSheetUploadVisible] = useState(false);
  const [qText, setQText] = useState("");
  const [qLevel, setQLevel] = useState<QuestionLevel>("level1");
  const [qMarks, setQMarks] = useState("1");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Modal State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiExamType, setAiExamType] = useState("class_test");
  const [generating, setGenerating] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestionBank(undefined, undefined, selectedLevel === "all" ? undefined : selectedLevel);
      setQuestions(data);
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedLevel]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const handleSaveQuestion = async () => {
    if (!qText.trim() || !optA.trim() || !optB.trim()) {
      showZeeAlert("Missing Fields", "Please enter the question text and options.", [{ text: "OK" }], "warning");
      return;
    }

    // Requirement 7: Explicit Marks Validation
    const parsedMarks = parseFloat(qMarks.trim());
    if (isNaN(parsedMarks) || parsedMarks <= 0) {
      showZeeAlert("Invalid Marks", "Question marks must be a positive number greater than 0.", [{ text: "OK" }], "warning");
      return;
    }

    setSaving(true);
    try {
      const newQ = await addQuestionToBank(
        {
          text: qText.trim(),
          options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()].filter(Boolean),
          correctAnswer: optA.trim(),
          level: qLevel,
          subject: user?.subject || "Science",
          marks: parsedMarks,
          isTeacherAuthority: true,
        },
        user
      );

      if (newQ) {
        setQuestions((prev) => [newQ, ...prev]);
        setModalVisible(false);
        setQText("");
        setQMarks("1");
        setOptA("");
        setOptB("");
        setOptC("");
        setOptD("");
        showZeeAlert("Saved", `New question (+${parsedMarks} Marks) added to institutional bank.`, [{ text: "OK" }], "success");
      }
    } catch (err) {
      console.error("Error saving question:", err);
      showZeeAlert("Error", "Could not save question to bank.", [{ text: "OK" }], "error");
    } finally {
      setSaving(false);
    }
  };

  // AI Preview & Selection Review Modal State
  const [aiGrade, setAiGrade] = useState(user?.grade || "11");
  const [aiSubject, setAiSubject] = useState(user?.subject || "Mathematics");
  const [aiCount, setAiCount] = useState<string>("10");
  const [aiLevel, setAiLevel] = useState<"level1" | "level2" | "level3">("level2");
  const [aiPreviewItems, setAiPreviewItems] = useState<(AIGeneratedQuestionSuggestion & { selected: boolean })[]>([]);
  const [aiReviewModalVisible, setAiReviewModalVisible] = useState(false);
  const [savingSelected, setSavingSelected] = useState(false);

  const handleAiSuggest = async () => {
    if (!aiTopic.trim()) {
      showZeeAlert("Topic Required", "Please enter a subject topic for AI question generation.", [{ text: "OK" }], "warning");
      return;
    }

    const requestedCount = Math.min(100, Math.max(1, parseInt(aiCount, 10) || 10));

    setGenerating(true);
    try {
      const items = await suggestQuestionItems(
        aiSubject.trim() || user?.subject || "Mathematics",
        aiGrade || user?.grade || "11",
        aiTopic.trim(),
        requestedCount,
        aiLevel
      );
      if (items && items.length > 0) {
        setAiPreviewItems(items.map((item) => ({ ...item, selected: true })));
        setAiModalVisible(false);
        setAiReviewModalVisible(true);
      } else {
        showZeeAlert("Notice", "AI Engine returned no items. Please try again.", [{ text: "OK" }], "info");
      }
    } catch (err) {
      console.error("AI question generation error:", err);
      showZeeAlert("Error", "Failed to generate AI questions.", [{ text: "OK" }], "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSelectedAiQuestions = async () => {
    const selectedItems = aiPreviewItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      showZeeAlert("No Items Selected", "Please select at least one question to save to your bank.", [{ text: "OK" }], "warning");
      return;
    }

    setSavingSelected(true);
    try {
      for (const item of selectedItems) {
        const saved = await addQuestionToBank(
          {
            text: item.text,
            options: item.options || [],
            correctAnswer: String(item.correctAnswer),
            level: item.level || "level1",
            subject: item.subject || user?.subject || "Science",
            marks: item.level === "level2" ? 2 : item.level === "level3" ? 4 : 1,
            isTeacherAuthority: true,
          },
          user
        );
        if (saved) setQuestions((prev) => [saved, ...prev]);
      }
      setAiReviewModalVisible(false);
      setAiPreviewItems([]);
      setAiTopic("");
      showZeeAlert("Saved", `${selectedItems.length} selected AI question(s) added to institutional bank.`, [{ text: "OK" }], "success");
    } catch (err) {
      console.error("Error saving selected questions:", err);
      showZeeAlert("Error", "Failed to save selected questions.", [{ text: "OK" }], "error");
    } finally {
      setSavingSelected(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Question Bank"
        subtitle="Manage Level 1, 2, 3 questions & AI item generator"
      />

      {/* 3 + 2 Grid Navigation Card Container */}
      <View style={styles.gridNavContainer}>
        {/* ROW 1: 3 Equal Columns */}
        <View style={styles.gridRow3}>
          <TouchableOpacity
            style={[styles.gridTabBtn, activeNavTab === "bank" && styles.gridTabActive]}
            onPress={() => setActiveNavTab("bank")}
            activeOpacity={0.85}
          >
            <HelpCircle size={15} color={activeNavTab === "bank" ? "#FFFFFF" : "#334155"} />
            <Text style={[styles.gridTabText, activeNavTab === "bank" && styles.gridTabTextActive]} numberOfLines={1}>
              Question Bank
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridTabBtn, activeNavTab === "upload" && styles.gridTabActive]}
            onPress={() => {
              setActiveNavTab("upload");
              setSheetUploadVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Upload size={15} color={activeNavTab === "upload" ? "#FFFFFF" : "#334155"} />
            <Text style={[styles.gridTabText, activeNavTab === "upload" && styles.gridTabTextActive]} numberOfLines={1}>
              Upload Questions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridTabBtn, activeNavTab === "ai" && styles.gridTabActive]}
            onPress={() => {
              setActiveNavTab("ai");
              setAiModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <BrainCircuit size={16} color={activeNavTab === "ai" ? "#FFFFFF" : "#334155"} />
            <Text style={[styles.gridTabText, activeNavTab === "ai" && styles.gridTabTextActive]} numberOfLines={1}>
              AI Generator
            </Text>
          </TouchableOpacity>
        </View>

        {/* ROW 2: 2 Equal Columns */}
        <View style={styles.gridRow2}>
          <TouchableOpacity
            style={[styles.gridTabBtn, activeNavTab === "single" && styles.gridTabActive]}
            onPress={() => {
              setActiveNavTab("single");
              setModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <PlusCircle size={15} color={activeNavTab === "single" ? "#FFFFFF" : "#334155"} />
            <Text style={[styles.gridTabText, activeNavTab === "single" && styles.gridTabTextActive]} numberOfLines={1}>
              Add Single Question
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridTabBtn, activeNavTab === "versions" && styles.gridTabActive]}
            onPress={() => setActiveNavTab("versions")}
            activeOpacity={0.85}
          >
            <History size={15} color={activeNavTab === "versions" ? "#FFFFFF" : "#334155"} />
            <Text style={[styles.gridTabText, activeNavTab === "versions" && styles.gridTabTextActive]} numberOfLines={1}>
              Versions & Levels
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Level Filters */}
      <View style={styles.filterBar}>
        <View style={styles.levelRow}>
          {(["all", "level1", "level2", "level3"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.levelChip, selectedLevel === l && styles.levelChipActive]}
              onPress={() => setSelectedLevel(l)}
            >
              <Text style={[styles.levelChipText, selectedLevel === l && styles.levelChipTextActive]}>
                {l === "all" ? "ALL" : l.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : questions.length > 0 ? (
          questions.map((rawQ, idx) => {
            const q = normalizeQuestion(rawQ);
            return (
              <View key={q.id || idx} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{safeUpperCase(q.level, "LEVEL 1")}</Text>
                  </View>
                  <Text style={styles.marksText}>+{q.marks || 1} Marks</Text>
                </View>

                <Text style={styles.questionText}>{q.text}</Text>

                {q.options && q.options.length > 0 ? (
                  <View style={styles.optionsBox}>
                    {q.options.map((opt, oIdx) => (
                      <Text key={oIdx} style={styles.optionText}>
                        {String.fromCharCode(65 + oIdx)}. {getOptionText(opt, oIdx)}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <HelpCircle size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Questions Found</Text>
            <Text style={styles.emptySubtitle}>
              No items match the selected level. Add new questions to populate your bank.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Question Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Question to Bank</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Question Text</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter detailed question text..."
                placeholderTextColor="#94A3B8"
                multiline
                value={qText}
                onChangeText={setQText}
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Marks</Text>
                  <TextInput
                    style={styles.input}
                    value={qMarks}
                    onChangeText={setQMarks}
                    keyboardType="numeric"
                    placeholder="e.g. 2"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Option A (Correct)</Text>
                  <TextInput style={styles.input} value={optA} onChangeText={setOptA} placeholder="Option A" placeholderTextColor="#94A3B8" />
                </View>
              </View>

              <Text style={styles.inputLabel}>Option B</Text>
              <TextInput style={styles.input} value={optB} onChangeText={setOptB} placeholder="Option B" placeholderTextColor="#94A3B8" />

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSaveQuestion} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitModalText}>Save Question to Bank</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Copilot Assist Modal (Requirement: Configurable 1-100 AI Questions Generator for Teacher Subject) */}
      <Modal visible={aiModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <BrainCircuit color="#4F46E5" size={20} />
                <Text style={styles.modalTitle}>AI Teacher Copilot Generator</Text>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Class / Grade Selector */}
              <Text style={styles.inputLabel}>Class / Grade</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {ALL_GRADES.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.filterChip,
                        aiGrade === g && styles.filterChipActive,
                        { paddingHorizontal: 12 },
                      ]}
                      onPress={() => {
                        setAiGrade(g);
                        const subs = getSubjectsForGrade(g);
                        if (subs.length > 0 && !subs.includes(aiSubject)) {
                          setAiSubject(subs[0]);
                        }
                      }}
                    >
                      <Text style={[styles.filterText, aiGrade === g && styles.filterTextActive]}>
                        Class {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Subject Selector for Selected Class */}
              <Text style={styles.inputLabel}>Subject for Class {aiGrade}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {getSubjectsForGrade(aiGrade).map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.filterChip,
                        aiSubject.trim().toLowerCase() === sub.trim().toLowerCase() && styles.filterChipActive,
                        { paddingHorizontal: 12 },
                      ]}
                      onPress={() => setAiSubject(sub)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          aiSubject.trim().toLowerCase() === sub.trim().toLowerCase() && styles.filterTextActive,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Requirement: Exam Purpose / Type Selector (Smartly filtered for Class) */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={styles.inputLabel}>Exam Type / Purpose</Text>
                {["8", "10", "12"].includes(aiGrade.replace(/\D/g, "")) && (
                  <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#B45309" }}>
                      Class {aiGrade} Board Options
                    </Text>
                  </View>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {getExamTypesForGrade(aiGrade).map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.filterChip,
                        aiExamType === t.id && styles.filterChipActive,
                        t.category === "board" && { borderColor: "#F59E0B" },
                        t.category === "board" && aiExamType === t.id && { backgroundColor: "#D97706" },
                        { paddingHorizontal: 12 },
                      ]}
                      onPress={() => setAiExamType(t.id)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          aiExamType === t.id && styles.filterTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Topic / Chapter Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Trigonometric Functions / Relations / Thermodynamics"
                placeholderTextColor="#94A3B8"
                value={aiTopic}
                onChangeText={setAiTopic}
              />

              <Text style={styles.inputLabel}>Number of Questions (1 - 100)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter count (1 to 100)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={aiCount}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, "");
                  if (!cleaned) {
                    setAiCount("");
                  } else {
                    const num = parseInt(cleaned, 10);
                    setAiCount(String(Math.min(100, Math.max(1, num))));
                  }
                }}
              />

              {/* Quick Count Selector Pills */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                {["5", "10", "25", "50", "100"].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.filterChip,
                      aiCount === preset && styles.filterChipActive,
                      { paddingVertical: 6, paddingHorizontal: 12 },
                    ]}
                    onPress={() => setAiCount(preset)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        aiCount === preset && styles.filterTextActive,
                        { fontSize: 12 },
                      ]}
                    >
                      {preset} Qs
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Target Difficulty Level</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {(["level1", "level2", "level3"] as const).map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.filterChip,
                      aiLevel === lvl && styles.filterChipActive,
                      { flex: 1, alignItems: "center" },
                    ]}
                    onPress={() => setAiLevel(lvl)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        aiLevel === lvl && styles.filterTextActive,
                        { fontSize: 11, fontWeight: "600" },
                      ]}
                    >
                      {lvl === "level1" ? "Level 1 (Easy)" : lvl === "level2" ? "Level 2 (Med)" : "Level 3 (Hard)"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleAiSuggest} disabled={generating}>
                {generating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalText}>
                    Generate {aiCount || "10"} AI Questions ({aiSubject || "Subject"})
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Generated Question Review & Selection Modal (Requirement 7: Teacher Review Workflow) */}
      <Modal visible={aiReviewModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <BrainCircuit color="#4F46E5" size={20} />
                <Text style={styles.modalTitle}>Review AI Generated Items</Text>
              </View>
              <TouchableOpacity onPress={() => setAiReviewModalVisible(false)}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
              Select which AI-generated questions to save into your institutional Question Bank. Teacher questions are never overwritten.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {aiPreviewItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.aiItemReviewCard,
                    item.selected ? styles.aiItemCardSelected : styles.aiItemCardUnselected,
                  ]}
                  onPress={() => {
                    setAiPreviewItems((prev) =>
                      prev.map((i, iIdx) => (iIdx === idx ? { ...i, selected: !i.selected } : i))
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.aiItemHeader}>
                    <View style={[styles.checkboxRect, item.selected && styles.checkboxRectSelected]}>
                      {item.selected ? <CheckCircle2 size={14} color="#FFFFFF" /> : null}
                    </View>
                    <Text style={styles.aiItemTitle}>Question {idx + 1}</Text>
                  </View>

                  <Text style={styles.aiItemText}>{item.text}</Text>

                  {item.options && item.options.length > 0 ? (
                    <View style={styles.aiOptionsBox}>
                      {item.options.map((opt: string, oIdx: number) => (
                        <Text key={oIdx} style={styles.aiOptionText}>
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <Text style={styles.aiExplanationText}>Explanation: {item.explanation}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleSaveSelectedAiQuestions}
              disabled={savingSelected}
            >
              {savingSelected ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalText}>
                  Save Selected ({aiPreviewItems.filter((i) => i.selected).length}) to Bank
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Question Sheet Bulk Importer & Preview Modal (Requirement 1, 3, 4) */}
      <QuestionSheetUploadModal
        visible={sheetUploadVisible}
        onClose={() => setSheetUploadVisible(false)}
        onSuccess={() => fetchQuestions()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  filterChipActive: {
    borderColor: ZEEPREP_THEME.colors.primary,
    backgroundColor: "#EEF2FF",
  },
  filterText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  filterTextActive: {
    color: ZEEPREP_THEME.colors.primary,
    fontWeight: "700",
  },
  filterBar: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  gridNavContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  gridRow3: {
    flexDirection: "row",
    gap: 8,
  },
  gridRow2: {
    flexDirection: "row",
    gap: 8,
  },
  gridTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  gridTabActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderColor: ZEEPREP_THEME.colors.primary,
  },
  gridTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  gridTabTextActive: {
    color: "#FFFFFF",
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  levelChipActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  levelChipTextActive: {
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    height: 42,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  aiBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    height: 42,
    borderRadius: 12,
  },
  aiBtnText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  marksText: {
    fontSize: 12,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 10,
  },
  optionsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  optionText: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
  },
  emptyBox: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 80,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  submitModalBtn: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  submitModalText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  aiItemReviewCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  aiItemCardSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: ZEEPREP_THEME.colors.primary,
  },
  aiItemCardUnselected: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  aiItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  checkboxRect: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxRectSelected: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderColor: ZEEPREP_THEME.colors.primary,
  },
  aiItemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  aiItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  aiOptionsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    gap: 4,
    marginBottom: 8,
  },
  aiOptionText: {
    fontSize: 12,
    color: "#475569",
  },
  aiExplanationText: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#64748B",
  },
});
