import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";

type Props = {
  yourMood: string;
  setYourMood: (emoji: string) => void;
  partnerMood: string;
  yourLabel?: string;
  partnerLabel?: string;
};

export default function MoodSelector({
  yourMood,
  setYourMood,
  partnerMood,
  yourLabel = "Your Mood",
  partnerLabel = "Partner's Mood",
}: Omit<Props, "MOODS">) {
  const hiddenInputRef = useRef<TextInput>(null);

  const handleOpenKeyboard = () => {
    hiddenInputRef.current?.focus();
  };

  const handleEmojiSelected = (text: string) => {
    if (text.length > 0) {
      const charArray = Array.from(text);
      const lastChar = charArray[charArray.length - 1];
      setYourMood(lastChar);
    }
  };

  return (
    <View style={styles.card}>
      {/* Hidden input to receive keyboard emoji selections */}
      <TextInput
        ref={hiddenInputRef}
        value={yourMood}
        onChangeText={handleEmojiSelected}
        showSoftInputOnFocus={true}
        style={styles.hiddenInput}
        caretHidden={true}
      />

      {/* PARTNER'S MOOD - MAIN FOCUS */}
      <Text style={styles.cardTitle}>{partnerLabel}</Text>
      
      <View style={styles.centerContainer}>
        <View style={styles.bigMoodBubble}>
          {/* 👑 Show empty thought cloud if partner's status has expired */}
          <Text style={styles.bigMoodEmoji}>{partnerMood ? partnerMood : "💭"}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* YOUR MOOD - TAP TO CHANGE CONTROL */}
      <View style={styles.bottomRow}>
        <Text style={styles.cardHint}>{yourLabel}:</Text>
        <TouchableOpacity 
          onPress={handleOpenKeyboard} 
          style={styles.myMoodTrigger}
          activeOpacity={0.7}
        >
          {/* 👑 Show an add symbol if your status has expired */}
          <Text style={styles.myMoodEmoji}>{yourMood ? yourMood : "➕"}</Text>
          <Text style={styles.changeText}>
            {yourMood ? "Tap to change" : "Set status"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent", // Clean container mapping overrides
    width: "100%",
  },
  cardTitle: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#64748b", 
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
  bigMoodBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fcf7ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#f3e8ff",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  bigMoodEmoji: { 
    fontSize: 48 
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    width: "100%",
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cardHint: { 
    fontSize: 15, 
    color: "#4f46e5",
    fontWeight: "600",
  },
  myMoodTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  myMoodEmoji: {
    fontSize: 20,
  },
  changeText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  hiddenInput: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },
});