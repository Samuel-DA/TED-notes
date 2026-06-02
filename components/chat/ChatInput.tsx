import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { X, Send } from "lucide-react-native";
import { Message } from "@/types/chat";

type Props = {
  text: string;
  setText: (v: string) => void;
  sending: boolean;
  replyingTo: Message | null;
  onCancelReply: () => void;
  onSend: () => void;
  onPickImage?: () => void;
};

export function ChatInput({
  text,
  setText,
  sending,
  replyingTo,
  onCancelReply,
  onSend,
}: Props) {
  return (
    <View style={styles.container}>
      {/* 💬 MESSAGE REPLY PREVIEW BOX */}
      {replyingTo && (
        <View style={styles.replyPreviewHeader}>
          <View style={styles.replyBarAccent} />
          <View style={styles.replyContentColumn}>
            <Text style={styles.replySenderTitle}>Replying to text</Text>
            <Text style={styles.replyTextSnippet} numberOfLines={1}>
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.closeButton}>
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      )}

      {/* INPUT BASE FIELD ROW */}
      <View style={styles.inputActionRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          style={styles.textInput}
          multiline
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!text.trim() || sending}
          style={[styles.sendCircle, { opacity: text.trim() ? 1 : 0.5 }]}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyPreviewHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: "center",
    borderLeftWidth: 0,
    overflow: "hidden",
  },
  replyBarAccent: {
    width: 4,
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 10,
  },
  replyContentColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  replySenderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 2,
  },
  replyTextSnippet: {
    fontSize: 14,
    color: "#475569",
  },
  closeButton: {
    padding: 4,
  },
  inputActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    color: "#0f172a",
  },
  sendCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
});