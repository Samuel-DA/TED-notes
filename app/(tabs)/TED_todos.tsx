import { FlashList } from "@shopify/flash-list";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, ListTodo } from "lucide-react-native";
import { palette } from "@/constants/design";
import AppHeader from "@/components/AppHeader";

import TodoConfetti from "../../components/TodoConfetti";
import TodoInputBar from "../../components/TodoInputBar";
import TodoItem from "../../components/TodoItem";
import { Todo, useTodos } from "../../hooks/useTodos";

export default function TEDTodos() {
  const insets = useSafeAreaInsets();
  const { todos, addTodo, deleteTodo, toggleComplete, updateTodoText, ready, error } =
    useTodos();

  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const handleAdd = async () => {
    if (!text.trim()) return;
    const added = await addTodo(text.trim());
    if (added) setText("");
  };

  const handleToggle = async (id: string, completed: boolean) => {
    if (!completed) {
      setConfettiKey((k) => k + 1);
      setShowConfetti(true);
    }
    toggleComplete(id, completed);
  };

  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setEditingText(value);
  };

  const saveEdit = async (id: string, value: string) => {
    await updateTodoText(id, value);
    setEditingId(null);
    setEditingText("");
  };

  // 🔥 SORT TODOS: active first, completed at bottom
  const sortedTodos = useMemo(() => {
    const active = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    return [...active, ...completed];
  }, [todos]);
  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  const renderItem = ({ item }: { item: Todo }) => (
      <TodoItem
        item={item}
        editingId={editingId}
        editingText={editingText}
        setEditingText={setEditingText}
        startEdit={startEdit}
        saveEdit={saveEdit}
        toggleComplete={handleToggle}
        deleteTodo={deleteTodo}
      />
  );

  return (
    <LinearGradient colors={[palette.ink, "#34203D", "#6A315C"]} style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + insets.bottom : 0}
        enabled
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <AppHeader eyebrow="SHARED PLANS" title="Life, planned together" subtitle="Tiny promises, date-night ideas and everything you don’t want to forget." icon={<ListTodo color="#fff" size={23} />} />
          <View style={styles.statsRow}>
            <View style={styles.statPill}><Text style={styles.statNumber}>{activeCount}</Text><Text style={styles.statLabel}>open</Text></View>
            <View style={styles.statPill}><CheckCircle2 color={palette.success} size={15} /><Text style={styles.statNumber}>{completedCount}</Text><Text style={styles.statLabel}>done</Text></View>
          </View>
        </View>

       <FlashList
  data={sortedTodos}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 150 }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
/>

        <TodoInputBar value={text} onChange={setText} onSend={handleAdd} />
        {(!ready || error) && <Text style={styles.errorText}>{error || "Connecting your shared plans…"}</Text>}
        {!todos.length && (
          <View pointerEvents="none" style={styles.emptyState}>
            <ListTodo color="#C9BBCF" size={32} />
            <Text style={styles.emptyTitle}>Nothing waiting on you</Text>
            <Text style={styles.emptyText}>Add your next shared plan below.</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <TodoConfetti
        visible={showConfetti}
        confettiKey={confettiKey}
        onDone={() => setShowConfetti(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 15 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 },
  statNumber: { color: "#fff", fontSize: 13, fontWeight: "900" },
  statLabel: { color: "#BFAFC8", fontSize: 11, fontWeight: "700" },
  emptyState: { position: "absolute", top: "53%", left: 0, right: 0, alignItems: "center" },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 17, marginTop: 8 },
  emptyText: { color: "#D8C9DF", fontSize: 13, marginTop: 4 },
  errorText: { color: palette.rose, fontSize: 12, textAlign: "center", paddingBottom: 6 },
});
