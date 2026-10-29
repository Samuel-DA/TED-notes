// app/(auth)/WaitingForPartner.tsx
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";

export default function WaitingForPartner() {
  const router = useRouter();
  const { pairId, partnerName, loading } = useApp();
  const [redirected, setRedirected] = useState(false);

  // Pulsing animation
  const pulse = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  // Redirect once partner joins
  useEffect(() => {
    if (!loading && partnerName && !redirected) {
      setRedirected(true);
      router.replace("/(tabs)/Home");
    }
  }, [loading, partnerName, router, redirected]);

  const copyCode = async () => {
    if (!pairId) return;
    await Clipboard.setStringAsync(pairId);
    alert("Pair code copied! Share it with your partner.");
  };

  if (loading || !pairId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading your space…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.bubble, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.title}>Waiting for your partner 💞</Text>

      <Text style={styles.subtitle}>
        Share this code with your partner so they can join:
      </Text>

      <View style={styles.codeContainer}>
        <Text selectable style={styles.code}>{pairId}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={copyCode}>
        <Text style={styles.buttonText}>Copy / Share Code</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        As soon as your partner joins, you’ll automatically enter your space!
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16121F",
    padding: 24,
  },
  bubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#B5445A",
    opacity: 0.22,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#B4A8BA",
    textAlign: "center",
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
  },
  code: {
    fontSize: 28,
    fontWeight: "900",
    color: "#5B2E75",
    letterSpacing: 2,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#B5445A",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  info: {
    color: "#8F8296",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
