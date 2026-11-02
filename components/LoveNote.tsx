import { PenLine } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Field, Sheet } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  title: string;
  note: string;
  timestamp?: number;
  /** Called with the new text. Drafts stay local until saved, so live updates never clobber typing. */
  onSave?: (text: string) => Promise<void> | void;
  readOnly?: boolean;
  compact?: boolean;
};

export const formatNoteTime = (epoch?: number) => {
  if (!epoch) return "";
  const target = new Date(epoch);
  const now = new Date();
  const days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()) / 86400000);
  const time = target.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${days} days ago`;
  return target.toLocaleDateString([], { day: "numeric", month: "short" });
};

export default function LoveNote({ title, note, timestamp, onSave, readOnly = false }: Props) {
  const t = useTheme();
  const s = useStyles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const hasNote = note.trim().length > 0;

  const startEdit = () => { setDraft(note); setOpen(true); };
  const save = async () => {
    setSaving(true);
    try { await onSave?.(draft.trim()); setOpen(false); } finally { setSaving(false); }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={readOnly ? () => hasNote && setOpen(true) : startEdit}
      style={({ pressed }) => [s.card, readOnly && hasNote && s.cardReceived, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={s.head}>
        <Text style={[s.title, readOnly && hasNote && { color: t.accentText }]} numberOfLines={1}>{title}</Text>
        {!readOnly && <PenLine color={t.textMuted} size={14} />}
      </View>
      <Text style={[s.body, !hasNote && s.placeholder]} numberOfLines={5}>
        {hasNote ? note : readOnly ? "No note yet 💭" : "Leave them something sweet…"}
      </Text>
      {!!timestamp && hasNote && <Text style={s.time}>{formatNoteTime(timestamp)}</Text>}

      <Sheet visible={open} onClose={() => setOpen(false)} eyebrow={readOnly ? "LOVE NOTE" : "YOUR NOTE"} title={title}>
        {readOnly ? (
          <>
            <Text style={s.full}>{note}</Text>
            {!!timestamp && <Text style={[s.time, { marginTop: 12 }]}>{formatNoteTime(timestamp)}</Text>}
          </>
        ) : (
          <>
            <Field value={draft} onChangeText={setDraft} multiline autoFocus placeholder="Write something meaningful…" maxLength={500} inputStyle={{ minHeight: 140 }} />
            <Text style={s.count}>{draft.length}/500</Text>
            <Button title="Save note" onPress={save} loading={saving} style={{ marginTop: 10 }} />
          </>
        )}
      </Sheet>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flex: 1, minHeight: 156, padding: 15, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow },
  cardReceived: { backgroundColor: t.accentSoft, borderColor: "transparent" },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  title: { color: t.text, fontSize: 14, fontWeight: "800", flex: 1 },
  body: { color: t.text, fontSize: 14, lineHeight: 20, marginTop: 8, flex: 1 },
  placeholder: { color: t.textMuted, fontStyle: "italic" },
  time: { color: t.textMuted, fontSize: 11, fontWeight: "600", marginTop: 8 },
  full: { color: t.text, fontSize: 18, lineHeight: 27, fontWeight: "500" },
  count: { color: t.textMuted, fontSize: 11.5, textAlign: "right", marginTop: -6 },
}));
