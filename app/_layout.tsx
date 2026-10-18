// app/_layout.tsx
import { Href, Redirect, Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
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
  return (
    <SafeAreaView style={styles.splashContainer}>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.splashText}>Loading your space…</Text>
    </SafeAreaView>
  );
}

function NotificationNavigator() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let notificationSubscription: { remove: () => void } | null = null;
    let appStateSubscription: { remove: () => void } | null = null;

    const setup = async () => {
      const Notifications = await getNotificationsModule();
      if (!active || !Notifications) return;
      const open = (response: NotificationResponse | null) => {
        const route = response?.notification.request.content.data?.route;
        if (route === "chat") router.push("/(tabs)/chat");
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

  let initialRoute: string;
  if (!uid) {
    initialRoute = "(auth)/Login";
  } else if (!pairId) {
    initialRoute = "(auth)/PairScreen";
  } else if (!partnerName) {
    initialRoute = "(auth)/WaitingForPartner";
  } else {
    initialRoute = "(tabs)";
  }

  return (
    <>
      {shouldShowLock ? (
        <LinearGradient colors={["#16121F", "#3B223F", "#71364F"]} style={styles.lockContainer}>
          <SafeAreaView style={styles.lockSafe}>
          <View style={styles.lockBox}>
            <View style={styles.lockIconBox}>
              <Heart size={34} color="#fff" fill="#fff" />
              <View style={styles.miniLock}><Lock size={12} color="#5B2E75" /></View>
            </View>
            <Text style={styles.lockTitle}>TED Space Locked</Text>
            <Text style={styles.lockSubtitle}>Your conversations and shared moments are private. Unlock to come back in.</Text>
            <TouchableOpacity onPress={authenticateBiometrics} style={styles.lockButton}>
              <Fingerprint color="#fff" size={20} />
              <Text style={styles.lockButtonText}>Unlock securely</Text>
            </TouchableOpacity>
          </View>
          </SafeAreaView>
        </LinearGradient>
      ) : (
        <>
          <Stack
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)/Login" />
            <Stack.Screen name="(auth)/Register" />
            <Stack.Screen name="(auth)/Biometric" />
            <Stack.Screen name="(auth)/PairScreen" />
            <Stack.Screen name="(auth)/WaitingForPartner" />
          </Stack>

          {pairId && partnerName && pathname !== "/chat" && pathname !== "/TED_todos" && <FloatingChatButton />}
        </>
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
  },
  splashText: {
    marginTop: 16,
    fontSize: 18,
    color: "#4f46e5",
    fontWeight: "600",
  },
  lockContainer: {
    flex: 1,
  },
  lockSafe: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockBox: {
    alignItems: "center",
    padding: 24,
  },
  lockIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  miniLock: { position: "absolute", right: 3, bottom: 3, width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  lockTitle: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "800", 
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  lockSubtitle: { 
    color: "#D6C9DC",
    fontSize: 14, 
    textAlign: "center", 
    marginBottom: 36, 
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  lockButton: {
    backgroundColor: "#E85D75",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lockButtonText: { 
    color: "#fff",
    fontWeight: "700", 
    fontSize: 15,
  },
});
