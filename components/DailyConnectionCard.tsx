import { Check, Flame, HeartHandshake, UserRound } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@/constants/design";

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
  const completeToday = checkedIn && partnerCheckedIn;

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconBox}>
          <HeartHandshake color={palette.rose} size={24} />
        </View>
        <View style={styles.headingText}>
          <Text style={styles.title}>Daily connection</Text>
          <Text style={styles.subtitle}>{gentle ? "No pressure — being here counts" : "A shared streak"}</Text>
        </View>
        {!gentle && <View style={styles.streakPill}>
          <Flame color="#f97316" fill="#fb923c" size={17} />
          <Text style={styles.streakText}>{streak}</Text>
        </View>}
      </View>

      <View style={styles.connectionFlow}>
        <View style={styles.personColumn}>
          <View style={[styles.personBadge, checkedIn && styles.personBadgeDone]}>
            {checkedIn ? <Check color="#fff" size={17} strokeWidth={3} /> : <UserRound color="#746B7B" size={17} />}
          </View>
          <Text style={styles.personLabel}>You</Text>
          <Text style={styles.personValue}>{checkedIn ? "Checked in" : "Your turn"}</Text>
        </View>

        <View style={styles.connectorWrap}>
          <View style={[styles.connector, checkedIn && styles.connectorActive]} />
          <View style={[styles.centerDot, completeToday && styles.centerDotDone]}>
            <HeartHandshake color={completeToday ? "#fff" : "#9A90A2"} size={17} />
          </View>
          <View style={[styles.connector, partnerCheckedIn && styles.connectorActive]} />
        </View>

        <View style={styles.personColumn}>
          <View style={[styles.personBadge, partnerCheckedIn && styles.personBadgeDone]}>
            {partnerCheckedIn ? <Check color="#fff" size={17} strokeWidth={3} /> : <UserRound color="#746B7B" size={17} />}
          </View>
          <Text style={styles.personLabel} numberOfLines={1}>{partnerName}</Text>
          <Text style={styles.personValue}>{partnerCheckedIn ? "Checked in" : "Their turn"}</Text>
        </View>
      </View>

      <Text style={[styles.ruleText, completeToday && styles.ruleTextDone]}>
        {completeToday
          ? "Today is complete"
          : checkedIn
            ? `Waiting for ${partnerName}. Both check-ins are needed.`
            : "Check in individually. The day counts only after you both do it."}
      </Text>

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
          {checkedIn ? "Checked in — tap to undo" : gentle ? "Mark that I’m here" : "Check in for today"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    marginBottom: 16,
    padding: 18,
  },
  headingRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(181,68,90,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headingText: { flex: 1, marginLeft: 12 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.62)", fontSize: 13, lineHeight: 18, marginTop: 2 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff7ed",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  streakText: { color: "#c2410c", fontWeight: "900" },
  connectionFlow: { flexDirection: "row", alignItems: "center", marginTop: 18 },
  personColumn: { width: 76, alignItems: "center" },
  personBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.13)", alignItems: "center", justifyContent: "center" },
  personBadgeDone: { backgroundColor: "#059669" },
  personLabel: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 7, maxWidth: 76 },
  personValue: { color: "rgba(255,255,255,0.56)", fontSize: 11.5, fontWeight: "500", marginTop: 2 },
  connectorWrap: { flex: 1, flexDirection: "row", alignItems: "center", marginBottom: 27 },
  connector: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.15)" },
  connectorActive: { backgroundColor: "#34D399" },
  centerDot: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.13)", alignItems: "center", justifyContent: "center" },
  centerDotDone: { backgroundColor: palette.rose },
  ruleText: { color: "rgba(255,255,255,0.62)", fontSize: 12.5, lineHeight: 18, textAlign: "center", marginTop: 12, marginBottom: 12 },
  ruleTextDone: { color: "#047857", fontWeight: "700" },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.rose,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDone: { backgroundColor: "#059669" },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
