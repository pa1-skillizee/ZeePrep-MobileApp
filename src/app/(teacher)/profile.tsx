import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "../../stores/auth-store";
import { showZeeAlert } from "../../stores/alert-store";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { updateUserProfilePhoto, removeUserProfilePhoto } from "../../services/firestore";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  UserCheck,
  LogOut,
  ChevronRight,
  Camera,
  Trash2,
  Globe,
  Clock,
  CheckCircle2,
  X,
  Upload,
  Shield,
  BookOpen,
} from "lucide-react-native";

const FACULTY_AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
];

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

  const handleLogout = () => {
    showZeeAlert(
      "Sign Out",
      "Are you sure you want to sign out of ZeePrep Mobile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (e) {
              console.error("Firebase SignOut error:", e);
            }
            logout();
            router.replace("/(auth)/login");
          },
        },
      ],
      "warning"
    );
  };

  const handlePickDeviceImage = async () => {
    setPhotoPickerVisible(false);
    if (!user) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadingPhoto(true);
        const res = await updateUserProfilePhoto(user.uid, file.uri);
        if (res.success && res.photoUrl) {
          setUser({ ...user, avatarUrl: res.photoUrl, photoURL: res.photoUrl });
          showZeeAlert("Success", "Faculty profile photo updated successfully!", [{ text: "OK" }], "success");
        } else {
          showZeeAlert("Notice", res.error || "Failed to update profile photo.", [{ text: "OK" }], "error");
        }
      }
    } catch (err: any) {
      console.error("Image pick error:", err);
      showZeeAlert("Error", "Could not load image from your device.", [{ text: "OK" }], "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSelectPreset = async (presetUrl: string) => {
    setPhotoPickerVisible(false);
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const res = await updateUserProfilePhoto(user.uid, presetUrl);
      if (res.success) {
        setUser({ ...user, avatarUrl: presetUrl, photoURL: presetUrl });
        showZeeAlert("Success", "Faculty avatar updated!", [{ text: "OK" }], "success");
      }
    } catch (err) {
      console.error("Preset avatar error:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPickerVisible(false);
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const res = await removeUserProfilePhoto(user.uid);
      if (res.success) {
        setUser({ ...user, avatarUrl: "", photoURL: "" });
        showZeeAlert("Profile Photo Removed", "Your avatar has been reset to initials.", [{ text: "OK" }], "info");
      }
    } catch (err) {
      console.error("Remove photo error:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const currentAvatar = user?.avatarUrl || user?.photoURL || (user as any)?.avatar;
  const hasCustomPhoto = Boolean(
    currentAvatar &&
      typeof currentAvatar === "string" &&
      currentAvatar.trim().length > 5 &&
      currentAvatar !== "null" &&
      currentAvatar !== "undefined"
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.avatarHolder}
          onPress={() => setPhotoPickerVisible(true)}
          activeOpacity={0.8}
          disabled={uploadingPhoto}
        >
          {uploadingPhoto ? (
            <View style={styles.avatarLarge}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : hasCustomPhoto ? (
            <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "T"}</Text>
            </View>
          )}

          <View style={styles.cameraIconBadge}>
            <Camera size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{user?.name || "Faculty Member"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.roleChip}>
          <UserCheck size={14} color={ZEEPREP_THEME.colors.primary} />
          <Text style={styles.roleChipText}>VERIFIED FACULTY EDUCATOR</Text>
        </View>

        {/* Change Photo Trigger Button */}
        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={() => setPhotoPickerVisible(true)}
          activeOpacity={0.8}
        >
          <Camera size={13} color="#4F46E5" />
          <Text style={styles.changePhotoBtnText}>
            {hasCustomPhoto ? "Change Faculty Photo" : "Upload Faculty Photo"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Faculty Details Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faculty Credentials & Meta</Text>
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Faculty ID:</Text>
            <Text style={styles.metaValue}>{user?.loginId || "N/A"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Assigned Subject:</Text>
            <Text style={styles.metaValue}>{user?.subject || "General Science"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Grade Level:</Text>
            <Text style={styles.metaValue}>Grade {user?.grade || "10-12"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Institution:</Text>
            <Text style={styles.metaValue}>{user?.schoolName || "ZeePrep Institutional Academy"}</Text>
          </View>
        </View>
      </View>

      {/* Security & Login Telemetry Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Login Telemetry</Text>
        <View style={styles.securityCard}>
          <View style={styles.securityRow}>
            <View style={styles.securityIconBox}>
              <Globe size={16} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityLabel}>Connected IP Address</Text>
              <Text style={styles.securityValue}>
                {user?.lastLoginIp || "Verified Connection"}
              </Text>
            </View>
            <View style={styles.verifiedChip}>
              <CheckCircle2 size={12} color="#059669" />
              <Text style={styles.verifiedText}>SECURE</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.securityRow}>
            <View style={styles.securityIconBox}>
              <Clock size={16} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityLabel}>Last Authenticated Session</Text>
              <Text style={styles.securityValue}>
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Current Active Session"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Operations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Operations</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={20} color={ZEEPREP_THEME.colors.error} />
          <Text style={styles.logoutBtnText}>Sign Out of Faculty Account</Text>
          <ChevronRight size={18} color={ZEEPREP_THEME.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Photo Picker Modal */}
      <Modal visible={photoPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Faculty Profile Photo</Text>
              <TouchableOpacity onPress={() => setPhotoPickerVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={handlePickDeviceImage}
              activeOpacity={0.85}
            >
              <Upload size={18} color="#4F46E5" />
              <Text style={styles.modalActionText}>Upload from Device / Gallery</Text>
            </TouchableOpacity>

            <Text style={styles.presetSectionTitle}>Or choose an educator avatar:</Text>
            <View style={styles.presetsGrid}>
              {FACULTY_AVATAR_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetItem}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: preset }} style={styles.presetImage} />
                </TouchableOpacity>
              ))}
            </View>

            {hasCustomPhoto && (
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={handleRemovePhoto}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#DC2626" />
                <Text style={styles.removePhotoText}>Remove Custom Photo</Text>
              </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarHolder: {
    position: "relative",
    marginBottom: 12,
  },
  avatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: ZEEPREP_THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#4F46E5",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
    letterSpacing: 0.5,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  metaCard: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },

  securityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  securityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  securityLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  securityValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    marginTop: 1,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: ZEEPREP_THEME.colors.errorLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.error,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EEF2FF",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
  presetSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  presetItem: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  presetImage: {
    width: 50,
    height: 50,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
});
