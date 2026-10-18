import React, { memo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/design";

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
          <Ionicons name="checkmark" size={16} color="#fff" />
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
          color={palette.muted}
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
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 11,
    borderRadius: 20,
    shadowColor: "#361D3E",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D8C9DF",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: palette.text,
    fontWeight: "600",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#AAA0AE",
  },
  input: {
    flex: 1,
    color: palette.text,
    backgroundColor: "#F7F3F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    marginLeft: 12,
  },
});
