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
  Alert,
  Platform,
  useWindowDimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { showZeeAlert } from "../../stores/alert-store";
import { getAllUsers, updateUserAccountStatus, deleteUserAccountPermanently } from "../../services/firestore";
import type { User, UserRole } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Users, Search, ShieldCheck, Trash2, AlertTriangle, X, UserX, UserCheck, Globe } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function AdminUserManagementScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 2-Step Confirmation Deletion Modal State
  const [targetDeleteUser, setTargetDeleteUser] = useState<User | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers(selectedRole === "all" ? undefined : selectedRole);
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleStatus = async (userToUpdate: User) => {
    const newStatus = userToUpdate.status === "active" ? "disabled" : "active";
    const ok = await updateUserAccountStatus(userToUpdate.uid, newStatus, undefined, currentUser || undefined);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.uid === userToUpdate.uid ? { ...u, status: newStatus } : u))
      );
    } else {
      showZeeAlert("Error", "Failed to update user account status.", [{ text: "OK" }], "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteUser || confirmInput !== "DELETE") return;
    setDeleting(true);
    try {
      const ok = await deleteUserAccountPermanently(targetDeleteUser.uid, currentUser || undefined);
      if (ok) {
        setUsers((prev) => prev.filter((u) => u.uid !== targetDeleteUser.uid));
        setTargetDeleteUser(null);
        setConfirmInput("");
        showZeeAlert("User Removed", `Account ${targetDeleteUser.email} permanently deleted.`, [{ text: "OK" }], "success");
      } else {
        showZeeAlert("Error", "Failed to delete user account.", [{ text: "OK" }], "error");
      }
    } catch (err) {
      console.error("User deletion error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.loginId?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.container, isDesktopWeb && { maxWidth: 1280, alignSelf: "center", width: "100%", paddingHorizontal: 32, paddingTop: 24 }]}>
      <AppHeader
        title="User Directory & Governance"
        subtitle="Manage student, faculty, and admin accounts"
        fallbackRoute="/(admin)"
      />

      <View style={styles.controlsBar}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Role Filter Chips */}
        <View style={styles.roleRow}>
          {(["all", "student", "teacher", "admin"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, selectedRole === r && styles.roleChipActive]}
              onPress={() => setSelectedRole(r)}
            >
              <Text style={[styles.roleChipText, selectedRole === r && styles.roleChipTextActive]}>
                {r.toUpperCase()}
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
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <View key={u.uid} style={styles.userCard}>
              <View style={styles.userCardInfo}>
                <View style={styles.userNameRow}>
                  {u.avatarUrl || u.photoURL ? (
                    <Image source={{ uri: u.avatarUrl || u.photoURL }} style={styles.userCardAvatar} />
                  ) : (
                    <View style={styles.userCardAvatarFallback}>
                      <Text style={styles.userCardAvatarText}>{(u.name || "U").charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={styles.userName}>{u.name}</Text>
                      <View style={[styles.roleTag, u.role === "teacher" && styles.roleTagTeacher]}>
                        <Text style={styles.roleTagText}>{u.role ? String(u.role).toUpperCase() : "USER"}</Text>
                      </View>
                    </View>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                </View>

                <Text style={styles.userMeta}>
                  ID: {u.loginId || "N/A"} • {u.grade ? `Grade ${u.grade}` : u.role === "teacher" ? "Faculty Member" : "Administrator"}
                </Text>

                {/* Login IP Address Badge */}
                <View style={styles.ipBadgeRow}>
                  <Globe size={13} color="#4F46E5" />
                  <Text style={styles.ipBadgeLabel}>Last IP:</Text>
                  <Text style={styles.ipBadgeValue}>{u.lastLoginIp || "Not logged yet"}</Text>
                  {u.lastLoginAt && (
                    <Text style={styles.ipBadgeTime}>
                      • {new Date(u.lastLoginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.statusBtn, u.status === "active" ? styles.statusBtnActive : styles.statusBtnDisabled]}
                  onPress={() => handleToggleStatus(u)}
                >
                  {u.status === "active" ? (
                    <UserCheck size={14} color="#059669" />
                  ) : (
                    <UserX size={14} color="#DC2626" />
                  )}
                  <Text style={[styles.statusBtnText, u.status === "active" ? styles.statusTextActive : styles.statusTextDisabled]}>
                    {u.status === "active" ? "ACTIVE" : "DISABLED"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    setTargetDeleteUser(u);
                    setConfirmInput("");
                  }}
                >
                  <Trash2 size={16} color={ZEEPREP_THEME.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Users size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Accounts Found</Text>
            <Text style={styles.emptySubtitle}>No user records match your search or filter.</Text>
          </View>
        )}
      </ScrollView>

      {/* 2-Step Double Confirmation Deletion Modal */}
      <Modal visible={!!targetDeleteUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.warningBadge}>
                <AlertTriangle size={24} color={ZEEPREP_THEME.colors.error} />
              </View>
              <TouchableOpacity onPress={() => setTargetDeleteUser(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Permanent Account Purge</Text>
            <Text style={styles.modalSub}>
              You are about to permanently delete <Text style={{ fontWeight: "700" }}>{targetDeleteUser?.email}</Text>. This action cannot be undone.
            </Text>

            <View style={styles.confirmBox}>
              <Text style={styles.confirmInstruction}>
                Type <Text style={{ fontWeight: "800", color: ZEEPREP_THEME.colors.error }}>DELETE</Text> below to confirm:
              </Text>
              <TextInput
                style={styles.confirmInput}
                placeholder="Type DELETE"
                placeholderTextColor="#94A3B8"
                value={confirmInput}
                onChangeText={setConfirmInput}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTargetDeleteUser(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteBtn,
                  confirmInput !== "DELETE" && styles.confirmDeleteDisabled,
                ]}
                onPress={handleConfirmDelete}
                disabled={confirmInput !== "DELETE" || deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Purge Account</Text>
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
  },
  controlsBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ZEEPREP_THEME.colors.border,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  roleChipActive: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  roleChipTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
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
  userCardInfo: {
    marginBottom: 12,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  userCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#4F46E5",
  },
  userCardAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  userCardAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  roleTag: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagTeacher: {
    backgroundColor: "#F3E8FF",
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  userEmail: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 1,
  },
  userMeta: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textMuted,
    marginTop: 2,
  },
  ipBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginTop: 6,
  },
  ipBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4338CA",
  },
  ipBadgeValue: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  ipBadgeTime: {
    fontSize: 10,
    color: "#6366F1",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBtnActive: {
    backgroundColor: "#ECFDF5",
  },
  statusBtnDisabled: {
    backgroundColor: "#FEF2F2",
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextActive: {
    color: "#059669",
  },
  statusTextDisabled: {
    color: "#DC2626",
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: ZEEPREP_THEME.colors.errorLight,
    borderRadius: 8,
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
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  warningBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ZEEPREP_THEME.colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 20,
  },
  confirmInstruction: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 8,
  },
  confirmInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.error,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: ZEEPREP_THEME.colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteDisabled: {
    opacity: 0.4,
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
