import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuthStore, isSuperAdminUser } from "../stores/auth-store";
import { logoutUser } from "../services/auth";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Polygon,
} from "react-native-svg";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  BookOpen,
  User,
  Trophy,
  Bot,
  Activity,
  Users,
  Layers,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  Shield,
  Menu,
  X,
  Award,
  Bell,
  ChevronDown,
  FileSpreadsheet,
  Brain,
  Check,
  UserCheck,
  CheckCircle2,
  Clock,
  BrainCircuit,
  Trash2,
  ArrowRight,
} from "lucide-react-native";
import { AICopilotModal } from "./AICopilotModal";
import {
  subscribeToTeacherNotifications,
  markNotificationAsRead,
  deleteNotification,
  type TeacherResourceNotification,
} from "../services/firestore";

interface WebDesktopShellProps {
  children?: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

function ZeePrepLogoSvg({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 512 512" style={{ width: "100%", height: "100%" }}>
        <Defs>
          <LinearGradient id="zpBgWeb" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4F46E5" />
            <Stop offset="50%" stopColor="#4338CA" />
            <Stop offset="100%" stopColor="#3730A3" />
          </LinearGradient>
          <LinearGradient id="zpGoldWeb" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="50%" stopColor="#F59E0B" />
          </LinearGradient>
          <LinearGradient id="zpSparkleWeb" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E0E7FF" />
          </LinearGradient>
        </Defs>
        <Rect x="32" y="32" width="448" height="448" rx="112" fill="url(#zpBgWeb)" />
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
        <Polygon points="256,112 400,184 256,256 112,184" fill="url(#zpGoldWeb)" />
        <Path
          d="M168,218 L168,280 C168,320 206,344 256,344 C306,344 344,320 344,280 L344,218 L256,262 Z"
          fill="#FFFFFF"
          fillOpacity={0.95}
        />
        <Path
          d="M200,168 L312,168 L224,248 L312,248"
          fill="none"
          stroke="#1E1B4B"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Golden Academic Distinction Seal */}
        <Circle cx="392" cy="144" r="22" fill="url(#zpGoldWeb)" />
        <Circle cx="392" cy="144" r="16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity={0.8} />
        <Path d="M386 144 L390 148 L398 140" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(tabs)", icon: LayoutDashboard },
  { label: "My Exams", href: "/(tabs)/exams", icon: Brain },
  { label: "Study Resources", href: "/(tabs)/resources", icon: Layers },
  { label: "Leaderboard", href: "/(tabs)/leaderboard", icon: Trophy },
  { label: "Reports", href: "/(tabs)/reports", icon: FileText },
  { label: "Global Report", href: "/(tabs)/reports", icon: Award },
  { label: "Profile", href: "/(tabs)/profile", icon: User },
];

const teacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(teacher)", icon: LayoutDashboard },
  { label: "Live Monitor", href: "/(teacher)/submissions", icon: Activity },
  { label: "Question Bank", href: "/(teacher)/question-bank", icon: BookOpen },
  { label: "Active Exams", href: "/(teacher)/exams", icon: Brain },
  { label: "Study Resources", href: "/(teacher)/resources", icon: Layers },
  { label: "Student Roster", href: "/(teacher)/roster", icon: Users },
  { label: "Leaderboard", href: "/(tabs)/leaderboard", icon: Trophy },
  { label: "Reports", href: "/(teacher)/reports", icon: FileText },
  { label: "Profile", href: "/(teacher)/profile", icon: User },
];

const superAdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(superadmin)", icon: LayoutDashboard },
  { label: "Live Monitor", href: "/(superadmin)/submissions", icon: Activity },
  { label: "User Control", href: "/(admin)/user-management", icon: Users },
  { label: "Classes & Hierarchy", href: "/(superadmin)/academic-hierarchy", icon: Layers },
  { label: "Question Bank", href: "/(superadmin)/question-bank", icon: FileSpreadsheet },
  { label: "Exams", href: "/(superadmin)/exams", icon: Brain },
  { label: "Study Resources", href: "/(superadmin)/resources", icon: Layers },
  { label: "Reports", href: "/(superadmin)/reports", icon: FileText },
  { label: "Analytics Hub", href: "/(superadmin)/analytics", icon: TrendingUp },
  { label: "Audit Logs", href: "/(superadmin)/audit-logs", icon: Activity },
  { label: "Settings", href: "/(superadmin)/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/(admin)", icon: LayoutDashboard },
  { label: "Live Monitor", href: "/(teacher)/submissions", icon: Activity },
  { label: "User Control", href: "/(admin)/user-management", icon: Users },
  { label: "Classes & Hierarchy", href: "/(admin)/academic-hierarchy", icon: Layers },
  { label: "Question Bank", href: "/(admin)/question-bank", icon: FileSpreadsheet },
  { label: "Exams", href: "/(superadmin)/exams", icon: Brain },
  { label: "Study Resources", href: "/(admin)/resources", icon: Layers },
  { label: "Reports", href: "/(admin)/reports", icon: FileText },
  { label: "Profile", href: "/(admin)/profile", icon: User },
];

export function WebDesktopShell({ children }: WebDesktopShellProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, viewMode, setViewMode } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [viewModeMenuOpen, setViewModeMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isTeacherOrAdmin =
      user.role === "teacher" ||
      user.role === "admin" ||
      user.role === "superadmin" ||
      viewMode === "teacher" ||
      viewMode === "superadmin";

    if (isTeacherOrAdmin) {
      const unsub = subscribeToTeacherNotifications(
        (notifs) => {
          const formatted = notifs.map((n) => {
            let relativeTime = "Just now";
            if (n.createdAt) {
              const diffMs = Date.now() - new Date(n.createdAt).getTime();
              const diffMins = Math.floor(diffMs / (1000 * 60));
              if (diffMins < 1) relativeTime = "Just now";
              else if (diffMins < 60) relativeTime = `${diffMins}m ago`;
              else {
                const diffHours = Math.floor(diffMins / 60);
                if (diffHours < 24) relativeTime = `${diffHours}h ago`;
                else relativeTime = `${Math.floor(diffHours / 24)}d ago`;
              }
            }

            return {
              id: n.id,
              title: n.title || `Resource Request: ${n.topic}`,
              description:
                n.message ||
                `${n.studentName} (Class ${n.grade || "10"}-${n.section || "A"}) requested study material for "${n.topic}" in ${n.subject || "Exam"}.`,
              time: relativeTime,
              type: "resource",
              read: Boolean(n.read),
              studentName: n.studentName,
              studentEmail: n.studentEmail,
              grade: n.grade,
              section: n.section,
              subject: n.subject,
              topic: n.topic,
            };
          });
          setNotifications(formatted);
        },
        user.role === "teacher" ? user.subject : undefined,
        user.role === "teacher" ? user.grade : undefined
      );
      return () => unsub();
    } else {
      // Default announcements for students
      setNotifications([
        {
          id: "std-1",
          title: "Exam Portal Active",
          description: "New diagnostic mock examinations and practice tests are live.",
          time: "Today",
          type: "exam",
          read: true,
        },
        {
          id: "std-2",
          title: "Study Material Available",
          description: "Your teachers regularly upload class revision notes and formulas.",
          time: "1d ago",
          type: "resource",
          read: true,
        },
      ]);
    }
  }, [isAuthenticated, user?.uid, user?.role, user?.subject, user?.grade, viewMode]);

  if (Platform.OS !== "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const isAuthScreen = pathname.includes("/(auth)") || pathname.includes("/login") || pathname.includes("/register");
  const isExamScreen = pathname.startsWith("/exam/");
  const isDesktop = width >= 860;

  if (isAuthScreen || !isAuthenticated || !user) {
    return (
      <View style={styles.webRoot}>
        {children}
      </View>
    );
  }

  const activeRole = isSuperAdminUser(user) ? (viewMode || "superadmin") : user.role;
  let navItems = studentNavItems;
  if (activeRole === "superadmin") {
    navItems = superAdminNavItems;
  } else if (activeRole === "admin") {
    navItems = adminNavItems;
  } else if (activeRole === "teacher") {
    navItems = teacherNavItems;
  }

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/(auth)/login" as any);
  };

  const handleSwitchViewMode = (newMode: "superadmin" | "teacher" | "student") => {
    setViewMode(newMode);
    setViewModeMenuOpen(false);
    if (newMode === "superadmin") router.replace("/(superadmin)" as any);
    else if (newMode === "teacher") router.replace("/(teacher)" as any);
    else router.replace("/(tabs)" as any);
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    for (const n of notifications) {
      if (!n.read && n.id) {
        await markNotificationAsRead(n.id).catch(() => {});
      }
    }
  };

  const clearAllNotifications = async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    for (const id of ids) {
      if (id) {
        await deleteNotification(id).catch(() => {});
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SA";

  const getRoleDisplayTitle = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "teacher":
        return "Teacher";
      case "student":
        return "Student";
      default:
        return "Admin";
    }
  };

  const isItemActive = (href: string) => {
    if (href === "/(tabs)") {
      return pathname === "/" || pathname === "/(tabs)";
    }
    if (href === "/(tabs)/exams") {
      return pathname === "/exams" || pathname === "/(tabs)/exams" || pathname.startsWith("/exam/");
    }
    if (href === "/(tabs)/resources") {
      return pathname === "/resources" || pathname === "/(tabs)/resources" || pathname.startsWith("/resource/");
    }
    if (href === "/(tabs)/reports") {
      return pathname === "/reports" || pathname === "/(tabs)/reports" || pathname.startsWith("/results/");
    }
    if (href === "/(tabs)/leaderboard") {
      return pathname === "/leaderboard" || pathname === "/(tabs)/leaderboard";
    }
    if (href === "/(tabs)/profile") {
      return pathname === "/profile" || pathname === "/(tabs)/profile";
    }
    if (href === "/(teacher)") {
      return pathname === "/(teacher)" || pathname === "/teacher";
    }
    if (href === "/(superadmin)") {
      return pathname === "/(superadmin)" || pathname === "/superadmin" || pathname === "/admin";
    }
    if (href === "/(admin)") {
      return pathname === "/(admin)" || pathname === "/admin";
    }
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <View style={styles.webRoot}>
      {/* 1. TOPBAR HEADER */}
      <View style={styles.topbar}>
        {/* Left: Brand Identity & Mobile Hamburger */}
        <View style={styles.topbarLeft}>
          {!isDesktop && (
            <TouchableOpacity
              style={styles.menuToggleBtn}
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
              activeOpacity={0.7}
            >
              {mobileMenuOpen ? <X size={20} color="#0F172A" /> : <Menu size={20} color="#0F172A" />}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.brandLogoBox}
            onPress={() => {
              if (activeRole === "superadmin") router.push("/(superadmin)");
              else if (activeRole === "teacher") router.push("/(teacher)");
              else router.push("/(tabs)");
            }}
            activeOpacity={0.85}
          >
            <ZeePrepLogoSvg size={30} />
            <View style={{ marginLeft: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.brandZee}>Zee</Text>
                <Text style={styles.brandPrep}>Prep</Text>
              </View>
              <Text style={styles.brandSub}>SMART LMS PLATFORM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Center: Global Search Bar (Desktop Only) */}
        {isDesktop && !isExamScreen && (
          <View style={styles.searchBarContainer}>
            <Search size={14} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Global search across exams, questions, topics, candidates..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* Right: Quick Action Controls, View Mode, Profile, Logout */}
        <View style={styles.topbarRight}>
          {/* AI Copilot Button */}
          <TouchableOpacity
            style={styles.aiTutorBtn}
            onPress={() => setCopilotOpen(true)}
            activeOpacity={0.8}
          >
            <Bot size={15} color="#FFFFFF" />
            <Text style={styles.aiTutorBtnText}>AI Copilot</Text>
          </TouchableOpacity>

          {/* Notifications Bell with Slide-Over Drawer Trigger */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => setNotificationsOpen(true)}
            activeOpacity={0.7}
          >
            <Bell size={16} color="#64748B" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Custom Themed Super Admin View Mode Switcher Dropdown */}
          {isSuperAdminUser(user) && (
            <View style={styles.viewModeContainer}>
              <Text style={styles.viewModeLabel}>VIEW MODE:</Text>
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  style={styles.customDropdownBtn}
                  onPress={() => setViewModeMenuOpen(!viewModeMenuOpen)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.customDropdownBtnText}>
                    {getRoleDisplayTitle(activeRole)}
                  </Text>
                  <ChevronDown
                    size={13}
                    color="#4F46E5"
                    style={{
                      transform: [{ rotate: viewModeMenuOpen ? "180deg" : "0deg" }],
                    }}
                  />
                </TouchableOpacity>

                {/* Themed Dropdown Popover */}
                {viewModeMenuOpen && (
                  <>
                    <Pressable
                      style={styles.dropdownBackdrop}
                      onPress={() => setViewModeMenuOpen(false)}
                    />
                    <View style={styles.customDropdownMenu}>
                      <View style={styles.dropdownHeaderBox}>
                        <Text style={styles.dropdownHeaderLabel}>SWITCH ROLE VIEW</Text>
                      </View>

                      {/* Super Admin Option */}
                      <TouchableOpacity
                        style={[
                          styles.dropdownMenuItem,
                          activeRole === "superadmin" && styles.dropdownMenuItemActive,
                        ]}
                        onPress={() => handleSwitchViewMode("superadmin")}
                        activeOpacity={0.85}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <View
                            style={[
                              styles.dropdownItemIconCircle,
                              { backgroundColor: "#EEF2FF" },
                            ]}
                          >
                            <Shield size={14} color="#4F46E5" />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.dropdownItemTitle,
                                activeRole === "superadmin" && styles.dropdownItemTitleActive,
                              ]}
                            >
                              Super Admin
                            </Text>
                            <Text style={styles.dropdownItemSubtitle}>Platform Command Center</Text>
                          </View>
                        </View>
                        {activeRole === "superadmin" && <Check size={16} color="#4F46E5" />}
                      </TouchableOpacity>

                      {/* Teacher Option */}
                      <TouchableOpacity
                        style={[
                          styles.dropdownMenuItem,
                          activeRole === "teacher" && styles.dropdownMenuItemActive,
                        ]}
                        onPress={() => handleSwitchViewMode("teacher")}
                        activeOpacity={0.85}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <View
                            style={[
                              styles.dropdownItemIconCircle,
                              { backgroundColor: "#ECFDF5" },
                            ]}
                          >
                            <UserCheck size={14} color="#059669" />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.dropdownItemTitle,
                                activeRole === "teacher" && styles.dropdownItemTitleActive,
                              ]}
                            >
                              Teacher
                            </Text>
                            <Text style={styles.dropdownItemSubtitle}>Exam & Question Authoring</Text>
                          </View>
                        </View>
                        {activeRole === "teacher" && <Check size={16} color="#059669" />}
                      </TouchableOpacity>

                      {/* Student Option */}
                      <TouchableOpacity
                        style={[
                          styles.dropdownMenuItem,
                          activeRole === "student" && styles.dropdownMenuItemActive,
                        ]}
                        onPress={() => handleSwitchViewMode("student")}
                        activeOpacity={0.85}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <View
                            style={[
                              styles.dropdownItemIconCircle,
                              { backgroundColor: "#EFF6FF" },
                            ]}
                          >
                            <GraduationCap size={14} color="#2563EB" />
                          </View>
                          <View>
                            <Text
                              style={[
                                styles.dropdownItemTitle,
                                activeRole === "student" && styles.dropdownItemTitleActive,
                              ]}
                            >
                              Student
                            </Text>
                            <Text style={styles.dropdownItemSubtitle}>Tests, Practice & Resources</Text>
                          </View>
                        </View>
                        {activeRole === "student" && <Check size={16} color="#2563EB" />}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {/* User Profile Capsule */}
          <View style={styles.userProfileCapsule}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitials}</Text>
            </View>
            <View style={styles.userMetaText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name || "Super Admin"}
              </Text>
              <View style={styles.userRoleBadgeWrapper}>
                <Text style={styles.userRoleBadge}>{activeRole.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Sign out"
            activeOpacity={0.7}
          >
            <LogOut size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. BODY: SIDEBAR + MAIN WEBSITE CONTENT */}
      <View style={styles.bodyLayout}>
        {/* Desktop Fixed Left Sidebar */}
        {isDesktop && !isExamScreen && (
          <View style={styles.sidebarWrapper}>
            <View style={styles.sidebarInner}>
              {/* Header Logo Badge matching original website */}
              <View style={styles.sidebarLogoHeader}>
                <View style={styles.sidebarLogoIconCircle}>
                  <GraduationCap size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.sidebarLogoTitle}>ZeePrep</Text>
              </View>

              {/* Navigation Items List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.navList}>
                  {navItems.map((item, idx) => {
                    const IconComp = item.icon;
                    const active = isItemActive(item.href);

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.navItem,
                          active ? styles.navItemActive : styles.navItemInactive,
                        ]}
                        onPress={() => router.push(item.href as any)}
                        activeOpacity={0.85}
                      >
                        <IconComp
                          size={18}
                          color={active ? "#FFFFFF" : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.navItemLabel,
                            active ? styles.navItemLabelActive : styles.navItemLabelInactive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.sidebarFooter}>
                <Text style={styles.sidebarVersionText}>ZEEPREP PLATFORM V2.5</Text>
              </View>
            </View>
          </View>
        )}

        {/* Mobile Slide-Out Menu for Small Browser Windows */}
        {!isDesktop && mobileMenuOpen && (
          <View style={styles.mobileNavOverlay}>
            <ScrollView style={styles.mobileNavCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={styles.sidebarSectionHeading}>MENU NAVIGATION</Text>
                <TouchableOpacity onPress={() => setMobileMenuOpen(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={styles.navList}>
                {navItems.map((item, idx) => {
                  const IconComp = item.icon;
                  const active = isItemActive(item.href);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.navItem, active && styles.navItemActive]}
                      onPress={() => {
                        setMobileMenuOpen(false);
                        router.push(item.href as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <IconComp size={18} color={active ? "#FFFFFF" : "#64748B"} />
                      <Text style={[styles.navItemLabel, active && styles.navItemLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Main Website Surface */}
        <View style={styles.mainContentSurface}>
          <div className="animate-page-entrance" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <View style={styles.contentContainer}>
              {children}
            </View>
          </div>
        </View>
      </View>

      {/* 3. RIGHT SLIDE-OVER NOTIFICATION DRAWER PANEL */}
      {notificationsOpen && (
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setNotificationsOpen(false)} />
          <View style={styles.drawerCard}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.drawerHeaderIcon}>
                  <Bell size={18} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.drawerTitle}>Notifications</Text>
                  <Text style={styles.drawerSubtitle}>
                    {unreadCount > 0 ? `${unreadCount} unread updates` : "All notifications read"}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={styles.drawerActionBtn}
                    onPress={markAllNotificationsRead}
                    accessibilityLabel="Mark all as read"
                  >
                    <CheckCircle2 size={16} color="#4F46E5" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.drawerCloseBtn}
                  onPress={() => setNotificationsOpen(false)}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications Content */}
            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              {notifications.length > 0 ? (
                <View style={{ gap: 10, paddingVertical: 12 }}>
                  {notifications.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.notificationItemCard,
                        !item.read && styles.notificationItemUnread,
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                        <View
                          style={[
                            styles.notifTypeIcon,
                            item.type === "exam" && { backgroundColor: "#EFF6FF" },
                            item.type === "ai" && { backgroundColor: "#FAF5FF" },
                            item.type === "resource" && { backgroundColor: "#ECFDF5" },
                          ]}
                        >
                          {item.type === "exam" && <Brain size={16} color="#2563EB" />}
                          {item.type === "ai" && <BrainCircuit size={16} color="#9333EA" />}
                          {item.type === "resource" && <BookOpen size={16} color="#059669" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={styles.notifTitle}>{item.title}</Text>
                            {!item.read && <View style={styles.unreadDot} />}
                          </View>
                          <Text style={styles.notifDesc}>{item.description}</Text>
                          {item.topic && (user?.role === "teacher" || viewMode === "teacher") ? (
                            <TouchableOpacity
                              style={{
                                marginTop: 8,
                                flexDirection: "row",
                                alignItems: "center",
                                alignSelf: "flex-start",
                                gap: 5,
                                backgroundColor: "#EEF2FF",
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 6,
                              }}
                              onPress={async () => {
                                if (item.id) await markNotificationAsRead(item.id);
                                setNotificationsOpen(false);
                                router.push("/(teacher)/resources" as any);
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: "700", color: "#4F46E5" }}>
                                Upload Material for "{item.topic}"
                              </Text>
                              <ArrowRight size={12} color="#4F46E5" />
                            </TouchableOpacity>
                          ) : null}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                            <Clock size={11} color="#94A3B8" />
                            <Text style={styles.notifTime}>{item.time}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.drawerEmptyState}>
                  <View style={styles.emptyBellIconBox}>
                    <Bell size={32} color="#94A3B8" />
                  </View>
                  <Text style={styles.emptyStateTitle}>All caught up!</Text>
                  <Text style={styles.emptyStateSub}>
                    You have no unread notifications or announcements right now.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Drawer Footer */}
            {notifications.length > 0 && (
              <View style={styles.drawerFooter}>
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={clearAllNotifications}
                  activeOpacity={0.8}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={styles.clearAllBtnText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* AI Copilot Interactive Modal */}
      <AICopilotModal isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: "100%",
    minHeight: "100vh" as any,
    backgroundColor: "#F4F5F9",
  },
  topbar: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 100,
  },
  topbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  brandLogoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandZee: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4F46E5",
    letterSpacing: -0.5,
  },
  brandPrep: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 8,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  searchBarContainer: {
    flex: 1,
    maxWidth: 420,
    marginHorizontal: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: "#0F172A",
    fontWeight: "500",
  },
  topbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiTutorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  aiTutorBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bellBtn: {
    position: "relative",
    padding: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  viewModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 6,
    position: "relative",
  },
  viewModeLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.4,
  },
  customDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  customDropdownBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  dropdownBackdrop: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  customDropdownMenu: {
    position: "absolute",
    top: 32,
    right: 0,
    minWidth: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    zIndex: 9999,
  },
  dropdownHeaderBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 4,
  },
  dropdownHeaderLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.6,
  },
  dropdownMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropdownMenuItemActive: {
    backgroundColor: "#F8FAFC",
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownItemIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  dropdownItemTitleActive: {
    fontWeight: "800",
    color: "#0F172A",
  },
  dropdownItemSubtitle: {
    fontSize: 9.5,
    color: "#94A3B8",
    fontWeight: "500",
  },
  userProfileCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userMetaText: {
    display: "flex",
  },
  userName: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  userRoleBadgeWrapper: {
    backgroundColor: "#EEF2FF",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: "flex-start",
    marginTop: 1,
  },
  userRoleBadge: {
    fontSize: 8,
    fontWeight: "800",
    color: "#4F46E5",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 20,
  },
  bodyLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarWrapper: {
    width: 230,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
    flexDirection: "column",
    flexShrink: 0,
    minHeight: "100%" as any,
  },
  sidebarInner: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 14,
    justifyContent: "space-between",
  },
  sidebarLogoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    marginBottom: 12,
  },
  sidebarLogoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sidebarLogoTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  sidebarSectionHeading: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  navList: {
    gap: 5,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: "#4F46E5",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  navItemInactive: {
    backgroundColor: "transparent",
  },
  navItemLabel: {
    fontSize: 13,
  },
  navItemLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  navItemLabelInactive: {
    color: "#475569",
    fontWeight: "700",
  },
  sidebarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarVersionText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
  },
  mobileNavOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    zIndex: 999,
    padding: 16,
  },
  mobileNavCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  mainContentSurface: {
    flex: 1,
    backgroundColor: "#F4F5F9",
    overflow: "hidden",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    // ZeePrep web proportions: cap content like the original site's max-w-7xl,
    // centered with desktop gutters, so pages don't stretch edge-to-edge on
    // wide screens. Native bypasses this shell entirely (Platform.OS check above).
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 28,
  },

  // SLIDE-OVER DRAWER STYLES
  drawerOverlay: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  drawerCard: {
    width: 360,
    maxWidth: "85vw" as any,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    display: "flex",
    flexDirection: "column",
    zIndex: 10001,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  drawerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  drawerActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  drawerCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  drawerBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  notificationItemUnread: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  notifTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },
  notifDesc: {
    fontSize: 11.5,
    color: "#475569",
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },
  drawerEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyBellIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EF4444",
  },
});
