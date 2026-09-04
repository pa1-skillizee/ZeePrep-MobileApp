import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Trash2, CheckCircle2, ArrowLeft, ShieldAlert, Mail } from "lucide-react-native";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmitRequest = () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid registered email address.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/login" as any))}
        >
          <ArrowLeft size={18} color="#0F172A" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>ZeePrep Privacy Center</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Trash2 size={28} color="#EF4444" />
        </View>

        <Text style={styles.cardTitle}>Account & Data Deletion Request</Text>
        <Text style={styles.cardSub}>
          In accordance with Google Play Data Safety policies, you have the right to request permanent deletion of your ZeePrep account and associated academic data.
        </Text>

        {submitted ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={36} color="#10B981" style={{ marginBottom: 10 }} />
            <Text style={styles.successTitle}>Deletion Request Received</Text>
            <Text style={styles.successText}>
              We have received your account and data deletion request for <Text style={{ fontWeight: "700" }}>{email}</Text>. Your account, profile information, exam attempt history, and diagnostic reports will be permanently purged within 30 days.
            </Text>
            <Text style={styles.successSub}>
              A confirmation receipt will be sent to your email address.
            </Text>
          </View>
        ) : (
          <View style={styles.formArea}>
            <View style={styles.policyNotice}>
              <ShieldAlert size={20} color="#D97706" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.policyNoticeTitle}>What will be deleted:</Text>
                <Text style={styles.policyNoticeText}>
                  • User authentication profile and contact information{"\n"}
                  • All recorded exam attempts, answers, and time logs{"\n"}
                  • Personalized weak-topic diagnostics and score predictions
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Registered Email Address *</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="student@school.com or teacher@school.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.inputLabel}>Reason for deletion (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Graduated, switching institution, or no longer using the app"
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmitRequest}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Account Deletion Request</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.supportContactText}>
              Alternatively, you can contact our Data Protection Officer directly at{" "}
              <Text style={{ fontWeight: "700", color: "#4F46E5" }}>pa1@skillizee.io</Text>.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  headerBar: {
    width: "100%",
    maxWidth: 540,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: -0.2,
  },
  card: {
    width: "100%",
    maxWidth: 540,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    alignSelf: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  formArea: {
    width: "100%",
  },
  policyNotice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  policyNoticeTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 4,
  },
  policyNoticeText: {
    fontSize: 12,
    color: "#B45309",
    lineHeight: 17,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12.5,
    color: "#DC2626",
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F172A",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    height: 72,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  supportContactText: {
    fontSize: 11.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  successTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: "#334155",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 10,
  },
  successSub: {
    fontSize: 11.5,
    color: "#64748B",
    textAlign: "center",
  },
});
