import { LinearGradient } from "expo-linear-gradient";
import { ArrowUp, Lock, MessageCircleQuestion } from "lucide-react-native";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  dailyQuestion: { question: string } | null;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  typedAnswer: string;
  setTypedAnswer: (v: string) => void;
  myAnswer: string;
  partnerAnswer: string;
  partnerName: string;
  onSave: () => void;
};

export default function DailyQuestionCard({ dailyQuestion, scaleAnim, fadeAnim, typedAnswer, setTypedAnswer, myAnswer, partnerAnswer, partnerName, onSave }: Props) {
  const t = useTheme();
  const s = useStyles();
  if (!dailyQuestion) return null;
  const canSend = typedAnswer.trim().length > 0;

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.heroTop}>
          <MessageCircleQuestion color="rgba(255,255,255,0.9)" size={16} />
          <Text style={s.eyebrow}>TODAY&apos;S QUESTION</Text>
        </View>
        <Text style={s.question}>{dailyQuestion.question}</Text>
        {!myAnswer && partnerAnswer ? <Text style={s.hint}>{partnerName} has answered. Answer to reveal theirs.</Text> : null}
      </LinearGradient>

      <View style={s.body}>
        {!myAnswer ? (
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              placeholder="Your answer…"
              placeholderTextColor={t.textMuted}
              selectionColor={t.accent}
              multiline
              maxLength={400}
            />
            <Pressable accessibilityLabel="Send answer" onPress={onSave} disabled={!canSend} style={[s.send, !canSend && { backgroundColor: t.surfacePressed }]}>
              {canSend && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
              <ArrowUp color={canSend ? "#fff" : t.textMuted} size={18} strokeWidth={2.6} />
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Answer label="You" text={myAnswer} mine />
            {partnerAnswer ? <Answer label={partnerName || "Partner"} text={partnerAnswer} /> : (
              <View style={s.waiting}>
                <Lock color={t.textMuted} size={14} />
                <Text style={s.waitingText}>Waiting for {partnerName || "your partner"} to answer</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function Answer({ label, text, mine }: { label: string; text: string; mine?: boolean }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={[s.answer, { backgroundColor: mine ? t.violetSoft : t.accentSoft }]}>
      <Text style={[s.answerLabel, { color: mine ? t.violetText : t.accentText }]}>{label.toUpperCase()}</Text>
      <Text style={s.answerText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: { borderRadius: 26, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, overflow: "hidden", marginBottom: 12, ...t.shadow },
  hero: { padding: 18, paddingBottom: 20 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  question: { color: "#fff", fontSize: 20, lineHeight: 26, fontWeight: "800", letterSpacing: -0.3, marginTop: 10 },
  hint: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: "600", marginTop: 10 },
  body: { padding: 14 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, backgroundColor: t.surfaceSunken, borderRadius: 18, borderWidth: 1, borderColor: t.border, padding: 5, paddingLeft: 14 },
  input: { flex: 1, color: t.text, fontSize: 15, minHeight: 42, maxHeight: 110, paddingTop: 11, paddingBottom: 9 },
  send: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  answer: { padding: 12, borderRadius: 16 },
  answerLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 1 },
  answerText: { color: t.text, fontSize: 14.5, lineHeight: 20, marginTop: 4 },
  waiting: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.borderStrong },
  waitingText: { color: t.textMuted, fontSize: 13, fontWeight: "600" },
}));
