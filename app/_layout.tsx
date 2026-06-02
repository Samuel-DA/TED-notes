// app/_layout.tsx
import { Stack, usePathname } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native"; 
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock } from "lucide-react-native"; 
import FloatingChatButton from "../components/FloatingChatButton";
import { AppProvider, useApp } from "../context/AppContext";
import AppAlert from "../components/AppAlert";

function SplashScreen() {
  return (
    <SafeAreaView style={styles.splashContainer}>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.splashText}>Loading your space…</Text>
    </SafeAreaView>
  );
}

function RootNavigator() {
  const { loading, uid, pairId, partnerName, isLocked, authenticateBiometrics } = useApp();
  const pathname = usePathname();

  if (loading) return <SplashScreen />;

  const isAuthRoute = pathname.includes("(auth)") || pathname === "/Login" || pathname === "/Register" || pathname === "/Biometric";
  const shouldShowLock = isLocked && uid && pairId && partnerName && !isAuthRoute && Platform.OS !== "ios";

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
        <SafeAreaView style={styles.lockContainer}>
          <View style={styles.lockBox}>
            <View style={styles.lockIconBox}>
              <Lock size={40} color="#fff" />
            </View>
            <Text style={styles.lockTitle}>TED Space Locked</Text>
            <Text style={styles.lockSubtitle}>Your shared diary is secure. Unlock to continue.</Text>
            <TouchableOpacity onPress={authenticateBiometrics} style={styles.lockButton}>
              <Text style={styles.lockButtonText}>Unlock with Biometrics</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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

          {pairId && partnerName && pathname !== "/chat" && <FloatingChatButton />}
        </>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
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
    backgroundColor: "#6366f1",
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
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  lockTitle: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "800", 
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  lockSubtitle: { 
    color: "#e0e7ff", 
    fontSize: 14, 
    textAlign: "center", 
    marginBottom: 36, 
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  lockButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lockButtonText: { 
    color: "#6366f1", 
    fontWeight: "700", 
    fontSize: 15,
  },
});