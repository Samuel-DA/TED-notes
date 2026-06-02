// app/(tabs)/Games/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../../context/AppContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import GuessGame from "./GuessGame";
import KnowMeGame from "./KnowMeGame";
import Scoreboard from "./ScoreBoard";

type GameType = "guess" | "knowme";

export default function Games() {
  const { pairId, myName } = useApp();
  const [activeGame, setActiveGame] = useState<GameType>("guess");

  return (
    <LinearGradient colors={["#c084fc", "#f472b6"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* TOP INTRO CARD */}
        <View style={styles.header}>
          <Text style={styles.title}>🎮 TED&apos;s Games</Text>
          <Text style={styles.subtitle}>Play together, earn points, have fun 💜</Text>
        </View>

        {/* TAB CONTROLS */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabButton, activeGame === "guess" && styles.activeTab]} 
            onPress={() => setActiveGame("guess")}
          >
            <Ionicons name="disc" size={18} color={activeGame === "guess" ? "#4f46e5" : "#64748b"} />
            <Text style={[styles.tabText, activeGame === "guess" && styles.activeTabText]}>Guessing Game</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeGame === "knowme" && styles.activeTab]} 
            onPress={() => setActiveGame("knowme")}
          >
            <MaterialCommunityIcons name="brain" size={18} color={activeGame === "knowme" ? "#4f46e5" : "#64748b"} />
            <Text style={[styles.tabText, activeGame === "knowme" && styles.activeTabText]}>Know Me</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE MODULE CONTAINER */}
        {activeGame === "guess" ? (
          <GuessGame pairId={pairId} myName={myName || "Partner"} />
        ) : (
          <KnowMeGame pairId={pairId} myName={myName || "Partner"} />
        )}

        {/* SCOREBOARD RENDERING */}
        <Scoreboard pairId={pairId} />

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 50, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: "900", color: "#fff" },
  subtitle: { marginTop: 4, fontSize: 15, color: "#fce7f3", fontWeight: "500" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  activeTabText: { color: "#4f46e5", fontWeight: "800" },
});