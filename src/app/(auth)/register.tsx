import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useAuthStore } from "../../stores/auth-store";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  BookOpen,
  UserCheck,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  School,
  CheckCircle2,
} from "lucide-react-native";
import { getSubjectsForGrade, ALL_GRADES } from "../../constants/academic-subjects";

export default function RegisterScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [role, setRole] = useState<"student" | "teacher">("student");

  // Common Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Academic Fields
  const [board, setBoard] = useState("CBSE");
  const [grade, setGrade] = useState("Grade 10");
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState("Physics");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      // 2. Derive Login ID (e.g. ZP-STU-XXXX or ZP-TCH-XXXX)
      const prefix = role === "teacher" ? "ZP-TCH" : "ZP-STU";
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const loginId = `${prefix}-${randomCode}`;

      // 3. Create Firestore User Profile Document
      const newUserProfile = {
        uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        loginId,
        role,
        phone: phone.trim() || null,
        board,
        grade,
        section,
        subject: role === "teacher" ? subject : null,
        status: role === "teacher" ? ("pending" as const) : ("active" as const),
        approvalStatus: role === "teacher" ? ("pending" as const) : ("approved" as const),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), newUserProfile);

      // Create Login ID index mapping
      await setDoc(doc(db, "loginIds", loginId), {
        email: email.trim().toLowerCase(),
        uid,
        role,
      });

      if (role === "teacher") {
        setSuccessMessage(`Account created! Your Faculty Login ID is: ${loginId}. Approval pending.`);
      } else {
        setUser(newUserProfile as any);
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      console.error("Register Error:", error);
      let msg = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        msg = "An account with this email address already exists.";
      } else if (error.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isKeyboardVisible ? 200 : 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back to Login */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={ZEEPREP_THEME.colors.primary} />
          <Text style={styles.backBtnText}>Back to Sign In</Text>
        </TouchableOpacity>

        {/* Branding Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Create ZeePrep Account</Text>
          <Text style={styles.brandSubtitle}>
            Join ZeePrep Diagnostic & Exam Platform
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Role Tabs */}
          <View style={styles.roleTabGrid}>
            <TouchableOpacity
              style={[styles.roleTab, role === "student" && styles.roleTabActive]}
              onPress={() => {
                setRole("student");
                setErrorMessage("");
              }}
            >
              <GraduationCap
                size={18}
                color={role === "student" ? ZEEPREP_THEME.colors.primary : "#64748B"}
              />
              <Text
                style={[
                  styles.roleTabText,
                  role === "student" && styles.roleTabTextActive,
                ]}
              >
                Student Registration
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, role === "teacher" && styles.roleTabActive]}
              onPress={() => {
                setRole("teacher");
                setErrorMessage("");
              }}
            >
              <UserCheck
                size={18}
                color={role === "teacher" ? ZEEPREP_THEME.colors.primary : "#64748B"}
              />
              <Text
                style={[
                  styles.roleTabText,
                  role === "teacher" && styles.roleTabTextActive,
                ]}
              >
                Teacher Registration
              </Text>
            </TouchableOpacity>
          </View>

          {/* Success Banner */}
          {successMessage ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={24} color={ZEEPREP_THEME.colors.success} />
              <Text style={styles.successText}>{successMessage}</Text>
              <TouchableOpacity
                style={styles.returnLoginBtn}
                onPress={() => router.replace("/(auth)/login" as any)}
              >
                <Text style={styles.returnLoginBtnText}>Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="user@school.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+91 9876543210"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Academic Grid */}
              <Text style={styles.sectionHeader}>Academic Scoping</Text>

              <View style={styles.academicRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Board</Text>
                  <View style={styles.inputWrapper}>
                    <School size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={board}
                      onChangeText={setBoard}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Section</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={section}
                      onChangeText={setSection}
                      placeholder="e.g. A"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>

              {/* Class / Grade Selector Pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grade / Class</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {ALL_GRADES.map((g) => {
                      const isSel = grade === `Grade ${g}` || grade === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.roleTab,
                            isSel && styles.roleTabActive,
                            { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, minWidth: 68 },
                          ]}
                          onPress={() => {
                            setGrade(g);
                            const subs = getSubjectsForGrade(g);
                            if (subs.length > 0 && !subs.includes(subject)) {
                              setSubject(subs[0]);
                            }
                          }}
                        >
                          <Text style={[styles.roleTabText, isSel && styles.roleTabTextActive, { fontSize: 12 }]}>
                            Class {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {role === "teacher" ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Assigned Teaching Subject (Class {grade})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {getSubjectsForGrade(grade).map((sub) => {
                        const isSel = subject.trim().toLowerCase() === sub.trim().toLowerCase();
                        return (
                          <TouchableOpacity
                            key={sub}
                            style={[
                              styles.roleTab,
                              isSel && styles.roleTabActive,
                              { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
                            ]}
                            onPress={() => setSubject(sub)}
                          >
                            <Text style={[styles.roleTabText, isSel && styles.roleTabTextActive, { fontSize: 12 }]}>
                              {sub}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={subject}
                      onChangeText={setSubject}
                      placeholder="e.g. Mathematics"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              ) : null}

              {/* Submit Registration */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.submitBtnText}>
                      {role === "teacher" ? "Submit Teacher Application" : "Complete Registration"}
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZEEPREP_THEME.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.primary,
  },
  header: {
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: ZEEPREP_THEME.colors.textPrimary,
  },
  brandSubtitle: {
    fontSize: 13,
    color: ZEEPREP_THEME.colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: ZEEPREP_THEME.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  roleTabGrid: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  roleTabTextActive: {
    color: ZEEPREP_THEME.colors.primary,
    fontWeight: "700",
  },
  errorBox: {
    backgroundColor: ZEEPREP_THEME.colors.errorLight,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: ZEEPREP_THEME.colors.error,
    fontSize: 13,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ZEEPREP_THEME.colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    color: ZEEPREP_THEME.colors.textPrimary,
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: ZEEPREP_THEME.colors.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  academicRow: {
    flexDirection: "row",
    gap: 12,
  },
  submitBtn: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  successText: {
    fontSize: 14,
    color: ZEEPREP_THEME.colors.textPrimary,
    textAlign: "center",
    lineHeight: 20,
  },
  returnLoginBtn: {
    backgroundColor: ZEEPREP_THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  returnLoginBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
