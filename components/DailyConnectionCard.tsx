import { Check, Flame, HeartHandshake } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  checkedIn: boolean;
  partnerCheckedIn: boolean;
  partnerName: string;
  streak: number;
  onToggle: () => void;
  gentle?: boolean;
};

export default function DailyConnectionCard({
  checkedIn,
  partnerCheckedIn,
  partnerName,
  streak,
  onToggle,
  gentle = false,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconBox}>
          <HeartHandshake color="#7c3aed" size={24} />
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>Daily connection</Text>
          <Text style={styles.subtitle}>{gentle ? "No pressure — being here counts" : "Show up for each other today"}</Text>
        </View>
        {!gentle && <View style={styles.streakPill}>
          <Flame color="#f97316" fill="#fb923c" size={17} />
          <Text style={styles.streakText}>{streak}</Text>
        </View>}
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.personStatus, checkedIn && styles.personStatusDone]}>
          <Text style={styles.personLabel}>You</Text>
          <Text style={styles.personValue}>{checkedIn ? "Here today ✓" : gentle ? "Taking it gently" : "Not yet"}</Text>
        </View>
        <View style={[styles.personStatus, partnerCheckedIn && styles.personStatusDone]}>
          <Text style={styles.personLabel}>{partnerName || "Partner"}</Text>
          <Text style={styles.personValue}>{partnerCheckedIn ? "Here today ✓" : gentle ? "Taking today gently" : "Waiting"}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={checkedIn ? "Undo today's check-in" : "Check in for today"}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.button,
          checkedIn && styles.buttonDone,
          pressed && styles.buttonPressed,
        ]}
      >
        {checkedIn && <Check color="#fff" size={18} />}
        <Text style={styles.buttonText}>
          {checkedIn ? "I’m here today" : gentle ? "Mark that I’m here" : "Check in together"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  headingRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  headingText: { flex: 1, marginLeft: 12 },
  title: { color: "#312e81", fontSize: 17, fontWeight: "800" },
  subtitle: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  streakText: { color: "#c2410c", fontWeight: "900" },
  statusRow: { flexDirection: "row", gap: 8, marginVertical: 14 },
  personStatus: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    padding: 11,
  },
  personStatusDone: { backgroundColor: "#ecfdf5" },
  personLabel: { color: "#374151", fontSize: 12, fontWeight: "800" },
  personValue: { color: "#6b7280", fontSize: 11, marginTop: 3 },
  button: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: "#7c3aed",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDone: { backgroundColor: "#059669" },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
