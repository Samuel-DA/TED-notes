// app/(tabs)/Games/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useApp } from "../../../context/AppContext";

import GuessGame from "@/components/games/GuessGame";
import KnowMeGame from "@/components/games/KnowMeGame";
import Scoreboard from "@/components/games/ScoreBoard";
import ThisOrThatGame from "@/components/games/ThisOrThatGame";
import ConversationCards from "@/components/games/ConversationCards";
import DrawingActivity from "@/components/games/DrawingActivity";
import MemoryMatch from "@/components/games/MemoryMatch";
import ReactionRace from "@/components/games/ReactionRace";
import AppHeader from "@/components/AppHeader";
import { palette } from "@/constants/design";
import { Gamepad2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GameType = "memory" | "reaction" | "draw" | "guess" | "knowme" | "thisorthat" | "cards";

const GAME_TABS: { id: GameType; label: string; emoji: string }[] = [
  { id: "memory", label: "Memory", emoji: "🧩" },
  { id: "reaction", label: "Reflex", emoji: "⚡" },
  { id: "draw", label: "Draw", emoji: "🎨" },
  { id: "guess", label: "Guess", emoji: "🎯" },
  { id: "knowme", label: "Know Me", emoji: "🧠" },
  { id: "thisorthat", label: "This or That", emoji: "↔️" },
  { id: "cards", label: "Talk", emoji: "💬" },
];

export default function Games() {
  const { pairId, myName, uid, partnerName } = useApp();
  const [activeGame, setActiveGame] = useState<GameType>("memory");
  const [isDrawing, setIsDrawing] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[palette.ink, "#2A1834", "#4A244E"]} style={styles.container}>
      <ScrollView scrollEnabled={!isDrawing} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 120 }}>
        
        {/* TOP INTRO CARD */}
        <View style={styles.headerWrap}><AppHeader eyebrow="PLAYSPACE" title="Closer through play" subtitle="Live challenges, playful prompts and a canvas for two." icon={<Gamepad2 color="#fff" size={22} />} /></View>

        {/* TAB CONTROLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {GAME_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeGame === tab.id && styles.activeTab]}
              onPress={() => setActiveGame(tab.id)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabText, activeGame === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ACTIVE MODULE CONTAINER */}
        {activeGame === "guess" && (
          <GuessGame pairId={pairId} myName={myName || "Partner"} />
        )}
        {activeGame === "knowme" && (
          <KnowMeGame pairId={pairId} myName={myName || "Partner"} />
        )}
        {activeGame === "thisorthat" && (
          <ThisOrThatGame
            pairId={pairId}
            uid={uid}
            myName={myName || "Your partner"}
            partnerName={partnerName || "Partner"}
          />
        )}
        {activeGame === "cards" && <ConversationCards />}
        {activeGame === "memory" && <MemoryMatch pairId={pairId} uid={uid} />}
        {activeGame === "reaction" && (
          <ReactionRace pairId={pairId} uid={uid} myName={myName || "Your partner"} partnerName={partnerName || "Partner"} />
        )}
        {activeGame === "draw" && (
          <DrawingActivity pairId={pairId} uid={uid} myName={myName || "Your partner"} partnerName={partnerName || "Partner"} onDrawingChange={setIsDrawing} />
        )}

        {/* SCOREBOARD RENDERING */}
        {activeGame !== "draw" && <Scoreboard pairId={pairId} />}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { marginHorizontal: 16 },
  header: { paddingHorizontal: 20, paddingBottom: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  eyebrow: { color: "#F9A8D4", fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginBottom: 4 },
  title: { fontSize: 23, fontWeight: "900", color: "#fff", letterSpacing: -0.6 },
  subtitle: { marginTop: 4, fontSize: 12, lineHeight: 17, color: "#D8C9DF", fontWeight: "500" },
  tabBar: {
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tabButton: {
    minWidth: 102,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 15,
    gap: 6,
  },
  tabEmoji: { fontSize: 17 },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: "#D4C7DB" },
  activeTabText: { color: palette.plum, fontWeight: "900" },
  supportBanner: { marginHorizontal: 16, marginBottom: 12, padding: 11, borderRadius: 14, backgroundColor: "rgba(134,239,172,0.12)", borderWidth: 1, borderColor: "rgba(134,239,172,0.24)" },
  supportBannerText: { color: "#BBF7D0", fontSize: 12, fontWeight: "700", textAlign: "center" },
});
