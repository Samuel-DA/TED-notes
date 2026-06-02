import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void; // ✅ Updated props to match how you call it in chat.tsx
  onClose: () => void;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ✅ Changed component name to match file import expectations
export function EmojiPicker({
  onSelect,
  onClose,
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
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: 30,
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
});