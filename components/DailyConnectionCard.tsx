import { LinearGradient } from "expo-linear-gradient";
import { Check, Flame, HeartHandshake } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  checkedIn: boolean;
  partnerCheckedIn: boolean;
  partnerName: string;
  streak: number;
  onToggle: () => void;
  gentle?: boolean;
};

export default function DailyConnectionCard({ checkedIn, partnerCheckedIn, partnerName, streak, onToggle, gentle = false }: Props) {
  const t = useTheme();
  const s = useStyles();
  const complete = checkedIn && partnerCheckedIn;
  const message = complete ? "Today is complete. See you tomorrow 💞" : checkedIn ? `Waiting for ${partnerName}. The day counts once you've both checked in.` : partnerCheckedIn ? `${partnerName} is here. Check in to complete today.` : "Check in together to keep your streak alive.";

  return (
    <Card variant="hero" style={s.card}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>DAILY CONNECTION</Text>
          <Text style={s.title}>{complete ? "You're both here" : "Are you here today?"}</Text>
        </View>
        {!gentle && (
          <View style={s.streak}>
            <Flame color={t.warning} fill={streak > 0 ? t.warning : "transparent"} size={18} />
            <Text style={s.streakNumber}>{streak}</Text>
            <Text style={s.streakLabel}>day{streak === 1 ? "" : "s"}</Text>
          </View>
        )}
      </View>

      <View style={s.flow}>
        <Person label="You" done={checkedIn} />
        <View style={[s.line, checkedIn && { backgroundColor: t.success }]} />
        <View style={[s.center, complete && { borderColor: "transparent" }]}>
          {complete && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />}
          <HeartHandshake color={complete ? "#fff" : t.textMuted} size={20} />
        </View>
        <View style={[s.line, partnerCheckedIn && { backgroundColor: t.success }]} />
        <Person label={partnerName || "Partner"} done={partnerCheckedIn} />
      </View>

      <Text style={[s.message, complete && { color: t.successText, fontWeight: "700" }]}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={checkedIn ? "Undo today's check-in" : "Check in for today"}
        onPress={onToggle}
        style={({ pressed }) => [s.button, checkedIn && s.buttonDone, pressed && { transform: [{ scale: 0.97 }] }]}
      >
        {!checkedIn && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        {checkedIn && <Check color={t.successText} size={18} strokeWidth={3} />}
        <Text style={[s.buttonText, checkedIn && { color: t.successText }]}>{checkedIn ? "Checked in · tap to undo" : gentle ? "I'm here" : "Check in for today"}</Text>
      </Pressable>
    </Card>
  );
}

function Person({ label, done }: { label: string; done: boolean }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={s.person}>
      <View style={[s.avatar, done && { backgroundColor: t.success, borderColor: t.success }]}>
        {done ? <Check color="#fff" size={18} strokeWidth={3} /> : <Text style={s.initial}>{label.charAt(0).toUpperCase()}</Text>}
      </View>
      <Text style={s.personLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: { marginBottom: 12, padding: 18, borderRadius: 26 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  eyebrow: { color: t.accentText, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: t.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  streak: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: t.warningSoft },
  streakNumber: { color: t.text, fontSize: 18, fontWeight: "900", marginTop: 1 },
  streakLabel: { color: t.warningText, fontSize: 10, fontWeight: "800" },
  flow: { flexDirection: "row", alignItems: "center", marginTop: 20, paddingHorizontal: 6 },
  person: { width: 72, alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1.5, borderColor: t.borderStrong },
  initial: { color: t.textSecondary, fontSize: 16, fontWeight: "800" },
  personLabel: { color: t.text, fontSize: 12.5, fontWeight: "700", marginTop: 7, maxWidth: 72 },
  line: { flex: 1, height: 2, borderRadius: 1, backgroundColor: t.border, marginBottom: 22 },
  center: { width: 40, height: 40, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, marginBottom: 22 },
  message: { color: t.textSecondary, fontSize: 13.5, lineHeight: 19, textAlign: "center", marginTop: 14, marginBottom: 14, paddingHorizontal: 8 },
  button: { height: 52, borderRadius: 16, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonDone: { backgroundColor: t.successSoft },
  buttonText: { color: "#fff", fontSize: 15.5, fontWeight: "800" },
}));
