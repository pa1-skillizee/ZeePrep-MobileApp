import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../stores/auth-store";
import { View, ActivityIndicator, LogBox } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initAuthListener } from "../services/auth";
import { ZEEPREP_THEME } from "../constants/theme";
import * as SplashScreen from "expo-splash-screen";

import { MobileWebShell } from "../components/MobileWebShell";
import { ZeePrepLaunchScreen } from "../components/ZeePrepLaunchScreen";
import { ZeePrepAlertModal } from "../components/ZeePrepAlertModal";

import { configureScreenSecurity } from "../utils/security-helper";

// Suppress non-critical warnings in production
LogBox.ignoreLogs(["Setting a timer", "AsyncStorage"]);

// Prevent splash screen from auto-hiding during initialization
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

export default function RootLayout() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [showLaunchAnim, setShowLaunchAnim] = useState(true);

  // Dynamically configure Screen Security based on User Role (SuperAdmin vs Others)
  useEffect(() => {
    configureScreenSecurity(user?.role);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "ZeePrep — Smart LMS & NTA CBT Prep Platform";
    }
  }, [user?.role]);

  // Initialize Firebase auth listener + safety timeout
  useEffect(() => {
    const unsub = initAuthListener();

    // CRITICAL: Force isLoading to false after 3s max to prevent ANR
    const safetyTimer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn("ZeePrep: Auth loading timeout, forcing ready state");
        useAuthStore.setState({ isLoading: false });
      }
    }, 3000);

    return () => {
      clearTimeout(safetyTimer);
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // CRITICAL: Hide native splash screen as soon as isLoading resolves
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Route protection based on auth state
  useEffect(() => {
    if (isLoading || showLaunchAnim) return;
    if (!segments || !segments[0]) return;

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === "(auth)";

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login" as any);
      }
      return;
    }

    if (user && inAuthGroup) {
      if (user.role === "superadmin") router.replace("/(superadmin)" as any);
      else if (user.role === "admin") router.replace("/(admin)" as any);
      else if (user.role === "teacher") router.replace("/(teacher)" as any);
      else router.replace("/(tabs)" as any);
      return;
    }

    // Role-based access protection
    if (user) {
      if (user.role === "student") {
        if (currentSegment === "(teacher)" || currentSegment === "(admin)" || currentSegment === "(superadmin)") {
          router.replace("/(tabs)" as any);
        }
      } else if (user.role === "teacher") {
        if (currentSegment === "(superadmin)") {
          router.replace("/(teacher)" as any);
        }
      }
    }
  }, [isAuthenticated, isLoading, showLaunchAnim, user, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <MobileWebShell>
        <StatusBar hidden={true} style="dark" />
        {showLaunchAnim ? (
          <ZeePrepLaunchScreen onComplete={() => setShowLaunchAnim(false)} />
        ) : (
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(teacher)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(superadmin)" />
            <Stack.Screen name="exam/[id]" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="results/[id]" />
          </Stack>
        )}
        <ZeePrepAlertModal />
      </MobileWebShell>
    </QueryClientProvider>
  );
}
