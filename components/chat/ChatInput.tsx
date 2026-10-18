import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { X, Send } from "lucide-react-native";
import { Message } from "@/types/chat";
import { palette } from "@/constants/design";

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
  const isSendDisabled = !text.trim() || sending;

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
          
          {/* Enhanced Close Button with expanded hit target box */}
          <Pressable 
            onPress={onCancelReply} 
            hitSlop={15}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.4 : 1 }
            ]}
          >
            <X size={18} color="#64748b" />
          </Pressable>
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
        
        {/* Modern, high-performance UI Send Button */}
        <Pressable
          onPress={onSend}
          disabled={isSendDisabled}
          style={({ pressed }) => [
            styles.sendCircle,
            { 
              opacity: isSendDisabled 
                ? 0.4 
                : (pressed ? 0.6 : 1) 
            }
          ]}
        >
          <Send size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyPreviewHeader: {
    flexDirection: "row",
    backgroundColor: "#fff",
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
    backgroundColor: palette.whatsapp,
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
    color: palette.whatsapp,
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
    backgroundColor: "#fff",
    borderRadius: 22,
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
    backgroundColor: palette.whatsapp,
    alignItems: "center",
    justifyContent: "center",
  },
});
