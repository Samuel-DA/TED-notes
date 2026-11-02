import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, ListTodo, Sparkles, Trash2 } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "@/components/AppHeader";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { ScreenBackground, Segmented } from "@/components/ui/kit";
import { groupFor, PLAN_GROUPS, PLAN_SUGGESTIONS, categoryOf, type PlanGroup } from "@/constants/plans";
import { useApp } from "@/context/AppContext";
import TodoConfetti from "../../components/TodoConfetti";
import TodoInputBar from "../../components/TodoInputBar";
import TodoItem from "../../components/TodoItem";
import { Todo, useTodos } from "../../hooks/useTodos";

type Tab = "todo" | "done";
type Row = { type: "header"; key: string; label: string; count: number; group: PlanGroup | "done" } | { type: "todo"; key: string; todo: Todo };

export default function TEDTodos() {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { uid, partnerName } = useApp();
  const { todos, addTodo, deleteTodo, clearCompleted, toggleComplete, updateTodo, ready, error } = useTodos();

  const [tab, setTab] = useState<Tab>("todo");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const active = useMemo(() => todos.filter((todo) => !todo.completed), [todos]);
  const done = useMemo(() => todos.filter((todo) => todo.completed), [todos]);
  const counts = useMemo(() => {
    const result: Record<PlanGroup, number> = { overdue: 0, today: 0, tomorrow: 0, week: 0, later: 0, anytime: 0 };
    active.forEach((todo) => { result[groupFor(todo.dueDate)] += 1; });
    return result;
  }, [active]);

  const rows = useMemo<Row[]>(() => {
    if (tab === "done") return done.length ? [{ type: "header", key: "h-done", label: "Completed", count: done.length, group: "done" }, ...done.map((todo) => ({ type: "todo" as const, key: todo.id, todo }))] : [];
    const out: Row[] = [];
    PLAN_GROUPS.forEach(({ key, label }) => {
      const items = active.filter((todo) => groupFor(todo.dueDate) === key).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "") || a.order - b.order);
      if (!items.length) return;
      out.push({ type: "header", key: `h-${key}`, label, count: items.length, group: key });
      items.forEach((todo) => out.push({ type: "todo", key: todo.id, todo }));
    });
    return out;
  }, [active, done, tab]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    const added = await addTodo(text.trim(), { category, dueDate });
    if (added) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setText(""); setCategory(null); setDueDate(null);
      if (tab === "done") setTab("todo");
    }
  };

  const handleToggle = (id: string, completed: boolean) => {
    if (!completed) { setConfettiKey((k) => k + 1); setShowConfetti(true); }
    if (expandedId === id) setExpandedId(null);
    void toggleComplete(id, completed);
  };

  const confirmClear = () => Alert.alert("Clear completed plans?", `${done.length} completed plan${done.length === 1 ? "" : "s"} will be deleted for both of you.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Clear", style: "destructive", onPress: () => void clearCompleted() },
  ]);

  const switchTab = (next: Tab) => { setExpandedId(null); setTab(next); };
  const progress = todos.length ? done.length / todos.length : 0;

  const header = (
    <View>
      <AppHeader eyebrow="SHARED PLANS" title="Life, planned together" icon={<ListTodo color="#fff" size={23} />} />

      <View style={styles.summary}>
        <LinearGradient colors={t.heroWash} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryNumber}>{active.length}</Text>
            <Text style={styles.summaryLabel}>{active.length === 1 ? "plan to do" : "plans to do"}</Text>
          </View>
          <View style={styles.summaryBadges}>
            {counts.overdue > 0 && <View style={[styles.badge, { backgroundColor: t.dangerSoft }]}><Text style={[styles.badgeText, { color: t.dangerText }]}>{counts.overdue} overdue</Text></View>}
            {counts.today > 0 && <View style={[styles.badge, { backgroundColor: t.warningSoft }]}><Text style={[styles.badgeText, { color: t.warningText }]}>{counts.today} today</Text></View>}
            {counts.overdue === 0 && counts.today === 0 && active.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>Nothing urgent ✨</Text></View>}
          </View>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${Math.max(progress * 100, todos.length ? 4 : 0)}%` }]} />
          </View>
          <Text style={styles.progressText}>{done.length}/{todos.length} done</Text>
        </View>
      </View>

      <Segmented
        value={tab}
        onChange={switchTab}
        options={[{ value: "todo", label: "To do", count: active.length }, { value: "done", label: "Done", count: done.length }]}
        style={{ marginTop: 14, marginBottom: 6 }}
      />
      {(!!error || !ready) && <Text style={styles.status}>{error || "Connecting your shared plans…"}</Text>}
    </View>
  );

  const empty = ready ? (
    tab === "todo" ? (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}><Sparkles color={t.accentText} size={24} /></View>
        <Text style={styles.emptyTitle}>{done.length ? "All caught up!" : "Start your shared list"}</Text>
        <Text style={styles.emptyText}>Tap an idea to get going, or write your own below.</Text>
        <View style={styles.suggestions}>
          {PLAN_SUGGESTIONS.map((idea) => (
            <Pressable key={idea.text} onPress={() => { void Haptics.selectionAsync(); setText(idea.text); setCategory(idea.category); }} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
              <Text style={styles.suggestionEmoji}>{categoryOf(idea.category)?.emoji}</Text>
              <Text style={styles.suggestionText}>{idea.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    ) : (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}><CheckCircle2 color={t.successText} size={24} /></View>
        <Text style={styles.emptyTitle}>Nothing completed yet</Text>
        <Text style={styles.emptyText}>Finished plans land here, so you can look back on what you&apos;ve done together.</Text>
      </View>
    )
  ) : null;

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}>
        <FlashList
          data={rows}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.type}
          extraData={expandedId}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 4, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item: row }) => row.type === "header" ? (
            <View style={styles.groupHeader}>
              <Text style={[styles.groupLabel, row.group === "overdue" && { color: t.dangerText }, row.group === "today" && { color: t.warningText }]}>{row.label.toUpperCase()}</Text>
              <Text style={styles.groupCount}>{row.count}</Text>
              <View style={{ flex: 1 }} />
              {row.group === "done" && (
                <Pressable onPress={confirmClear} hitSlop={8} style={styles.clearButton}>
                  <Trash2 color={t.textMuted} size={13} />
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <TodoItem
              item={row.todo}
              authorLabel={row.todo.createdBy ? (row.todo.createdBy === uid ? "you" : partnerName || "your partner") : undefined}
              expanded={expandedId === row.todo.id}
              onExpand={setExpandedId}
              onToggle={handleToggle}
              onDelete={(id) => { setExpandedId(null); void deleteTodo(id); }}
              onUpdate={updateTodo}
            />
          )}
        />

        <TodoInputBar
          value={text}
          onChange={setText}
          category={category}
          onCategoryChange={setCategory}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          onSend={handleAdd}
        />
      </KeyboardAvoidingView>

      <TodoConfetti visible={showConfetti} confettiKey={confettiKey} onDone={() => setShowConfetti(false)} />
    </ScreenBackground>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1 },
  summary: { borderRadius: 24, padding: 18, overflow: "hidden", backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginTop: -4 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  summaryNumber: { color: t.text, fontSize: 40, fontWeight: "800", letterSpacing: -1.5, lineHeight: 44 },
  summaryLabel: { color: t.textSecondary, fontSize: 13, fontWeight: "600" },
  summaryBadges: { alignItems: "flex-end", gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: t.surfaceSunken },
  badgeText: { color: t.textSecondary, fontSize: 12, fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  progressTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: t.surfaceSunken, overflow: "hidden" },
  progressFill: { height: 7, borderRadius: 4 },
  progressText: { color: t.textSecondary, fontSize: 12, fontWeight: "700" },
  segment: { flexDirection: "row", padding: 4, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginTop: 14, marginBottom: 6 },
  segmentItem: { flex: 1, height: 38, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  segmentActive: { backgroundColor: t.inverse },
  segmentText: { color: t.textSecondary, fontSize: 13.5, fontWeight: "700" },
  segmentTextActive: { color: t.onInverse },
  segmentCount: { minWidth: 22, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  segmentCountActive: { backgroundColor: "#1B1320" },
  segmentCountText: { color: t.textSecondary, fontSize: 11, fontWeight: "800" },
  status: { color: t.accentText, fontSize: 12, textAlign: "center", marginTop: 8 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingTop: 16, paddingBottom: 9, paddingHorizontal: 4 },
  groupLabel: { color: t.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  groupCount: { color: t.textMuted, fontSize: 11, fontWeight: "800" },
  clearButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  clearText: { color: t.textMuted, fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 30, paddingHorizontal: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, marginBottom: 12 },
  emptyTitle: { color: t.text, fontSize: 19, fontWeight: "800" },
  emptyText: { color: t.textSecondary, fontSize: 13.5, lineHeight: 19, textAlign: "center", marginTop: 5, maxWidth: 290 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 18 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  suggestionEmoji: { fontSize: 13 },
  suggestionText: { color: t.textSecondary, fontSize: 13, fontWeight: "600" },
}));
