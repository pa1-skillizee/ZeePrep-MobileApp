import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { getAuditLogs, getLoginAuditLogs } from "../../services/firestore";
import type { AuditLog, LoginAuditRecord } from "../../types";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Activity, Globe, ShieldCheck, Clock, UserCheck, ShieldAlert } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";

type AuditTab = "security" | "logins";

export default function AuditLogsScreen() {
  const [activeTab, setActiveTab] = useState<AuditTab>("logins");
  const [securityLogs, setSecurityLogs] = useState<AuditLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sec, logins] = await Promise.allSettled([
        getAuditLogs(),
        getLoginAuditLogs(60),
      ]);

      if (sec.status === "fulfilled") {
        setSecurityLogs(sec.value);
      }
      if (logins.status === "fulfilled") {
        setLoginLogs(logins.value);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Audit & IP Telemetry"
        subtitle="Live login security tracking & administrative actions"
        fallbackRoute="/(superadmin)"
      />

      {/* Mode Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "logins" && styles.tabBtnActive]}
          onPress={() => setActiveTab("logins")}
          activeOpacity={0.8}
        >
          <Globe size={15} color={activeTab === "logins" ? "#4F46E5" : "#64748B"} />
          <Text style={[styles.tabBtnText, activeTab === "logins" && styles.tabBtnTextActive]}>
            Login & IP Trail ({loginLogs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "security" && styles.tabBtnActive]}
          onPress={() => setActiveTab("security")}
          activeOpacity={0.8}
        >
          <ShieldAlert size={15} color={activeTab === "security" ? "#4F46E5" : "#64748B"} />
          <Text style={[styles.tabBtnText, activeTab === "security" && styles.tabBtnTextActive]}>
            Admin Actions ({securityLogs.length})
          </Text>
        </TouchableOpacity>
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
        ) : activeTab === "logins" ? (
          loginLogs.length > 0 ? (
            loginLogs.map((log) => (
              <View key={log.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.roleChip}>
                    <Text style={styles.roleChipText}>{String(log.role || "USER").toUpperCase()}</Text>
                  </View>
                  <View style={styles.timeWrap}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.timeText}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : "Recent"}
                    </Text>
                  </View>
                </View>

                <View style={styles.userMainRow}>
                  <Text style={styles.userName}>{log.name || "Student / User"}</Text>
                  <Text style={styles.userEmail}>{log.email || log.loginId}</Text>
                </View>

                {/* IP Badge */}
                <View style={styles.ipBadge}>
                  <Globe size={13} color="#059669" />
                  <Text style={styles.ipBadgeLabel}>IP Address:</Text>
                  <Text style={styles.ipBadgeValue}>{log.ipAddress || "127.0.0.1"}</Text>
                  {log.platform ? (
                    <Text style={styles.platformBadge}>[{log.platform}]</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Globe size={40} color={ZEEPREP_THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No Login Records</Text>
              <Text style={styles.emptySubtitle}>
                Login audits with client IP addresses will stream here automatically upon user authentication.
              </Text>
            </View>
          )
        ) : securityLogs.length > 0 ? (
          securityLogs.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.actionChip}>
                  <Text style={styles.actionChipText}>{log.action}</Text>
                </View>
                <Text style={styles.timeText}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
              </View>

              <Text style={styles.performerText}>Performed by: {log.performedByName}</Text>
              {log.details ? <Text style={styles.detailsText}>{log.details}</Text> : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Activity size={40} color={ZEEPREP_THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Security Events Logged</Text>
            <Text style={styles.emptySubtitle}>Administrative audit trail is clean and operational.</Text>
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtnActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#4F46E5",
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4F46E5",
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: ZEEPREP_THEME.colors.textMuted,
    fontWeight: "500",
  },
  userMainRow: {
    marginTop: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  userEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  ipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  ipBadgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  ipBadgeValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#047857",
  },
  platformBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  actionChip: {
    backgroundColor: ZEEPREP_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
  },
  performerText: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  detailsText: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    lineHeight: 18,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
