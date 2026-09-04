import React, { useState, useEffect, useRef } from "react";
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
  Modal,
  useWindowDimensions,
  Keyboard,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getUserByLoginId, getUserProfile } from "../../services/firestore";
import { useAuthStore } from "../../stores/auth-store";
import { ZEEPREP_THEME } from "../../constants/theme";
import {
  LogIn,
  Eye,
  EyeOff,
  UserCheck,
  GraduationCap,
  X,
  Mail,
  Check,
  Lock,
} from "lucide-react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Polygon,
} from "react-native-svg";
import { AnimatedExamIllustration } from "../../components/AnimatedExamIllustration";

function ZeePrepLogoSvg({ size = 42 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 512 512" style={{ width: "100%", height: "100%" }}>
        <Defs>
          <LinearGradient id="zpBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#4338CA" />
            <Stop offset="100%" stopColor="#3730A3" />
          </LinearGradient>
          <LinearGradient id="zpGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="50%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="zpSparkle" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E0E7FF" />
          </LinearGradient>
        </Defs>

        {/* Background Badge Shield */}
        <Rect x="32" y="32" width="448" height="448" rx="112" fill="url(#zpBg)" />
        <Rect
          x="40"
          y="40"
          width="432"
          height="432"
          rx="104"
          fill="none"
          stroke="#818CF8"
          strokeWidth="10"
          strokeOpacity={0.4}
        />

        {/* Cap Roof */}
        <Polygon points="256,112 400,184 256,256 112,184" fill="url(#zpGold)" />

        {/* Cap Base */}
        <Path
          d="M168,218 L168,280 C168,320 206,344 256,344 C306,344 344,320 344,280 L344,218 L256,262 Z"
          fill="#FFFFFF"
          fillOpacity={0.95}
        />

        {/* Zee Z Stroke */}
        <Path
          d="M200,168 L312,168 L224,248 L312,248"
          fill="none"
          stroke="#1E1B4B"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Golden Academic Distinction Seal */}
        <Circle cx="392" cy="144" r="22" fill="url(#zpGold)" />
        <Circle cx="392" cy="144" r="16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity={0.8} />
        <Path d="M386 144 L390 148 L398 140" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 360;
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const [activeTab, setActiveTab] = useState<"teacher" | "student">("teacher");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormActive, setIsFormActive] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Focus States for instant highlight
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const identifierInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter both your ID/Email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      let emailToAuth = identifier.trim();

      // If user provided a Login ID instead of email, resolve it
      if (!identifier.includes("@")) {
        const profile = await getUserByLoginId(identifier.trim());
        if (!profile || !profile.email) {
          setErrorMessage(
            `No account found with Login ID "${identifier}". Please verify or use your email.`
          );
          setLoading(false);
          return;
        }
        emailToAuth = profile.email;
      }

      // Authenticate with Firebase
      const cred = await signInWithEmailAndPassword(auth, emailToAuth, password);

      if (cred.user) {
        const userProf = await getUserProfile(cred.user.uid);
        if (userProf) {
          setUser(userProf);
          if (userProf.role === "superadmin" || userProf.role === "admin") {
            router.replace("/(superadmin)" as any);
          } else if (userProf.role === "teacher") {
            router.replace("/(teacher)" as any);
          } else {
            router.replace("/(tabs)" as any);
          }
        } else {
          router.replace("/(tabs)" as any);
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      let msg = "Failed to sign in. Please verify your credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        msg = "Invalid password or ID. Please check your credentials.";
      } else if (error.code === "auth/user-not-found") {
        msg = "No account registered with this email or ID.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please try again shortly.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderFormCard = () => (
    <View style={[styles.card, isSmallScreen && { padding: 14, borderRadius: 16 }]}>
      {/* 1. Role Selection Tabs (Pill Grid) */}
      <View style={styles.roleTabGrid}>
        <TouchableOpacity
          style={[
            styles.roleTab,
            activeTab === "teacher" && styles.roleTabActiveTeacher,
          ]}
          onPress={() => {
            setActiveTab("teacher");
            setErrorMessage("");
          }}
          activeOpacity={0.85}
        >
          <UserCheck
            size={16}
            color={activeTab === "teacher" ? "#4F46E5" : "#64748B"}
          />
          <Text
            style={[
              styles.roleTabText,
              activeTab === "teacher" && styles.roleTabTextActiveTeacher,
            ]}
          >
            Teacher Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleTab,
            activeTab === "student" && styles.roleTabActiveStudent,
          ]}
          onPress={() => {
            setActiveTab("student");
            setErrorMessage("");
          }}
          activeOpacity={0.85}
        >
          <GraduationCap
            size={16}
            color={activeTab === "student" ? "#7C3AED" : "#64748B"}
          />
          <Text
            style={[
              styles.roleTabText,
              activeTab === "student" && styles.roleTabTextActiveStudent,
            ]}
          >
            Student Login
          </Text>
        </TouchableOpacity>
      </View>

      {/* Demo Credentials Quick Switcher */}
      <View style={{ marginBottom: 14, backgroundColor: "#F8FAFC", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" }}>
        <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#475569", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>
          ⚡ 1-Tap Demo Credentials (Class 11 Math & Faculty)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[
              { label: "Class 11 - 1", id: "ZP-STU-1101", pass: "Password@123", role: "student" as const },
              { label: "Class 11 - 2", id: "ZP-STU-1102", pass: "Password@123", role: "student" as const },
              { label: "Class 11 - 3", id: "ZP-STU-1103", pass: "Password@123", role: "student" as const },
              { label: "Class 11 - 4", id: "ZP-STU-1104", pass: "Password@123", role: "student" as const },
              { label: "PA1 SuperAdmin & Faculty", id: "pa1@skillizee.io", pass: "787700", role: "teacher" as const },
            ].map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={{
                  backgroundColor: identifier === acc.id ? (acc.role === "teacher" ? "#4F46E5" : "#7C3AED") : "#FFFFFF",
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: identifier === acc.id ? "transparent" : "#CBD5E1",
                }}
                onPress={() => {
                  setActiveTab(acc.role);
                  setIdentifier(acc.id);
                  setPassword(acc.pass);
                  setErrorMessage("");
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: identifier === acc.id ? "#FFFFFF" : "#1E293B",
                  }}
                >
                  {acc.label}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: identifier === acc.id ? "#E0E7FF" : "#64748B",
                  }}
                >
                  {acc.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 2. Portal Title & Instruction Subtitle */}
      <View style={styles.cardHeaderArea}>
        <Text style={styles.cardTitle}>
          {activeTab === "teacher" ? "Teacher Portal Login" : "Student Portal Login"}
        </Text>
        <Text style={styles.cardSub}>
          {activeTab === "teacher"
            ? "Sign in with your email or Login ID (e.g. ZP-TCH-7K4M92)"
            : "Sign in with your email or Login ID (e.g. ZP-STU-1101)"}
        </Text>
      </View>

      {/* Error Message Banner */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* 3. Input: LOGIN ID OR EMAIL */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>LOGIN ID OR EMAIL</Text>
        <Pressable
          style={[
            styles.inputWrapper,
            isIdentifierFocused && styles.inputWrapperFocused,
          ]}
          onPress={() => identifierInputRef.current?.focus()}
        >
          <Mail size={16} color={isIdentifierFocused ? "#4F46E5" : "#94A3B8"} style={{ marginRight: 10 }} />
          <TextInput
            ref={identifierInputRef}
            style={[
              styles.input,
              Platform.OS === "web" && ({ outlineStyle: "none", cursor: "text" } as any),
            ]}
            placeholder={
              activeTab === "teacher"
                ? "teacher@school.com or Login ID"
                : "demostudent1@zeeprep.com or Login ID"
            }
            placeholderTextColor="#94A3B8"
            value={identifier}
            onChangeText={setIdentifier}
            onFocus={() => {
              setIsIdentifierFocused(true);
              setIsFormActive(true);
            }}
            onBlur={() => setIsIdentifierFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </Pressable>
      </View>

      {/* 4. Input: PASSWORD */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>PASSWORD</Text>
        <Pressable
          style={[
            styles.inputWrapper,
            isPasswordFocused && styles.inputWrapperFocused,
          ]}
          onPress={() => passwordInputRef.current?.focus()}
        >
          <Lock size={16} color={isPasswordFocused ? "#4F46E5" : "#94A3B8"} style={{ marginRight: 10 }} />
          <TextInput
            ref={passwordInputRef}
            style={[
              styles.input,
              Platform.OS === "web" && ({ outlineStyle: "none", cursor: "text" } as any),
            ]}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => {
              setIsPasswordFocused(true);
              setIsFormActive(true);
            }}
            onBlur={() => setIsPasswordFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={18} color="#94A3B8" />
            ) : (
              <Eye size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </Pressable>
      </View>

      {/* 5. Remember Me Checkbox & Forgot Password Link */}
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.rememberMeGroup}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.8}
        >
          <View style={[styles.customCheckbox, rememberMe && styles.customCheckboxChecked]}>
            {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.rememberMeText}>Remember me for 30 days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setForgotEmail(identifier.includes("@") ? identifier : "");
            setShowForgotModal(true);
            setForgotSuccess(false);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotLink}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Primary Action Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          activeTab === "teacher" ? styles.submitBtnTeacher : styles.submitBtnStudent,
          loading && styles.submitButtonDisabled,
        ]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            Log In as {activeTab === "teacher" ? "Teacher" : "Student"}
          </Text>
        )}
      </TouchableOpacity>

      {/* 7. Bottom Registration Banner & Outlined Button */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerPrompt}>
          {activeTab === "teacher" ? "New teacher? Create your account" : "New student? Create your account"}
        </Text>
        <TouchableOpacity
          style={styles.registerOutlineBtn}
          onPress={() => router.push("/(auth)/register" as any)}
          activeOpacity={0.75}
        >
          <Text style={styles.registerOutlineBtnText}>
            Register as {activeTab === "teacher" ? "Teacher" : "Student"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // DESKTOP WEBSITE 50/50 SPLIT LAYOUT
  // ==========================================
  if (isDesktopWeb) {
    return (
      <View style={styles.desktopLayoutRoot}>
        {/* Left Side: Clean Gray Background with Animated Exam Illustration */}
        <View style={styles.desktopLeftCol}>
          <View style={styles.illustrationWrapper}>
            <AnimatedExamIllustration isFormActive={isFormActive} />
          </View>
        </View>

        {/* Right Side: Centered Login Card with Top ZeePrep Branding */}
        <ScrollView
          style={styles.desktopRightCol}
          contentContainerStyle={styles.desktopRightColContent}
          keyboardShouldPersistTaps="handled"
        >
            <View
              style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" } as any}
              {...(Platform.OS === "web" ? {
                onMouseEnter: () => setIsFormActive(true),
                onMouseLeave: () => setIsFormActive(false),
              } : {})}
            >
            {/* Top Brand Logo Header */}
            <View style={styles.desktopBrandHeader}>
              <View style={styles.brandTitleRow}>
                <ZeePrepLogoSvg size={44} />
                <View style={styles.brandTextGroup}>
                  <View style={styles.brandNameRow}>
                    <Text style={styles.brandZee}>Zee</Text>
                    <Text style={styles.brandPrep}>Prep</Text>
                  </View>
                  <Text style={styles.brandTagline}>SMART LMS PLATFORM</Text>
                </View>
              </View>
              <Text style={styles.brandPortalSub}>
                Intelligent Productivity & Diagnostic Portal
              </Text>
            </View>

            {/* Login Card Component */}
            {renderFormCard()}
          </View>
        </ScrollView>

        {/* Forgot Password Modal */}
        <Modal visible={showForgotModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                  <X size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              {forgotSuccess ? (
                <View style={styles.forgotSuccessBox}>
                  <Text style={styles.forgotSuccessText}>
                    Password reset link sent! Check your email inbox.
                  </Text>
                  <TouchableOpacity
                    style={styles.closeForgotBtn}
                    onPress={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                    }}
                  >
                    <Text style={styles.closeForgotBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.modalSub}>
                    Enter your registered email address below to receive password reset instructions.
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color="#64748B" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="teacher@school.com"
                      placeholderTextColor="#94A3B8"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.sendResetBtn}
                    onPress={() => setForgotSuccess(true)}
                  >
                    <Text style={styles.sendResetBtnText}>Send Reset Link</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ==========================================
  // MOBILE / NATIVE SINGLE-COLUMN LAYOUT (FOR APK)
  // ==========================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isSmallScreen ? 10 : 16,
            paddingVertical: 16,
            paddingBottom: isKeyboardVisible ? (Platform.OS === "android" ? 180 : 120) : 32,
            alignItems: "center",
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 440 }}>
          {/* Top Brand Logo Header */}
          <View style={[styles.header, isKeyboardVisible && { marginBottom: 12 }]}>
            <View style={styles.brandTitleRow}>
              <ZeePrepLogoSvg size={38} />
              <View style={styles.brandTextGroup}>
                <View style={styles.brandNameRow}>
                  <Text style={styles.brandZee}>Zee</Text>
                  <Text style={styles.brandPrep}>Prep</Text>
                </View>
                <Text style={styles.brandTagline}>SMART LMS PLATFORM</Text>
              </View>
            </View>
            <Text style={styles.brandPortalSub}>
              Intelligent Productivity & Diagnostic Portal
            </Text>

            {!isKeyboardVisible ? (
              <View style={{ width: "100%", alignItems: "center", justifyContent: "center", alignSelf: "center", marginVertical: 6 }}>
                <AnimatedExamIllustration isFormActive={isFormActive} />
              </View>
            ) : null}
          </View>

          {/* Form Card */}
          {renderFormCard()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} ZeePrep. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Connected Backend: zeeprep01 (Shared Production)
          </Text>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {forgotSuccess ? (
              <View style={styles.forgotSuccessBox}>
                <Text style={styles.forgotSuccessText}>
                  Password reset link sent! Check your inbox.
                </Text>
                <TouchableOpacity
                  style={styles.closeForgotBtn}
                  onPress={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                >
                  <Text style={styles.closeForgotBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSub}>
                  Enter your registered email address below to receive password reset instructions.
                </Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="teacher@school.com"
                    placeholderTextColor="#94A3B8"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity
                  style={styles.sendResetBtn}
                  onPress={() => setForgotSuccess(true)}
                >
                  <Text style={styles.sendResetBtnText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Mobile / Native Root
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  // 50/50 Desktop Layout
  desktopLayoutRoot: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100vh" as any,
    backgroundColor: "#FFFFFF",
  },
  desktopLeftCol: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  illustrationWrapper: {
    width: "100%",
    maxWidth: 580,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopRightCol: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  desktopRightColContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  // Brand Logo Header Elements
  desktopBrandHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandTextGroup: {
    justifyContent: "center",
  },
  brandNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandZee: {
    fontSize: 26,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: -0.5,
  },
  brandPrep: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: -2,
  },
  brandPortalSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },

  // Card Container
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },

  // Role Tab Selector
  roleTabGrid: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  roleTabActiveTeacher: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  roleTabActiveStudent: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
  },
  roleTabTextActiveTeacher: {
    color: "#4F46E5",
    fontWeight: "800",
  },
  roleTabTextActiveStudent: {
    color: "#7C3AED",
    fontWeight: "800",
  },

  // Card Header Area
  cardHeaderArea: {
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  cardSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },

  // Error Banner
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    minHeight: 52,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: "#0F172A",
    fontWeight: "600",
    paddingVertical: 0,
    height: 48,
    textAlignVertical: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  eyeBtn: {
    padding: 6,
  },

  // Options Row: Checkbox & Forgot Password
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 2,
  },
  rememberMeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  customCheckboxChecked: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  rememberMeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  // Submit Buttons
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  submitBtnTeacher: {
    backgroundColor: "#4F46E5",
  },
  submitBtnStudent: {
    backgroundColor: "#7C3AED",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  // Bottom Register
  registerContainer: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
    gap: 8,
  },
  registerPrompt: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  registerOutlineBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    width: "100%",
    alignItems: "center",
  },
  registerOutlineBtnText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Mobile Footer
  footer: {
    marginTop: 20,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  footerSubtext: {
    fontSize: 10,
    color: "#CBD5E1",
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 18,
  },
  sendResetBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  sendResetBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  forgotSuccessBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  forgotSuccessText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "700",
    textAlign: "center",
  },
  closeForgotBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeForgotBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
