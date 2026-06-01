// app/_layout.tsx
import { Stack, usePathname } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const { loading, uid, pairId, partnerName } = useApp();
  const pathname = usePathname();

  if (loading) return <SplashScreen />;

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
      <Stack
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Tabs root */}
        <Stack.Screen name="(tabs)" />

        {/* Auth */}
        <Stack.Screen name="(auth)/Login" />
        <Stack.Screen name="(auth)/Register" />
        <Stack.Screen name="(auth)/Biometric" />
        <Stack.Screen name="(auth)/PairScreen" />
        <Stack.Screen name="(auth)/WaitingForPartner" />
      </Stack>

      {/* Floating chat button only when paired */}
      {pairId && partnerName && pathname !== "/chat" && <FloatingChatButton />}
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
});
