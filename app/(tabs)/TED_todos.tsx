import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TodoConfetti from "../../components/TodoConfetti";
import TodoInputBar from "../../components/TodoInputBar";
import TodoItem from "../../components/TodoItem";
import { Todo, useTodos } from "../../hooks/useTodos";

export default function TEDTodos() {
  const insets = useSafeAreaInsets();
  const { todos, addTodo, deleteTodo, toggleComplete, updateTodoText } =
    useTodos();

  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const handleAdd = async () => {
    if (!text.trim()) return;
    await addTodo(text.trim());
    setText("");
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

  const renderItem = useCallback(
    ({ item }: { item: Todo }) => (
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
    ),
    [editingId, editingText, todos],
  );

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + insets.bottom}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TED 💜</Text>
          <Text style={styles.headerSubtitle}>
            Small actions. Big momentum.
          </Text>
        </View>

       <FlashList
  data={sortedTodos}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
/>

        <TodoInputBar value={text} onChange={setText} onSend={handleAdd} />
      </KeyboardAvoidingView>

      <TodoConfetti
        visible={showConfetti}
        confettiKey={confettiKey}
        onDone={() => setShowConfetti(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#1e293b",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748b",
  },
});
