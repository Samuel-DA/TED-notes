import { Copy, Pencil, Reply, Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  /** Emoji the current user already reacted with (shown highlighted; tapping again removes it). */
  current?: string;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  preview?: string;
};

function Action({ icon: Icon, label, onPress, danger }: { icon: typeof Copy; label: string; onPress?: () => void; danger?: boolean }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.action, pressed && { backgroundColor: t.surfacePressed }]}>
      <Icon color={danger ? t.dangerText : t.text} size={18} />
      <Text style={[s.actionText, danger && { color: t.dangerText }]}>{label}</Text>
    </Pressable>
  );
}

const EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

export function EmojiPicker({ onSelect, onClose, current, canManage = false, onEdit, onDelete, onReply, onCopy, preview }: Props) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={s.root}>
      <Pressable style={[s.backdrop, { backgroundColor: t.overlay }]} onPress={onClose} accessibilityLabel="Close" />
      <View style={s.panel}>
        {!!preview && <View style={s.preview}><Text style={s.previewText} numberOfLines={3}>{preview}</Text></View>}
        <View style={s.emojis}>
          {EMOJIS.map((emoji) => (
            <Pressable key={emoji} onPress={() => onSelect(emoji)} style={({ pressed }) => [s.emoji, current === emoji && s.emojiActive, pressed && { transform: [{ scale: 1.2 }] }]}>
              <Text style={s.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.actions}>
          {onReply && <Action icon={Reply} label="Reply" onPress={onReply} />}
          {onCopy && <Action icon={Copy} label="Copy text" onPress={onCopy} />}
          {canManage && <Action icon={Pencil} label="Edit" onPress={onEdit} />}
          {canManage && <Action icon={Trash2} label="Delete" onPress={onDelete} danger />}
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  panel: { width: "100%", maxWidth: 340, gap: 10 },
  preview: { alignSelf: "center", maxWidth: "90%", backgroundColor: t.surfaceRaised, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, ...t.shadow },
  previewText: { color: t.text, fontSize: 15, lineHeight: 21 },
  emojis: { flexDirection: "row", justifyContent: "space-between", backgroundColor: t.surfaceRaised, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: t.border, ...t.shadowLg },
  emoji: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emojiActive: { backgroundColor: t.accentSoft },
  emojiText: { fontSize: 27, lineHeight: 33 },
  actions: { backgroundColor: t.surfaceRaised, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: t.border, ...t.shadowLg },
  action: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: 14 },
  actionText: { color: t.text, fontSize: 15, fontWeight: "700" },
}));
