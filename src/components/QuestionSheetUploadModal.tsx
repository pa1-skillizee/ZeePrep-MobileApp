import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { parseQuestionSheet, type SheetValidationResult, type ParsedQuestionRow } from "../utils/question-sheet-importer";
import { addQuestionToBank } from "../services/firestore";
import { useAuthStore } from "../stores/auth-store";
import { showZeeAlert } from "../stores/alert-store";
import { ZEEPREP_THEME } from "../constants/theme";
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number, totalMarks: number) => void;
}

const SAMPLE_CSV_TEMPLATE = `Question,Option A,Option B,Option C,Option D,Correct Answer,Marks
What is 2+2?,3,4,5,6,B,1
Capital of France?,London,Paris,Rome,Berlin,B,2
Water chemical formula?,CO2,H2O,O2,NaCl,B,3
Photosynthesis produces which gas?,Carbon Dioxide,Oxygen,Nitrogen,Methane,B,4`;

export function QuestionSheetUploadModal({ visible, onClose, onSuccess }: Props) {
  const user = useAuthStore((state) => state.user);

  const [sheetText, setSheetText] = useState(SAMPLE_CSV_TEMPLATE);
  const [step, setStep] = useState<"input" | "validation">("input");
  const [validationResult, setValidationResult] = useState<SheetValidationResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleValidateSheet = () => {
    if (!sheetText.trim()) {
      showZeeAlert("Empty Sheet", "Please paste or enter question sheet text before validating.", [{ text: "OK" }], "warning");
      return;
    }

    const result = parseQuestionSheet(sheetText);
    setValidationResult(result);
    setStep("validation");
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validCount === 0) {
      showZeeAlert("No Valid Questions", "There are no valid questions ready to be imported.", [{ text: "OK" }], "warning");
      return;
    }

    setImporting(true);
    let imported = 0;

    try {
      const validRows = validationResult.rows.filter((r) => r.isValid);

      for (const row of validRows) {
        const saved = await addQuestionToBank(
          {
            text: row.questionText,
            options: row.options,
            correctAnswer: row.correctAnswer,
            marks: row.marks || 1, // Explicit marks supplied by teacher
            level: row.level || "level1",
            subject: row.subject || user?.subject || "Science",
            chapter: row.chapter,
            topic: row.topic,
            isTeacherAuthority: true,
          },
          user
        );
        if (saved) imported++;
      }

      onSuccess(imported, validationResult.totalMarks);
      setStep("input");
      setValidationResult(null);
      onClose();
      showZeeAlert(
        "Import Successful",
        `Successfully imported ${imported} questions with Total Marks: ${validationResult.totalMarks}.`,
        [{ text: "OK" }],
        "success"
      );
    } catch (err) {
      console.error("Bulk question import error:", err);
      showZeeAlert("Import Failed", "An error occurred while publishing questions to Firestore.", [{ text: "OK" }], "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet color="#4F46E5" size={22} />
              <Text style={styles.title}>
                {step === "input" ? "Import Question Sheet" : "Sheet Validation & Preview"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {step === "input" ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.sectionSubtitle}>
                Paste your CSV / Excel text. Supported headers: <Text style={{ fontWeight: "800", color: "#4F46E5" }}>Question, Option A, Option B, Option C, Option D, Correct Answer, Marks</Text>.
              </Text>

              <TextInput
                style={styles.sheetTextArea}
                multiline
                value={sheetText}
                onChangeText={setSheetText}
                placeholder="Paste CSV / Excel text here..."
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={styles.sampleTemplateBtn}
                onPress={() => setSheetText(SAMPLE_CSV_TEMPLATE)}
              >
                <FileSpreadsheet size={15} color="#D97706" />
                <Text style={styles.sampleTemplateText}>Load Sample CSV Template with Marks</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.validateBtn} onPress={handleValidateSheet}>
                <Upload color="#FFFFFF" size={18} />
                <Text style={styles.validateBtnText}>Validate Sheet & Preview Marks</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Requirement 3: Import Validation Stats */}
              {validationResult ? (
                <View style={styles.statsCard}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValSuccess}>{validationResult.validCount}</Text>
                    <Text style={styles.statLbl}>Valid Questions</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={validationResult.errorCount > 0 ? styles.statValError : styles.statValMuted}>
                      {validationResult.errorCount}
                    </Text>
                    <Text style={styles.statLbl}>Questions With Errors</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValMarks}>{validationResult.totalMarks}</Text>
                    <Text style={styles.statLbl}>Total Marks</Text>
                  </View>
                </View>
              ) : null}

              {/* Requirement 4: Preview Question List */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                {validationResult?.rows.map((row, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.previewCard,
                      row.isValid ? styles.cardValid : styles.cardError,
                    ]}
                  >
                    <View style={styles.previewHeader}>
                      <Text style={styles.previewNumber}>Question {row.rowNumber}</Text>
                      {row.isValid ? (
                        <View style={styles.marksChip}>
                          <Text style={styles.marksChipText}>+{row.marks} Marks</Text>
                        </View>
                      ) : (
                        <View style={styles.errorPill}>
                          <AlertTriangle size={12} color="#EF4444" />
                          <Text style={styles.errorPillText}>Invalid Row</Text>
                        </View>
                      )}
                    </View>

                    {row.isValid ? (
                      <>
                        <Text style={styles.previewQuestionText}>{row.questionText}</Text>
                        <Text style={styles.previewMetaText}>
                          Correct Answer: <Text style={{ fontWeight: "700", color: "#059669" }}>{row.correctAnswer}</Text> • Marks: <Text style={{ fontWeight: "800", color: "#4F46E5" }}>{row.marks}</Text>
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.errorReasonText}>{row.errorReason}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Bottom Actions */}
              <View style={styles.bottomActionsRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setStep("input")}
                  disabled={importing}
                >
                  <Text style={styles.backBtnText}>Edit Sheet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.publishBtn,
                    (importing || !validationResult || validationResult.validCount === 0) && { opacity: 0.5 },
                  ]}
                  onPress={handleConfirmImport}
                  disabled={importing || !validationResult || validationResult.validCount === 0}
                >
                  {importing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 color="#FFFFFF" size={16} />
                      <Text style={styles.publishBtnText}>
                        Publish {validationResult?.validCount || 0} Questions ({validationResult?.totalMarks || 0} Marks)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 16,
  },
  content: {
    height: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  sheetTextArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    height: 240,
    fontSize: 12,
    color: "#0F172A",
    fontFamily: "monospace",
    textAlignVertical: "top",
  },
  sampleTemplateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginVertical: 12,
  },
  sampleTemplateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  validateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4F46E5",
    height: 48,
    borderRadius: 14,
    marginTop: 6,
  },
  validateBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  statBox: {
    alignItems: "center",
  },
  statValSuccess: {
    fontSize: 20,
    fontWeight: "800",
    color: "#059669",
  },
  statValError: {
    fontSize: 20,
    fontWeight: "800",
    color: "#EF4444",
  },
  statValMuted: {
    fontSize: 20,
    fontWeight: "800",
    color: "#64748B",
  },
  statValMarks: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4F46E5",
  },
  statLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardValid: {
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "#F0FDF4",
  },
  cardError: {
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "#FEF2F2",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  previewNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  marksChip: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marksChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  errorPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EF4444",
  },
  previewQuestionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  previewMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  errorReasonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    lineHeight: 16,
  },
  bottomActionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  backBtn: {
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  publishBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
