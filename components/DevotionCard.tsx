import { BookOpen, Check, HandHeart } from "lucide-react-native";
import React, { useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Button, Sheet } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

export type DevotionProps = {
  kind: "prayer" | "verse";
  content: { text: string; reference: string } | null;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  mine: boolean;
  partners: boolean;
  partnerName: string;
  onToggle: () => void;
};

export default function DevotionCard({ kind, content, scaleAnim, fadeAnim, mine, partners, partnerName, onToggle }: DevotionProps) {
  const t = useTheme();
  const s = useStyles();
  const [open, setOpen] = useState(false);
  const isPrayer = kind === "prayer";
  const Icon = isPrayer ? HandHeart : BookOpen;
  const tint = isPrayer ? [t.accentSoft, t.accentText] : [t.violetSoft, t.violetText];
  const action = isPrayer ? (mine ? "Prayed" : "I prayed") : mine ? "Read" : "I read it";

  if (!content) {
    return <View style={[s.card, s.skeleton]}><View style={s.skelLine} /><View style={[s.skelLine, { width: "70%" }]} /><View style={[s.skelLine, { width: "50%" }]} /></View>;
  }

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={() => setOpen(true)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`Read today's ${isPrayer ? "prayer" : "verse"}`}>
        <View style={[s.chip, { backgroundColor: tint[0] }]}>
          <Icon color={tint[1]} size={13} />
          <Text style={[s.chipText, { color: tint[1] }]}>{isPrayer ? "PRAYER" : "SCRIPTURE"}</Text>
        </View>
        <Text style={[s.text, !isPrayer && s.verseText]} numberOfLines={5}>“{content.text}”</Text>
        <Text style={s.reference} numberOfLines={1}>{content.reference}</Text>
      </Pressable>
      <View style={s.footer}>
        <Pressable onPress={onToggle} accessibilityRole="button" style={({ pressed }) => [s.toggle, mine && { backgroundColor: t.successSoft, borderColor: "transparent" }, pressed && { transform: [{ scale: 0.96 }] }]}>
          {mine && <Check color={t.successText} size={14} strokeWidth={3} />}
          <Text style={[s.toggleText, mine && { color: t.successText }]}>{action}</Text>
        </Pressable>
        <Text style={[s.partner, partners && { color: t.successText }]} numberOfLines={1}>{partners ? `✓ ${partnerName}` : `${partnerName} not yet`}</Text>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} eyebrow={isPrayer ? "TODAY'S PRAYER" : "TODAY'S SCRIPTURE"} title={content.reference}>
        <Text style={s.full}>“{content.text}”</Text>
        <Button title={isPrayer ? (mine ? "Prayed ✓ · tap to undo" : "I've prayed this") : mine ? "Read ✓ · tap to undo" : "I've read this"} variant={mine ? "secondary" : "primary"} onPress={() => { onToggle(); setOpen(false); }} style={{ marginTop: 20 }} />
      </Sheet>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flex: 1, padding: 14, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow },
  skeleton: { minHeight: 200, gap: 10 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: t.surfaceSunken, width: "90%" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  text: { color: t.text, fontSize: 14, lineHeight: 20, fontWeight: "600", marginTop: 10 },
  verseText: { fontStyle: "italic", fontWeight: "500" },
  reference: { color: t.textMuted, fontSize: 11.5, fontWeight: "700", marginTop: 8 },
  footer: { marginTop: 12, gap: 7 },
  toggle: { height: 38, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  toggleText: { color: t.text, fontSize: 13, fontWeight: "800" },
  partner: { color: t.textMuted, fontSize: 11.5, fontWeight: "600", textAlign: "center" },
  full: { color: t.text, fontSize: 18, lineHeight: 28, fontWeight: "500", marginTop: 6 },
}));
