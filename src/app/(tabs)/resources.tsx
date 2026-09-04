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
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  BookOpen,
  Search,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  Play,
  Layers,
  Sparkles,
  GraduationCap,
} from "lucide-react-native";
import {
  getResourcesForUser,
  normalizeResource,
  NormalizedResource,
} from "../../services/resource.service";

export default function StudentResourcesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [resources, setResources] = useState<NormalizedResource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "video" | "doc">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getResourcesForUser(user);
      setResources(data);
    } catch (err) {
      console.error("Error fetching study resources:", err);
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

  // Extract distinct topics
  const topicsList = Array.from(
    new Set(
      resources
        .map((r) => r.topic || "General")
        .filter((t) => t && t.trim().length > 0)
    )
  );

  // Filter resources
  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTopic =
      selectedTopic === "all" || (res.topic || "General").toLowerCase() === selectedTopic.toLowerCase();

    const isVideo = res.format === "video" || res.url.includes("youtube.com") || res.url.includes("youtu.be");
    const matchesMedia =
      selectedMediaType === "all" ||
      (selectedMediaType === "video" && isVideo) ||
      (selectedMediaType === "doc" && !isVideo);

    return matchesSearch && matchesTopic && matchesMedia;
  });

  // Separate videos and documents
  const videoResources = filteredResources.filter(
    (r) => r.format === "video" || r.url.includes("youtube.com") || r.url.includes("youtu.be")
  );
  const docResources = filteredResources.filter(
    (r) => r.format !== "video" && !r.url.includes("youtube.com") && !r.url.includes("youtu.be")
  );

  return (
    <View style={[styles.container, isDesktopWeb && { maxWidth: 1280, alignSelf: "center", width: "100%", paddingHorizontal: 32, paddingTop: 24 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Study Material Library</Text>
            <Text style={styles.headerSubtitle}>
              Class {user?.grade || "11"} • Curated Videos, Notes & Formula Guides
            </Text>
          </View>
          <View style={styles.classBadge}>
            <GraduationCap size={14} color="#4F46E5" />
            <Text style={styles.classBadgeText}>Class {user?.grade || "11"}</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by topic, concept or chapter..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Media Type Tabs */}
        <View style={styles.mediaTabsRow}>
          {[
            { id: "all", label: `All (${resources.length})` },
            { id: "video", label: `Video Lectures (${resources.filter((r) => r.format === "video" || r.url.includes("youtube")).length})` },
            { id: "doc", label: `Notes & PDFs (${resources.filter((r) => r.format !== "video" && !r.url.includes("youtube")).length})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.mediaTab, selectedMediaType === tab.id && styles.mediaTabActive]}
              onPress={() => setSelectedMediaType(tab.id as any)}
            >
              <Text style={[styles.mediaTabText, selectedMediaType === tab.id && styles.mediaTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Topic Pills */}
        {topicsList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll}>
            <TouchableOpacity
              style={[styles.topicChip, selectedTopic === "all" && styles.topicChipActive]}
              onPress={() => setSelectedTopic("all")}
            >
              <Text style={[styles.topicChipText, selectedTopic === "all" && styles.topicChipTextActive]}>
                All Topics
              </Text>
            </TouchableOpacity>
            {topicsList.map((top, idx) => (
              <TouchableOpacity
                key={`top-${idx}-${top}`}
                style={[styles.topicChip, selectedTopic === top && styles.topicChipActive]}
                onPress={() => setSelectedTopic(top)}
              >
                <Text style={[styles.topicChipText, selectedTopic === top && styles.topicChipTextActive]}>
                  {top}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ZEEPREP_THEME.colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={ZEEPREP_THEME.colors.primary} style={{ marginTop: 40 }} />
        ) : filteredResources.length > 0 ? (
          <View>
            {/* Section 1: Topic-wise Video Lectures */}
            {(selectedMediaType === "all" || selectedMediaType === "video") && videoResources.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Video size={18} color="#EF4444" />
                  <Text style={styles.sectionTitle}>Video Lectures & Masterclasses</Text>
                  <Text style={styles.sectionSubtitle}>Topic-wise breakdown</Text>
                </View>

                <View style={styles.videoGrid}>
                  {videoResources.map((res) => (
                    <TouchableOpacity
                      key={res.id}
                      style={styles.videoCard}
                      onPress={() => handleResourcePress(res)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.videoThumbBox}>
                        {res.thumbnailUrl ? (
                          <Image source={{ uri: res.thumbnailUrl }} style={styles.videoThumbImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.videoThumbPlaceholder}>
                            <Video size={32} color="#A5B4FC" />
                          </View>
                        )}
                        <View style={styles.playButtonCircle}>
                          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                        <View style={styles.topicTag}>
                          <Text style={styles.topicTagText}>{res.topic || "Lecture"}</Text>
                        </View>
                      </View>

                      <View style={styles.videoInfo}>
                        <Text style={styles.videoSubject}>{res.subject?.toUpperCase() || "MATHEMATICS"}</Text>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                          {res.title}
                        </Text>
                        <View style={styles.videoBottomRow}>
                          <Text style={styles.videoClassText}>Class {res.grade || "11"}</Text>
                          <View style={styles.watchBadge}>
                            <Text style={styles.watchBadgeText}>Watch Now</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Section 2: Study Notes, PDFs & Worksheets */}
            {(selectedMediaType === "all" || selectedMediaType === "doc") && docResources.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <FileText size={18} color="#4F46E5" />
                  <Text style={styles.sectionTitle}>Study Notes & Question Guides</Text>
                  <Text style={styles.sectionSubtitle}>Downloadable & printable</Text>
                </View>

                <View style={styles.docList}>
                  {docResources.map((res) => (
                    <TouchableOpacity
                      key={res.id}
                      style={styles.docCard}
                      onPress={() => handleResourcePress(res)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.docIconBox}>
                        {res.format === "pdf" ? (
                          <FileText size={22} color="#EF4444" />
                        ) : (
                          <Layers size={22} color="#4F46E5" />
                        )}
                      </View>

                      <View style={styles.docInfo}>
                        <Text style={styles.docTopic}>{res.topic || "Revision Material"}</Text>
                        <Text style={styles.docTitle} numberOfLines={1}>
                          {res.title}
                        </Text>
                        <Text style={styles.docMeta}>
                          {res.subject} • {res.displayType}
                        </Text>
                      </View>

                      <View style={styles.openDocBadge}>
                        <Eye size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.openDocText}>Open</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <BookOpen size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Study Material Found</Text>
            <Text style={styles.emptySubtitle}>
              Your faculty has not uploaded resources matching your current search or filters.
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  classBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  classBadgeText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#4F46E5",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  mediaTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  mediaTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  mediaTabActive: {
    backgroundColor: "#4F46E5",
  },
  mediaTabText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  mediaTabTextActive: {
    color: "#FFFFFF",
  },
  topicScroll: {
    marginTop: 4,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 6,
  },
  topicChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  topicChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  topicChipTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#94A3B8",
    marginLeft: "auto",
  },
  videoGrid: {
    gap: 12,
  },
  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  videoThumbBox: {
    width: "100%",
    height: 140,
    backgroundColor: "#0F172A",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  videoThumbImage: {
    width: "100%",
    height: "100%",
  },
  videoThumbPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1B4B",
  },
  playButtonCircle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  topicTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  topicTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  videoInfo: {
    padding: 12,
  },
  videoSubject: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6366F1",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  videoTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 18,
    marginBottom: 8,
  },
  videoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoClassText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  watchBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  watchBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  docList: {
    gap: 8,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  docInfo: {
    flex: 1,
  },
  docTopic: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 11,
    color: "#64748B",
  },
  openDocBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  openDocText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyCard: {
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
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
