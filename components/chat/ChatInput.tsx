import { LinearGradient } from "expo-linear-gradient";
import { ArrowUp, Pencil, Reply, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";

type Props = {
  text: string;
  setText: (v: string) => void;
  sending: boolean;
  replyingTo: Message | null;
  /** Name of the person being replied to. */
  replyingToName?: string;
  editingMessage?: Message | null;
  onCancelReply: () => void;
  onCancelEdit?: () => void;
  onSend: () => void;
  onPickImage?: () => void;
};

export function ChatInput({ text, setText, sending, replyingTo, replyingToName, editingMessage, onCancelReply, onCancelEdit, onSend }: Props) {
  const t = useTheme();
  const s = useStyles();
  const canSend = !!text.trim() && !sending;
  const context = editingMessage ? { icon: Pencil, title: "Editing message", body: editingMessage.text, cancel: onCancelEdit } : replyingTo ? { icon: Reply, title: `Replying to ${replyingToName || "message"}`, body: replyingTo.text, cancel: onCancelReply } : null;

  return (
    <View style={s.container}>
      {context && (
        <View style={s.context}>
          <View style={s.contextBar} />
          <context.icon color={t.accentText} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={s.contextTitle}>{context.title}</Text>
            <Text style={s.contextBody} numberOfLines={1}>{context.body}</Text>
          </View>
          <Pressable accessibilityLabel="Cancel" onPress={context.cancel} hitSlop={12} style={s.close}><X size={16} color={t.textSecondary} /></Pressable>
        </View>
      )}
      <View style={s.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={editingMessage ? "Update your message…" : "Message…"}
          placeholderTextColor={t.textMuted}
          selectionColor={t.accent}
          style={s.input}
          multiline
          maxLength={2000}
        />
        <Pressable accessibilityLabel={editingMessage ? "Save edit" : "Send"} onPress={onSend} disabled={!canSend} style={({ pressed }) => [s.send, !canSend && { backgroundColor: t.surfacePressed }, pressed && { transform: [{ scale: 0.92 }] }]}>
          {canSend && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
          <ArrowUp size={20} strokeWidth={2.6} color={canSend ? "#fff" : t.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: t.bgSolid, borderTopWidth: 1, borderTopColor: t.border },
  context: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: t.surfaceSunken, borderRadius: 14, paddingVertical: 9, paddingLeft: 14, paddingRight: 8, marginBottom: 8, overflow: "hidden" },
  contextBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: t.accent },
  contextTitle: { fontSize: 12, fontWeight: "800", color: t.accentText },
  contextBody: { fontSize: 13.5, color: t.textSecondary, marginTop: 1 },
  close: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, backgroundColor: t.surfaceSunken, borderRadius: 24, borderWidth: 1, borderColor: t.border, padding: 4, paddingLeft: 16 },
  input: { flex: 1, maxHeight: 120, fontSize: 16, color: t.text, paddingTop: 10, paddingBottom: 9 },
  send: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
}));
