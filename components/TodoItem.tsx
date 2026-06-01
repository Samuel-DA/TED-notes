import React, { memo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  item: {
    id: string;
    text: string;
    completed: boolean;
  };
  editingId: string | null;
  editingText: string;
  setEditingText: (v: string) => void;
  startEdit: (id: string, text: string) => void;
  saveEdit: (id: string, text: string) => void;
  toggleComplete: (id: string, completed: boolean) => void;
  deleteTodo: (id: string) => void;
};

function TodoItem({
  item,
  editingId,
  editingText,
  setEditingText,
  startEdit,
  saveEdit,
  toggleComplete,
  deleteTodo,
}: Props) {
  const isEditing = editingId === item.id;

  return (
    <View style={styles.card}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxDone]}
        onPress={() => toggleComplete(item.id, item.completed)}
        activeOpacity={0.7}
      >
        {item.completed && (
          <Ionicons name="checkmark" size={16} color="#0f172a" />
        )}
      </TouchableOpacity>

      {/* Text */}
      {isEditing ? (
        <TextInput
          value={editingText}
          onChangeText={setEditingText}
          style={styles.input}
          multiline
          autoFocus
        />
      ) : (
        <Text
          style={[
            styles.text,
            item.completed && styles.completedText,
          ]}
        >
          {item.text}
        </Text>
      )}

      {/* Edit Icon */}
      <TouchableOpacity
        onPress={() =>
          isEditing
            ? saveEdit(item.id, editingText)
            : startEdit(item.id, item.text)
        }
        style={styles.iconBtn}
      >
        <Ionicons
          name={isEditing ? "checkmark-circle" : "create-outline"}
          size={20}
          color="#94a3b8"
        />
      </TouchableOpacity>

      {/* Delete Icon */}
      <TouchableOpacity
        onPress={() => deleteTodo(item.id)}
        style={styles.iconBtn}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color="#ef4444"
        />
      </TouchableOpacity>
    </View>
  );
}

export default memo(TodoItem);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#6366f1",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: "#6366f1",
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: "#f8fafc",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    marginLeft: 12,
  },
});