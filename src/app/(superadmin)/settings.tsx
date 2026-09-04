import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { showZeeAlert } from "../../stores/alert-store";
import { ZEEPREP_THEME } from "../../constants/theme";
import { Settings, Shield, Bell, Database, Lock, Server, CheckCircle2 } from "lucide-react-native";

import { AppHeader } from "../../components/AppHeader";

export default function SuperAdminSettingsScreen() {
  const [autoApproval, setAutoApproval] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [auditLogging, setAuditLogging] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: ZEEPREP_THEME.colors.background }}>
      <AppHeader
        title="Platform Settings"
        subtitle="Configure system parameters & telemetry"
        fallbackRoute="/(superadmin)"
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      <Text style={styles.sectionTitle}>Verification & Security</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.label}>Auto-Approve Domain Faculty</Text>
            <Text style={styles.subLabel}>Automatically verify teachers signing up with verified school domain</Text>
          </View>
          <Switch
            value={autoApproval}
            onValueChange={setAutoApproval}
            trackColor={{ false: "#E2E8F0", true: "#A5B4FC" }}
            thumbColor={autoApproval ? ZEEPREP_THEME.colors.primary : "#94A3B8"}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.label}>Comprehensive Audit Logging</Text>
            <Text style={styles.subLabel}>Record real-time security events & user account operations</Text>
          </View>
          <Switch
            value={auditLogging}
            onValueChange={setAuditLogging}
            trackColor={{ false: "#E2E8F0", true: "#A5B4FC" }}
            thumbColor={auditLogging ? ZEEPREP_THEME.colors.primary : "#94A3B8"}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.label}>System Maintenance Mode</Text>
            <Text style={styles.subLabel}>Temporarily lock student assessment submissions for database maintenance</Text>
          </View>
          <Switch
            value={maintenanceMode}
            onValueChange={(val) => {
              setMaintenanceMode(val);
              if (val) {
                showZeeAlert("Maintenance Mode", "System maintenance mode activated.", [{ text: "OK" }], "warning");
              }
            }}
            trackColor={{ false: "#E2E8F0", true: "#FCA5A5" }}
            thumbColor={maintenanceMode ? "#DC2626" : "#94A3B8"}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Infrastructure Telemetry</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Server size={18} color={ZEEPREP_THEME.colors.primary} />
          <Text style={styles.infoText}>Firebase Region: asia-south1 (Mumbai)</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Database size={18} color="#059669" />
          <Text style={styles.infoText}>Firestore Project ID: zeeprep01</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <CheckCircle2 size={18} color="#059669" />
          <Text style={styles.infoText}>App Version: ZeePrep Mobile v2.5.0</Text>
        </View>
      </View>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.primary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  subLabel: {
    fontSize: 12,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
});
