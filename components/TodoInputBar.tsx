import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUp, CalendarDays, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { dueLabel, dueOptions, PLAN_CATEGORIES } from "@/constants/plans";
import { useTabBarSpace } from "./SleekTabBar";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  category: string | null;
  onCategoryChange: (value: string | null) => void;
  dueDate: string | null;
  onDueDateChange: (value: string | null) => void;
  onSend: () => void;
};

export default function TodoInputBar({ value, onChange, category, onCategoryChange, dueDate, onDueDateChange, onSend }: Props) {
  const t = useTheme();
  const styles = useStyles();
  const tabBarSpace = useTabBarSpace();
  const [focused, setFocused] = useState(false);
  const [height, setHeight] = useState(48);
  const options = useMemo(() => dueOptions(), []);
  const canSend = value.trim().length > 0;
  const showExtras = focused || canSend || !!category || !!dueDate;
  const customDue = dueDate && !options.some((option) => option.key === dueDate);

  const pick = <T,>(current: T | null, next: T, set: (value: T | null) => void) => {
    void Haptics.selectionAsync();
    set(current === next ? null : next);
  };

  return (
    <View style={[styles.container, { paddingBottom: 10 + tabBarSpace }]}>
      <LinearGradient pointerEvents="none" colors={[`${t.bg[2]}00`, `${t.bg[2]}F0`, t.bg[2]]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
      {showExtras && (
        <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
          <View style={styles.chipLead}><CalendarDays color={t.textMuted} size={14} /></View>
          {customDue && (
            <Pressable onPress={() => onDueDateChange(null)} style={[styles.chip, styles.chipActive]}>
              <Text style={[styles.chipText, styles.chipTextActive]}>{dueLabel(dueDate!).text}</Text>
              <X color={t.onInverse} size={12} />
            </Pressable>
          )}
          {options.map((option) => {
            const active = dueDate === option.key;
            return (
              <Pressable key={option.key} onPress={() => pick(dueDate, option.key, onDueDateChange)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
          <View style={styles.divider} />
          {PLAN_CATEGORIES.map((item) => {
            const active = category === item.key;
            return (
              <Pressable key={item.key} onPress={() => pick(category, item.key, onCategoryChange)} style={[styles.chip, active && { backgroundColor: item.color, borderColor: item.color }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.chipText, active && { color: "#fff" }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Add a shared plan…"
          placeholderTextColor={t.textMuted}
          multiline
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onContentSizeChange={(e) => setHeight(Math.min(110, Math.max(48, e.nativeEvent.contentSize.height + 4)))}
          style={[styles.input, { height }]}
        />
        <Pressable accessibilityLabel="Add plan" onPress={onSend} disabled={!canSend} style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && { transform: [{ scale: 0.92 }] }]}>
          {canSend && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
          <ArrowUp color="#fff" size={20} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { paddingHorizontal: 16, paddingTop: 18 },
  chipsScroll: { marginHorizontal: -16, marginBottom: 10 },
  chips: { paddingHorizontal: 16, gap: 7, alignItems: "center" },
  chipLead: { width: 22, alignItems: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  chipActive: { backgroundColor: t.inverse, borderColor: t.inverse },
  chipText: { color: t.textSecondary, fontSize: 12.5, fontWeight: "700" },
  chipTextActive: { color: t.onInverse },
  emoji: { fontSize: 12 },
  divider: { width: 1, height: 18, backgroundColor: t.surfacePressed, marginHorizontal: 3 },
  inputShell: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 5, paddingLeft: 16, borderRadius: 26, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  inputShellFocused: { borderColor: t.accent, backgroundColor: t.surfaceSunken },
  input: { flex: 1, color: t.text, fontSize: 15.5, paddingTop: 13, paddingBottom: 11, textAlignVertical: "top" },
  send: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 1 },
  sendDisabled: { backgroundColor: t.surfaceSunken, opacity: 0.6 },
}));
