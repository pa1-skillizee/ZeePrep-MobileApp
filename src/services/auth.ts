import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserByLoginId, getUserProfile, recordUserLoginAudit } from "./firestore";
import { useAuthStore } from "../stores/auth-store";
import type { User } from "../types";

export interface LoginResult {
  success: boolean;
  user?: User;
  errorMessage?: string;
}

/**
 * Fast, resilient public IP address resolver for student/teacher audit tracking.
 */
export async function fetchClientIpAddress(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) return String(data.ip).trim();
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }

  // Fallback 1: icanhazip.com
  try {
    const res2 = await fetch("https://icanhazip.com");
    if (res2.ok) {
      const ipText = (await res2.text()).trim();
      if (ipText && ipText.length < 50) return ipText;
    }
  } catch (e2) {
    // Ignore fallback failure
  }

  // Fallback 2: ipapi.co
  try {
    const res3 = await fetch("https://ipapi.co/json/");
    if (res3.ok) {
      const data3 = await res3.json();
      if (data3 && data3.ip) return String(data3.ip).trim();
    }
  } catch (e3) {
    // Ignore fallback failure
  }

  return "127.0.0.1";
}

export async function loginWithIdentifier(
  identifier: string,
  pass: string
): Promise<LoginResult> {
  const cleanIdentifier = identifier.trim();
  const cleanPass = pass.trim();

  if (!cleanIdentifier || !cleanPass) {
    return { success: false, errorMessage: "Please provide both ID/Email and password." };
  }

  try {
    let targetEmail = cleanIdentifier;

    // Check if identifier is a Login ID (e.g. ZP-STU-1002, ZP-TEA-101) or non-email string
    if (!cleanIdentifier.includes("@")) {
      const userFromLoginId = await getUserByLoginId(cleanIdentifier);
      if (userFromLoginId && userFromLoginId.email) {
        targetEmail = userFromLoginId.email;
      } else {
        return {
          success: false,
          errorMessage: "Invalid Login ID. Please verify your Student or Teacher ID.",
        };
      }
    }

    // Firebase Auth login
    const credential = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
    const uid = credential.user.uid;

    // Fetch authoritative profile from Firestore
    const profile = await getUserProfile(uid);

    if (!profile) {
      return {
        success: false,
        errorMessage: "User profile not found in ZeePrep database. Please contact school admin.",
      };
    }

    if (profile.status === "disabled" || profile.status === "rejected") {
      return {
        success: false,
        errorMessage: "Your account is disabled or rejected. Please contact school administration.",
      };
    }

    if (profile.status === "pending") {
      return {
        success: false,
        errorMessage: "Your account approval is pending administrator review.",
      };
    }

    // Resolve client IP and record audit trail asynchronously
    fetchClientIpAddress().then((ip) => {
      recordUserLoginAudit(profile, ip);
      // Update in-memory user object
      profile.lastLoginIp = ip;
      profile.lastLoginAt = new Date().toISOString();
    }).catch(() => {
      recordUserLoginAudit(profile, "Unknown IP");
    });

    // Set user in Zustand + SecureStore
    useAuthStore.getState().setUser(profile);
    return { success: true, user: profile };
  } catch (error: any) {
    console.error("Firebase Login Error:", error);
    let msg = "Failed to sign in. Please check network connection and credentials.";
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      msg = "Invalid password or credentials.";
    } else if (error.code === "auth/user-not-found") {
      msg = "No account found with these credentials.";
    } else if (error.code === "auth/too-many-requests") {
      msg = "Too many failed attempts. Please try again later.";
    } else if (error.code === "auth/network-request-failed") {
      msg = "Network connection failed. Please check your internet connection.";
    }
    return { success: false, errorMessage: msg };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.error("Firebase signout error:", e);
  }
  useAuthStore.getState().logout();
}

// Restore session listener — guards against wiping SecureStore session
export function initAuthListener() {
  let isFirstEvent = true;

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Firebase has a valid session — sync profile from Firestore
      isFirstEvent = false;
      try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.status === "active") {
          useAuthStore.getState().setUser(profile);
        }
        // If profile is inactive/missing, don't clear — let existing session stand
      } catch (err) {
        console.warn("ZeePrep: Failed to refresh profile from listener:", err);
        // Network error — keep existing SecureStore session intact
      }
    } else {
      // firebaseUser is null
      if (isFirstEvent) {
        // First event is always null before Firebase restores the token.
        // Do NOT wipe the SecureStore-restored session.
        isFirstEvent = false;
        return;
      }
      // Subsequent null = explicit sign-out or token expiry
      useAuthStore.getState().setUser(null);
    }
  });
}

// Send Password Reset Email via Firebase Auth
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: "Password reset link sent to your email address." };
  } catch (error: any) {
    console.error("Password reset error:", error);
    let msg = "Failed to send reset email. Please verify the email address.";
    if (error.code === "auth/user-not-found") {
      msg = "No account found with this email address.";
    } else if (error.code === "auth/invalid-email") {
      msg = "Invalid email format.";
    }
    return { success: false, message: msg };
  }
}

