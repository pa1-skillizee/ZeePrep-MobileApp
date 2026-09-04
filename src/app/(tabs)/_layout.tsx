import React from "react";
import { Tabs } from "expo-router";
import { LayoutDashboard, FileText, FileBarChart, BookOpen, User } from "lucide-react-native";
import { Platform, useWindowDimensions, View } from "react-native";
import { ZEEPREP_THEME } from "../../constants/theme";

import { useResponsive } from "../../hooks/useResponsive";

const AnimatedTabIcon = ({
  Icon,
  color,
  focused,
  size,
}: {
  Icon: any;
  color: any;
  focused: boolean;
  size?: number;
}) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 14,
        backgroundColor: focused ? "#EEF2FF" : "transparent",
        transform: [{ scale: focused ? 1.08 : 1 }],
      }}
    >
      <Icon color={color} size={size || 20} strokeWidth={focused ? 2.3 : 1.8} />
    </View>
  );
};

export default function TabsLayout() {
  const { isLandscape } = useResponsive();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ZEEPREP_THEME.colors.primary,
        tabBarInactiveTintColor: ZEEPREP_THEME.colors.textSecondary,
        tabBarStyle: isDesktopWeb
          ? { display: "none" }
          : {
              backgroundColor: ZEEPREP_THEME.colors.surface,
              borderTopColor: ZEEPREP_THEME.colors.border,
              borderTopWidth: 1,
              height: isLandscape ? 52 : (Platform.OS === "ios" ? 88 : 68),
              paddingBottom: isLandscape ? 4 : (Platform.OS === "ios" ? 28 : 10),
              paddingTop: isLandscape ? 4 : 8,
            },
        tabBarLabelStyle: {
          fontSize: isLandscape ? 9 : 10,
          fontWeight: "700",
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={LayoutDashboard} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={FileText} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={FileBarChart} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={BookOpen} color={color} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={User} color={color} size={size} focused={focused} />
          ),
        }}
      />

      {/* Auxiliary Student Screens Hidden from Bottom Tab Bar */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="ai-tutor"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
