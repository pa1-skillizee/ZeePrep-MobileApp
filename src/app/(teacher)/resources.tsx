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
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "../../stores/auth-store";
import { showZeeAlert } from "../../stores/alert-store";
import { addStudyResource } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  FolderKanban,
  Plus,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Eye,
  FolderUp,
  FilePlus,
  FileSpreadsheet,
  FileCode,
  Trash2,
  Play,
  Layers,
  GraduationCap,
  BookOpen,
  Check,
} from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import {
  getResourcesForUser,
  normalizeResource,
  autoDetectFileFormat,
  uploadResourceFileToStorage,
  NormalizedResource,
  ResourceTypeFormat,
} from "../../services/resource.service";

interface BatchFileItem {
  id: string;
  name: string;
  size: number;
  uri: string;
  mimeType: string;
  format: ResourceTypeFormat;
  displayType: string;
}

const AVAILABLE_CLASSES = ["8", "9", "10", "11", "12"];
const { width: screenWidth } = Dimensions.get("window");

export default function TeacherResourcesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin" || user?.email === "pa1@skillizee.io";

  const [resources, setResources] = useState<NormalizedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // Upload Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadMode, setUploadMode] = useState<"single" | "batch">("single");

  // Single Upload Fields
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState(user?.subject || "Mathematics");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([user?.grade || "11"]);
  const [singleType, setSingleType] = useState<"pdf" | "video" | "link">("video");
  const [url, setUrl] = useState("");

  // Batch Upload Fields
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getResourcesForUser(user);
      setResources(data);
    } catch (err) {
      console.error("Error loading teacher resources:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  const toggleGradeSelection = (g: string) => {
    if (selectedGrades.includes(g)) {
      if (selectedGrades.length > 1) {
        setSelectedGrades(selectedGrades.filter((item) => item !== g));
      }
    } else {
      setSelectedGrades([...selectedGrades, g]);
    }
  };

  const handleResourcePress = (rawRes: any) => {
    const res = normalizeResource(rawRes);
    router.push({
      pathname: "/resource/[id]",
      params: {
        id: res.id || `res-${Date.now()}`,
        rawUrl: res.url,
        title: res.title,
        type: res.format || res.rawType,
        subject: res.subject,
      },
    } as any);
  };

  // Pick Multiple Files
  const handlePickBatchFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems: BatchFileItem[] = result.assets.map((asset, idx) => {
          const detected = autoDetectFileFormat(asset.name, asset.mimeType || "");
          return {
            id: `batch-${Date.now()}-${idx}`,
            name: asset.name,
            size: asset.size || 0,
            uri: asset.uri,
            mimeType: asset.mimeType || "",
            format: detected.format,
            displayType: detected.displayType,
          };
        });

        setBatchFiles((prev) => [...prev, ...newItems]);
      }
    } catch (err) {
      console.error("Error picking batch files:", err);
      showZeeAlert("Upload Error", "Failed to select files.", [{ text: "OK" }], "error");
    }
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Publish Resource(s) across all selected classes
  const handleCreateResource = async () => {
    if (selectedGrades.length === 0) {
      showZeeAlert("Class Required", "Please select at least one class.", [{ text: "OK" }], "warning");
      return;
    }

    if (uploadMode === "single") {
      if (!title.trim() || !url.trim()) {
        showZeeAlert("Required Fields", "Please enter title, topic, and resource URL.", [{ text: "OK" }], "warning");
        return;
      }

      setUploading(true);
      try {
        let finalUrl = url.trim();
        let storagePath = "";

        if (finalUrl.startsWith("file://") || finalUrl.startsWith("blob:") || (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://"))) {
          const uploadRes = await uploadResourceFileToStorage(
            finalUrl,
            `${title.trim().replace(/[^a-zA-Z0-9]/g, "_")}.${singleType === "video" ? "mp4" : "pdf"}`,
            selectedGrades.join("_"),
            subject.trim()
          );
          if (uploadRes) {
            finalUrl = uploadRes.downloadUrl;
            storagePath = uploadRes.storagePath;
          }
        }

        for (const gr of selectedGrades) {
          const newRes = await addStudyResource(
            {
              title: title.trim(),
              topic: topic.trim() || "General Revision",
              subject: subject.trim(),
              grade: gr.trim(),
              section: "A",
              type: singleType,
              url: finalUrl,
              storagePath,
              uploadedBy: user?.uid || "",
            },
            user
          );
          if (newRes) {
            setResources((prev) => [normalizeResource(newRes), ...prev]);
          }
        }

        setModalVisible(false);
        setTitle("");
        setTopic("");
        setUrl("");
        showZeeAlert(
          "Published Successfully",
          `Resource published to ${selectedGrades.map((g) => `Class ${g}`).join(", ")}.`,
          [{ text: "OK" }],
          "success"
        );
      } catch (err) {
        console.error("Error uploading single resource:", err);
      } finally {
        setUploading(false);
      }
    } else {
      if (batchFiles.length === 0) {
        showZeeAlert("No Files Selected", "Please select one or more files to publish.", [{ text: "OK" }], "warning");
        return;
      }

      setUploading(true);
      try {
        let publishedCount = 0;
        for (const item of batchFiles) {
          let itemUrl = item.uri;
          let itemStoragePath = "";

          if (!itemUrl.startsWith("http://") && !itemUrl.startsWith("https://")) {
            const uploadRes = await uploadResourceFileToStorage(itemUrl, item.name, selectedGrades.join("_"), subject.trim());
            if (uploadRes) {
              itemUrl = uploadRes.downloadUrl;
              itemStoragePath = uploadRes.storagePath;
            }
          }

          for (const gr of selectedGrades) {
            const newRes = await addStudyResource(
              {
                title: item.name,
                topic: topic.trim() || "Course Notes",
                subject: subject.trim(),
                grade: gr.trim(),
                section: "A",
                type: item.format,
                url: itemUrl,
                storagePath: itemStoragePath,
                uploadedBy: user?.uid || "",
              },
              user
            );
            if (newRes) {
              publishedCount++;
              setResources((prev) => [normalizeResource(newRes), ...prev]);
            }
          }
        }

        setBatchFiles([]);
        setModalVisible(false);
        showZeeAlert("Batch Upload Complete", `Successfully published ${publishedCount} resources across selected classes.`, [{ text: "OK" }], "success");
      } catch (err) {
        console.error("Error publishing batch resources:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  // Filter and Group Class-wise -> Subject-wise -> Alphabetically
  const filteredList = resources.filter((res) => {
    const matchesFormat = selectedFormat === "all" || res.format === selectedFormat;
    const matchesClass = selectedClassFilter === "all" || String(res.grade) === selectedClassFilter;
    return matchesFormat && matchesClass;
  });

  // Group by Class
  const classGroups: { [grade: string]: { [subj: string]: NormalizedResource[] } } = {};
  filteredList.forEach((item) => {
    const g = item.grade ? `Class ${item.grade}` : "General / All Classes";
    const s = item.subject || "Mathematics";
    if (!classGroups[g]) classGroups[g] = {};
    if (!classGroups[g][s]) classGroups[g][s] = [];
    classGroups[g][s].push(item);
  });

  // Sort alphabetically by title
  Object.keys(classGroups).forEach((g) => {
    Object.keys(classGroups[g]).forEach((s) => {
      classGroups[g][s].sort((a, b) => a.title.localeCompare(b.title));
    });
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={isSuperAdmin ? "Global Resource Directory" : "Faculty Study Resources"}
        subtitle={
          isSuperAdmin
            ? "SuperAdmin View: All institutional materials across classes"
            : "Class-wise & Subject-wise organized material library"
        }
        fallbackRoute="/(teacher)"
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Plus color="#FFFFFF" size={16} />
            <Text style={styles.addBtnText}>Publish Material</Text>
          </TouchableOpacity>
        }
      />

      {/* Class Selector Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.classChip, selectedClassFilter === "all" && styles.classChipActive]}
            onPress={() => setSelectedClassFilter("all")}
          >
            <Text style={[styles.classChipText, selectedClassFilter === "all" && styles.classChipTextActive]}>
              All Classes ({resources.length})
            </Text>
          </TouchableOpacity>
          {AVAILABLE_CLASSES.map((c) => {
            const count = resources.filter((r) => String(r.grade) === c).length;
            return (
              <TouchableOpacity
                key={`cls-filt-${c}`}
                style={[styles.classChip, selectedClassFilter === c && styles.classChipActive]}
                onPress={() => setSelectedClassFilter(c)}
              >
                <Text style={[styles.classChipText, selectedClassFilter === c && styles.classChipTextActive]}>
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
        ) : Object.keys(classGroups).length > 0 ? (
          Object.keys(classGroups).map((className) => (
            <View key={className} style={styles.classSection}>
              <View style={styles.classHeaderRow}>
                <GraduationCap size={20} color="#4F46E5" />
                <Text style={styles.classSectionTitle}>{className}</Text>
                <View style={styles.classCountBadge}>
                  <Text style={styles.classCountText}>
                    {Object.values(classGroups[className]).reduce((acc, curr) => acc + curr.length, 0)} Items
                  </Text>
                </View>
              </View>

              {Object.keys(classGroups[className]).map((subjectName) => (
                <View key={`${className}-${subjectName}`} style={styles.subjectSubSection}>
                  <View style={styles.subjectHeaderRow}>
                    <BookOpen size={16} color="#059669" />
                    <Text style={styles.subjectSubTitle}>{subjectName.toUpperCase()}</Text>
                    <Text style={styles.subjectAlphaTag}>Alphabetical (A-Z)</Text>
                  </View>

                  <View style={styles.resourceGrid}>
                    {classGroups[className][subjectName].map((res) => {
                      const resFormat = (res.format || "").toString().toLowerCase();
                      const isVideo = resFormat === "video" || res.url.includes("youtube.com") || res.url.includes("youtu.be");
                      const thumbnail = res.thumbnailUrl;

                      return (
                        <TouchableOpacity
                          key={res.id}
                          style={styles.resourceCard}
                          onPress={() => handleResourcePress(res)}
                          activeOpacity={0.88}
                        >
                          {/* Thumbnail / Media Preview */}
                          <View style={styles.cardMediaBox}>
                            {thumbnail ? (
                              <Image source={{ uri: thumbnail }} style={styles.cardImagePreview} resizeMode="cover" />
                            ) : (
                              <View
                                style={[
                                  styles.cardPlaceholderPreview,
                                  { backgroundColor: isVideo ? "#1E1B4B" : resFormat === "pdf" ? "#881337" : "#064E3B" },
                                ]}
                              >
                                {isVideo ? (
                                  <Video size={28} color="#A5B4FC" />
                                ) : resFormat === "pdf" ? (
                                  <FileText size={28} color="#FDA4AF" />
                                ) : (
                                  <FileSpreadsheet size={28} color="#6EE7B7" />
                                )}
                              </View>
                            )}

                            {isVideo && (
                              <View style={styles.playOverlayBadge}>
                                <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                              </View>
                            )}

                            <View style={styles.formatTagBadge}>
                              <Text style={styles.formatTagText}>
                                {isVideo ? "VIDEO" : resFormat.toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          {/* Info Area */}
                          <View style={styles.cardInfoBox}>
                            <Text style={styles.resTopicText} numberOfLines={1}>
                              {res.topic || "Chapter Lecture"}
                            </Text>
                            <Text style={styles.resCardTitle} numberOfLines={2}>
                              {res.title}
                            </Text>

                            <View style={styles.cardFooter}>
                              <Text style={styles.resClassTag}>Class {res.grade || "11"}</Text>
                              <View style={styles.openPill}>
                                <Text style={styles.openPillText}>Open</Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FolderKanban size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Resources Found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Publish Material" above to upload lecture videos, notes or worksheets for your classes.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Publish Study Material</Text>
                <Text style={styles.modalSubtitle}>Distribute lecture videos, notes or sheets across classes</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              {/* Multi-Class Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Target Classes (Multi-Select):</Text>
                <View style={styles.multiClassRow}>
                  {AVAILABLE_CLASSES.map((cls) => {
                    const isSelected = selectedGrades.includes(cls);
                    return (
                      <TouchableOpacity
                        key={`modal-cls-${cls}`}
                        style={[styles.multiClassChip, isSelected && styles.multiClassChipActive]}
                        onPress={() => toggleGradeSelection(cls)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkboxDot, isSelected && styles.checkboxDotActive]}>
                          {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.multiClassChipText, isSelected && styles.multiClassChipTextActive]}>
                          Class {cls}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Subject & Topic */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="e.g. Mathematics"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1.3 }]}>
                  <Text style={styles.label}>Topic / Chapter</Text>
                  <TextInput
                    style={styles.input}
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g. Complex Numbers"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Mode Selection */}
              <View style={styles.modeToggleContainer}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, uploadMode === "single" && styles.modeToggleBtnActive]}
                  onPress={() => setUploadMode("single")}
                >
                  <Text style={[styles.modeToggleText, uploadMode === "single" && styles.modeToggleTextActive]}>
                    Video / Web Link / Single File
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, uploadMode === "batch" && styles.modeToggleBtnActive]}
                  onPress={() => setUploadMode("batch")}
                >
                  <Text style={[styles.modeToggleText, uploadMode === "batch" && styles.modeToggleTextActive]}>
                    Batch Documents (Multi-PDF)
                  </Text>
                </TouchableOpacity>
              </View>

              {uploadMode === "single" ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Resource Title</Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. Class 11 Trigonometric Formulas & Video Lecture"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Resource Format</Text>
                    <View style={styles.formatSelectRow}>
                      {[
                        { id: "video", label: "Video Lecture (YouTube/MP4)" },
                        { id: "pdf", label: "PDF Document" },
                        { id: "link", label: "Web Link / Notes" },
                      ].map((fmt) => (
                        <TouchableOpacity
                          key={fmt.id}
                          style={[styles.formatOptionBtn, singleType === fmt.id && styles.formatOptionBtnActive]}
                          onPress={() => setSingleType(fmt.id as any)}
                        >
                          <Text style={[styles.formatOptionText, singleType === fmt.id && styles.formatOptionTextActive]}>
                            {fmt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>URL or Storage Link</Text>
                    <TextInput
                      style={styles.input}
                      value={url}
                      onChangeText={setUrl}
                      placeholder="https://youtube.com/watch?v=... or https://..."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </>
              ) : (
                <View style={styles.batchSection}>
                  <TouchableOpacity style={styles.pickFilesBtn} onPress={handlePickBatchFiles} activeOpacity={0.8}>
                    <FolderUp size={24} color="#4F46E5" />
                    <Text style={styles.pickFilesText}>Select PDF / Word / Excel Files</Text>
                    <Text style={styles.pickFilesSubText}>Multi-select supported for fast batch publishing</Text>
                  </TouchableOpacity>

                  {batchFiles.length > 0 && (
                    <View style={styles.batchList}>
                      {batchFiles.map((file) => (
                        <View key={file.id} style={styles.batchItem}>
                          <FileText size={18} color="#4F46E5" />
                          <View style={{ flex: 1, marginHorizontal: 8 }}>
                            <Text style={styles.batchItemName} numberOfLines={1}>
                              {file.name}
                            </Text>
                            <Text style={styles.batchItemSize}>{formatFileSize(file.size)}</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveBatchItem(file.id)}>
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.publishSubmitBtn, uploading && { opacity: 0.6 }]}
                onPress={handleCreateResource}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.publishSubmitText}>
                    Publish to Selected Classes ({selectedGrades.map((g) => `Class ${g}`).join(", ")})
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  filterBar: {
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  classChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  classChipText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
  },
  classChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  classSection: {
    marginBottom: 24,
  },
  classHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  classSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  classCountBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  classCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  subjectSubSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subjectHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  subjectSubTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  subjectAlphaTag: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#94A3B8",
    marginLeft: "auto",
  },
  resourceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  resourceCard: {
    width: (screenWidth - 60) / 2 > 170 ? (screenWidth - 60) / 2 : 160,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardMediaBox: {
    width: "100%",
    height: 95,
    position: "relative",
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImagePreview: {
    width: "100%",
    height: "100%",
  },
  cardPlaceholderPreview: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playOverlayBadge: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  formatTagBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardInfoBox: {
    padding: 10,
  },
  resTopicText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  resCardTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resClassTag: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#64748B",
  },
  openPill: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#FFFFFF",
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 30,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalFormContent: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  multiClassRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  multiClassChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 6,
  },
  multiClassChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  checkboxDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDotActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  multiClassChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  multiClassChipTextActive: {
    color: "#4F46E5",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#0F172A",
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  modeToggleTextActive: {
    color: "#4F46E5",
  },
  formatSelectRow: {
    flexDirection: "column",
    gap: 6,
  },
  formatOptionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formatOptionBtnActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  formatOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  formatOptionTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  batchSection: {
    marginBottom: 14,
  },
  pickFilesBtn: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#EEF2FF",
  },
  pickFilesText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#4F46E5",
    marginTop: 6,
  },
  pickFilesSubText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  batchList: {
    marginTop: 10,
    gap: 6,
  },
  batchItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  batchItemName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  batchItemSize: {
    fontSize: 10,
    color: "#64748B",
  },
  publishSubmitBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  publishSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
