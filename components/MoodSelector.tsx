import * as Haptics from "expo-haptics";
import { Keyboard as KeyboardIcon } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputInstance } from "react-native";
import { Card, Sheet } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  yourMood: string;
  setYourMood: (emoji: string) => void;
  partnerMood: string;
  yourLabel?: string;
  partnerLabel?: string;
};

const MOODS = [
  { emoji: "😊", label: "Happy" }, { emoji: "🥰", label: "Loved" }, { emoji: "😌", label: "Calm" }, { emoji: "🤩", label: "Excited" },
  { emoji: "😴", label: "Tired" }, { emoji: "🥺", label: "Need a hug" }, { emoji: "😔", label: "Low" }, { emoji: "😤", label: "Stressed" },
  { emoji: "🤒", label: "Unwell" }, { emoji: "😰", label: "Anxious" }, { emoji: "🙏", label: "Grateful" }, { emoji: "💪", label: "Motivated" },
];
const labelFor = (emoji: string) => MOODS.find((m) => m.emoji === emoji)?.label;

export default function MoodSelector({ yourMood, setYourMood, partnerMood, partnerLabel = "Partner" }: Props) {
  const t = useTheme();
  const s = useStyles();
  const [open, setOpen] = useState(false);
  const hiddenInput = useRef<TextInputInstance>(null);

  const choose = (emoji: string) => { void Haptics.selectionAsync(); setYourMood(emoji); setOpen(false); };
  const onKeyboardEmoji = (text: string) => { const chars = Array.from(text); if (chars.length) choose(chars[chars.length - 1]); };

  return (
    <Card style={s.card}>
      <TextInput ref={hiddenInput} value="" onChangeText={onKeyboardEmoji} style={s.hidden} caretHidden />
      <Text style={s.eyebrow}>HOW YOU&apos;RE BOTH FEELING</Text>
      <View style={s.row}>
        <View style={s.side}>
          <View style={[s.bubble, s.bubblePartner]}><Text style={s.bigEmoji}>{partnerMood || "💭"}</Text></View>
          <Text style={s.name} numberOfLines={1}>{partnerLabel}</Text>
          <Text style={s.state} numberOfLines={1}>{partnerMood ? labelFor(partnerMood) ?? "Shared a mood" : "Not set today"}</Text>
        </View>
        <View style={s.divider} />
        <Pressable accessibilityRole="button" accessibilityLabel="Set your mood" onPress={() => setOpen(true)} style={({ pressed }) => [s.side, pressed && { opacity: 0.7 }]}>
          <View style={[s.bubble, !yourMood && s.bubbleEmpty]}><Text style={yourMood ? s.bigEmoji : s.plus}>{yourMood || "+"}</Text></View>
          <Text style={s.name}>You</Text>
          <Text style={[s.state, { color: t.accentText }]}>{yourMood ? "Tap to change" : "Set your mood"}</Text>
        </Pressable>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} eyebrow="YOUR MOOD" title="How are you feeling?">
        <View style={s.grid}>
          {MOODS.map((mood) => {
            const active = yourMood === mood.emoji;
            return (
              <Pressable key={mood.emoji} onPress={() => choose(mood.emoji)} style={({ pressed }) => [s.option, active && s.optionActive, pressed && { transform: [{ scale: 0.95 }] }]}>
                <Text style={s.optionEmoji}>{mood.emoji}</Text>
                <Text style={[s.optionLabel, active && { color: t.accentText }]} numberOfLines={1}>{mood.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => { setOpen(false); setTimeout(() => hiddenInput.current?.focus(), 350); }} style={s.more}>
          <KeyboardIcon color={t.textSecondary} size={16} />
          <Text style={s.moreText}>Pick any emoji from the keyboard</Text>
        </Pressable>
      </Sheet>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { marginBottom: 12, paddingVertical: 18 },
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  eyebrow: { color: t.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  side: { flex: 1, alignItems: "center" },
  divider: { width: 1, height: 70, backgroundColor: t.border },
  bubble: { width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  bubblePartner: { backgroundColor: t.accentSoft, borderColor: "transparent" },
  bubbleEmpty: { borderStyle: "dashed", borderColor: t.borderStrong, borderWidth: 1.5 },
  bigEmoji: { fontSize: 42 },
  plus: { fontSize: 30, color: t.textMuted, fontWeight: "300" },
  name: { color: t.text, fontSize: 14.5, fontWeight: "800", marginTop: 10 },
  state: { color: t.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { width: "23%", flexGrow: 1, aspectRatio: 0.95, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  optionActive: { backgroundColor: t.accentSoft, borderColor: t.accent },
  optionEmoji: { fontSize: 30 },
  optionLabel: { color: t.textSecondary, fontSize: 11, fontWeight: "700" },
  more: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingVertical: 12 },
  moreText: { color: t.textSecondary, fontSize: 13.5, fontWeight: "700" },
}));
