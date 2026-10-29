import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void; // ✅ Updated props to match how you call it in chat.tsx
  onClose: () => void;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ✅ Changed component name to match file import expectations
export function EmojiPicker({
  onSelect,
  onClose,
  canManage = false,
  onEdit,
  onDelete,
}: ReactionPickerProps) {
  return (
    <View style={styles.centeredView}>
      {/* Pressable backdrop to close the menu safely */}
      <Pressable style={styles.backdrop} onPress={onClose} />
      
      {/* Container positioned safely via flex containment */}
      <View style={styles.pickerCenteredView}>
        <View style={styles.emojiRowContainer}>
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              activeOpacity={0.7}
              style={styles.emojiButton}
              onPress={() => {
                onSelect(emoji);
                onClose();
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {canManage && <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}><Pencil color="#334155" size={18} /><Text style={styles.actionText}>Edit message</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}><Trash2 color="#BE3455" size={18} /><Text style={[styles.actionText, styles.deleteText]}>Delete message</Text></TouchableOpacity>
        </View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  pickerCenteredView: {
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  emojiRowContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  emojiButton: {
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
  },
  emojiText: {
    fontSize: 28,
    lineHeight: 34,
    color: "#000",
    textAlign: "center",
  },
  actions: { width: 270, backgroundColor: "#fff", borderRadius: 14, padding: 8, marginTop: 10, elevation: 6, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 8 },
  actionButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, borderRadius: 14 },
  deleteButton: { backgroundColor: "#FFF1F4" },
  actionText: { color: "#334155", fontSize: 14, fontWeight: "800" },
  deleteText: { color: "#BE3455" },
});
