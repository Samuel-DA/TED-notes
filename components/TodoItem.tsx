import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays, Check, Trash2 } from "lucide-react-native";
import React, { memo, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { categoryOf, dueLabel, dueOptions, PLAN_CATEGORIES, type DueTone } from "@/constants/plans";
import type { Todo, TodoMeta } from "@/hooks/useTodos";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  item: Todo;
  authorLabel?: string;
  expanded: boolean;
  onExpand: (id: string | null) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: { text?: string } & TodoMeta) => Promise<void> | void;
};



function TodoItem({ item, authorLabel, expanded, onExpand, onToggle, onDelete, onUpdate }: Props) {
  const t = useTheme();
  const styles = useStyles();
  const category = categoryOf(item.category);
  const due = item.dueDate ? dueLabel(item.dueDate) : null;
  const TONES: Record<DueTone, { color: string; bg: string }> = {
    overdue: { color: t.dangerText, bg: t.dangerSoft },
    today: { color: t.warningText, bg: t.warningSoft },
    soon: { color: t.violetText, bg: t.violetSoft },
    later: { color: t.textSecondary, bg: t.surfaceSunken },
  };
  const tone = due ? TONES[item.completed ? "later" : due.tone] : null;

  const toggle = () => {
    void Haptics.selectionAsync();
    onToggle(item.id, item.completed);
  };

  return (
    <View style={[styles.card, item.completed && styles.cardDone, expanded && styles.cardExpanded]}>
      {category && !item.completed && <View style={[styles.accent, { backgroundColor: category.color }]} />}
      <Pressable onPress={() => onExpand(expanded ? null : item.id)} style={styles.row}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.completed }} hitSlop={10} onPress={toggle} style={[styles.check, item.completed && styles.checkDone]}>
          {item.completed && <Check color="#fff" size={15} strokeWidth={3} />}
        </Pressable>
        <View style={styles.body}>
          <Text style={[styles.text, item.completed && styles.textDone]}>{item.text}</Text>
          {(category || due || authorLabel) && (
            <View style={styles.meta}>
              {due && tone && (
                <View style={[styles.tag, { backgroundColor: tone.bg }]}>
                  <CalendarDays color={tone.color} size={11} />
                  <Text style={[styles.tagText, { color: tone.color }]}>{due.tone === "overdue" && !item.completed ? `Overdue · ${due.text}` : due.text}</Text>
                </View>
              )}
              {category && (
                <View style={[styles.tag, { backgroundColor: `${category.color}26` }]}>
                  <Text style={styles.tagEmoji}>{category.emoji}</Text>
                  <Text style={[styles.tagText, { color: t.text }]}>{category.label}</Text>
                </View>
              )}
              {!!authorLabel && <Text style={styles.author}>by {authorLabel}</Text>}
            </View>
          )}
        </View>
      </Pressable>
      {expanded && <Editor item={item} onClose={() => onExpand(null)} onDelete={onDelete} onUpdate={onUpdate} />}
    </View>
  );
}

function Editor({ item, onClose, onDelete, onUpdate }: { item: Todo; onClose: () => void; onDelete: (id: string) => void; onUpdate: Props["onUpdate"] }) {
  const t = useTheme();
  const styles = useStyles();
  const [text, setText] = useState(item.text);
  const [category, setCategory] = useState<string | null>(item.category ?? null);
  const [dueDate, setDueDate] = useState<string | null>(item.dueDate ?? null);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => dueOptions(), []);
  const customDue = dueDate && !options.some((option) => option.key === dueDate);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try { await onUpdate(item.id, { text, category, dueDate }); onClose(); }
    catch (error) { Alert.alert("Couldn't save", error instanceof Error ? error.message : "Please try again."); }
    finally { setSaving(false); }
  };

  const remove = () => Alert.alert("Delete this plan?", `“${item.text}” will be removed for both of you.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
  ]);

  return (
    <View style={styles.editor}>
      <TextInput value={text} onChangeText={setText} multiline autoFocus style={styles.editInput} placeholderTextColor={t.textMuted} />
      <Text style={styles.editLabel}>WHEN</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.editChips}>
        <Chip label="Anytime" active={!dueDate} onPress={() => setDueDate(null)} />
        {customDue && <Chip label={dueLabel(dueDate!).text} active onPress={() => undefined} />}
        {options.map((option) => <Chip key={option.key} label={option.label} active={dueDate === option.key} onPress={() => setDueDate(option.key)} />)}
      </ScrollView>
      <Text style={styles.editLabel}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.editChips}>
        <Chip label="None" active={!category} onPress={() => setCategory(null)} />
        {PLAN_CATEGORIES.map((option) => <Chip key={option.key} label={`${option.emoji} ${option.label}`} active={category === option.key} color={option.color} onPress={() => setCategory(option.key)} />)}
      </ScrollView>
      <View style={styles.editActions}>
        <Pressable accessibilityLabel="Delete plan" onPress={remove} style={styles.deleteButton}><Trash2 color={t.dangerText} size={17} /></Pressable>
        <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        <Pressable onPress={save} disabled={saving || !text.trim()} style={[styles.saveButton, (saving || !text.trim()) && { opacity: 0.5 }]}>
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={() => { void Haptics.selectionAsync(); onPress(); }} style={[styles.chip, active && (color ? { backgroundColor: color, borderColor: color } : styles.chipActive)]}>
      <Text style={[styles.chipText, active && { color: color ? "#fff" : t.onInverse }]}>{label}</Text>
    </Pressable>
  );
}

export default memo(TodoItem);

const useStyles = makeStyles((t) => ({
  card: { borderRadius: 20, marginBottom: 9, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, overflow: "hidden", ...t.shadow },
  cardDone: { backgroundColor: t.surfaceSunken, borderColor: "transparent", shadowOpacity: 0, elevation: 0 },
  cardExpanded: { borderColor: t.accent, backgroundColor: t.surfaceSunken },
  accent: { position: "absolute", left: 0, top: 14, bottom: 14, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 13, paddingVertical: 15, paddingHorizontal: 15 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: t.borderStrong, alignItems: "center", justifyContent: "center", marginTop: -1 },
  checkDone: { backgroundColor: t.success, borderColor: t.success },
  body: { flex: 1, minWidth: 0 },
  text: { color: t.text, fontSize: 15.5, lineHeight: 21, fontWeight: "600" },
  textDone: { color: t.textMuted, textDecorationLine: "line-through" },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 999 },
  tagEmoji: { fontSize: 10.5 },
  tagText: { fontSize: 11.5, fontWeight: "700" },
  author: { color: t.textMuted, fontSize: 11.5, fontWeight: "600" },
  editor: { paddingHorizontal: 15, paddingBottom: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
  editInput: { color: t.text, fontSize: 15.5, minHeight: 46, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: t.surfaceSunken, textAlignVertical: "top" },
  editLabel: { color: t.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginTop: 14, marginBottom: 8 },
  editChips: { gap: 7 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 999, justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  chipActive: { backgroundColor: t.inverse, borderColor: t.inverse },
  chipText: { color: t.textSecondary, fontSize: 12.5, fontWeight: "700" },
  editActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  deleteButton: { width: 46, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: t.dangerSoft },
  cancelButton: { flex: 1, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  cancelText: { color: t.text, fontSize: 14, fontWeight: "700" },
  saveButton: { flex: 1.3, height: 44, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "800" },
}));
