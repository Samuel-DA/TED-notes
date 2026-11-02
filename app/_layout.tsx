// app/_layout.tsx
import { Href, Redirect, Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { ScreenBackground } from "@/components/ui/kit";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fingerprint, Heart, Lock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import FloatingChatButton from "../components/FloatingChatButton";
import { AppProvider, useApp } from "../context/AppContext";
import AppAlert from "../components/AppAlert";
import { getNotificationsModule, type NotificationResponse } from "../services/notifications";

// 🚀 IMPORT AND EXECUTE IMMEDIATELY
import { enableScreens, enableFreeze } from 'react-native-screens';
enableScreens(true);
enableFreeze(true);

function SplashScreen() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <ScreenBackground style={styles.splash}>
      <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.splashMark}>
        <Heart size={30} color="#fff" fill="#fff" />
      </LinearGradient>
      <Text style={styles.splashTitle}>TED Space</Text>
      <ActivityIndicator color={t.accent} style={{ marginTop: 18 }} />
    </ScreenBackground>
  );
}

function NotificationNavigator() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let notificationSubscription: { remove: () => void } | null = null;
    let appStateSubscription: { remove: () => void } | null = null;

    const setup = async () => {
      if (Platform.OS === "web") return;
      const Notifications = await getNotificationsModule();
      if (!active || !Notifications) return;
      const open = (response: NotificationResponse | null) => {
        const route = response?.notification.request.content.data?.route;
        if (route === "chat") router.push("/chat");
        if (route === "plans") router.push("/(tabs)/TED_todos");
        if (route === "care") router.push("/(tabs)/Care");
        if (route === "care_support") router.push("/(tabs)/Care/support");
        if (route === "care_dates") router.push("/(tabs)/Care/dates");
        if (route === "care_period") router.push("/(tabs)/Care/period");
        if (route === "care_routine") router.push("/(tabs)/Care/routine" as Href);
        if (route === "care_voice") router.push("/(tabs)/Care/voice");
        if (route === "games") router.push("/(tabs)/Games");
        if (route === "home") router.push("/(tabs)/Home");
        if (response) {
          void Notifications.clearLastNotificationResponseAsync();
          void Notifications.setBadgeCountAsync(0);
        }
      };
      void Notifications.setBadgeCountAsync(0);
      void Notifications.getLastNotificationResponseAsync().then(open);
      notificationSubscription = Notifications.addNotificationResponseReceivedListener(open);
      appStateSubscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void Notifications.setBadgeCountAsync(0);
      });
    };
    void setup();
    return () => {
      active = false;
      notificationSubscription?.remove();
      appStateSubscription?.remove();
    };
  }, [router]);
  return null;
}

function RootNavigator() {
  const { loading, uid, pairId, partnerName, isLocked, authenticateBiometrics } = useApp();
  const pathname = usePathname();
  const t = useTheme();
  const styles = useStyles();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(t.bgSolid).catch(() => undefined);
  }, [t.bgSolid]);

  if (loading) return <SplashScreen />;

  const isAuthRoute = [
    "/Login",
    "/Register",
    "/Biometric",
    "/PairScreen",
    "/WaitingForPartner",
  ].includes(pathname) || pathname.includes("(auth)");

  if (!uid && !isAuthRoute) {
    return <Redirect href="/(auth)/Login" />;
  }

  if (uid && !pairId && !["/PairScreen", "/Register"].includes(pathname)) {
    return <Redirect href="/(auth)/PairScreen" />;
  }

  if (uid && pairId && !partnerName && pathname !== "/WaitingForPartner") {
    return <Redirect href="/(auth)/WaitingForPartner" />;
  }

  if (uid && pairId && partnerName && isAuthRoute) {
    return <Redirect href="/(tabs)/Home" />;
  }
  const shouldShowLock = isLocked && uid && pairId && partnerName && !isAuthRoute && Platform.OS !== "web";

  return (
    <>
      <StatusBar style={t.statusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bgSolid }, animation: "fade_from_bottom" }}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="(auth)/Login" options={{ animation: "fade" }} />
        <Stack.Screen name="(auth)/Register" />
        <Stack.Screen name="(auth)/Biometric" />
        <Stack.Screen name="(auth)/PairScreen" />
        <Stack.Screen name="(auth)/WaitingForPartner" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="chat" options={{ animation: "slide_from_right" }} />
      </Stack>

      {pairId && partnerName && !pathname.endsWith("/chat") && !shouldShowLock && <FloatingChatButton />}
      {shouldShowLock && (
        <ScreenBackground style={styles.lockOverlay}>
          <SafeAreaView style={styles.lockSafe}>
            <View style={styles.lockBox}>
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lockIconBox}>
                <Heart size={34} color="#fff" fill="#fff" />
                <View style={styles.miniLock}><Lock size={12} color={t.plum} /></View>
              </LinearGradient>
              <Text style={styles.lockTitle}>TED Space is locked</Text>
              <Text style={styles.lockSubtitle}>Your conversations and shared moments stay private. Unlock to come back in.</Text>
              <Pressable onPress={authenticateBiometrics} style={({ pressed }) => [styles.lockButton, pressed && { transform: [{ scale: 0.97 }] }]}>
                <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Fingerprint color="#fff" size={20} />
                <Text style={styles.lockButtonText}>Unlock</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </ScreenBackground>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <NotificationNavigator />
        <RootNavigator />
        <AppAlert />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const useStyles = makeStyles((t) => ({
  splash: { alignItems: "center", justifyContent: "center" },
  splashMark: { width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", ...t.shadowLg },
  splashTitle: { color: t.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 16 },
  lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20 },
  lockSafe: { flex: 1, justifyContent: "center", alignItems: "center" },
  lockBox: { alignItems: "center", padding: 24 },
  lockIconBox: { width: 88, height: 88, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 26, ...t.shadowLg },
  miniLock: { position: "absolute", right: -4, bottom: -4, width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: t.bgSolid },
  lockTitle: { color: t.text, fontSize: 25, fontWeight: "800", marginBottom: 8, letterSpacing: -0.6 },
  lockSubtitle: { color: t.textSecondary, fontSize: 14.5, textAlign: "center", marginBottom: 34, paddingHorizontal: 28, lineHeight: 21 },
  lockButton: { height: 54, paddingHorizontal: 34, borderRadius: 18, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 9 },
  lockButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
}));
