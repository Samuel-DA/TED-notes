import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  yourMood: string;
  setYourMood: (emoji: string) => void;
  partnerMood: string;
  MOODS: string[];
  yourLabel?: string;
  partnerLabel?: string;
};

export default function MoodSelector({
  yourMood,
  setYourMood,
  partnerMood,
  MOODS,
  yourLabel = "Your Mood",
  partnerLabel = "Partner's Mood",
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{yourLabel}</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setYourMood(m)}
            style={[styles.moodBubble, yourMood === m && styles.activeMood]}
          >
            <Text style={styles.moodEmoji}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.cardHint, { marginTop: 12 }]}>
        {partnerLabel}: <Text style={styles.bold}>{partnerMood}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#4f46e5" },
  cardHint: { fontSize: 12, color: "#9ca3af" },
  bold: { fontWeight: "700" },
  moodRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  moodBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  activeMood: { backgroundColor: "#ede9fe", transform: [{ scale: 1.15 }] },
  moodEmoji: { fontSize: 24 },
});