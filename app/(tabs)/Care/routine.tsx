import { CarePage } from "@/components/care/CareUI";
import { Button, Card, EmptyState, Segmented } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";
import * as Haptics from "expo-haptics";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowUp, BellRing, Check, ClipboardCheck, Heart, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type RoutineItem = { id: string; text: string };
type RoutineData = {
  ownerUid: string;
  items: RoutineItem[];
  completions: Record<string, string[]>;
};

function localDateKey() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function makeItemId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function RoutinePage() {
  const { pairId, uid, myName, partnerName } = useApp();
  const [routines, setRoutines] = useState<Record<string, RoutineData>>({});
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [cheering, setCheering] = useState(false);
  const today = localDateKey();
  const t = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<"mine" | "partner">("mine");

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(collection(db, "pairs", pairId, "routines"), (snapshot) => {
      const next: Record<string, RoutineData> = {};
      snapshot.docs.forEach((item) => {
        const data = item.data() as RoutineData;
        next[data.ownerUid || item.id] = {
          ownerUid: data.ownerUid || item.id,
          items: Array.isArray(data.items) ? data.items : [],
          completions: data.completions || {},
        };
      });
      setRoutines(next);
    });
  }, [pairId]);

  const mine = uid ? routines[uid] : undefined;
  const partner = useMemo(
    () => Object.values(routines).find((routine) => routine.ownerUid !== uid),
    [routines, uid],
  );
  const myItems = mine?.items || [];
  const myDone = mine?.completions?.[today] || [];
  const partnerDone = partner?.completions?.[today] || [];

  const saveMine = async (items: RoutineItem[], completions = mine?.completions || {}) => {
    if (!pairId || !uid) return;
    const compactCompletions = Object.fromEntries(
      Object.entries(completions).sort(([left], [right]) => left.localeCompare(right)).slice(-60),
    );
    // Optimistic: reflect the change immediately; the snapshot listener confirms it.
    setRoutines((current) => ({ ...current, [uid]: { ownerUid: uid, items, completions: compactCompletions } }));
    await setDoc(doc(db, "pairs", pairId, "routines", uid), {
      ownerUid: uid,
      items,
      completions: compactCompletions,
      updatedAt: serverTimestamp(),
    });
  };

  const addItem = async () => {
    const clean = text.trim();
    if (!clean || saving || myItems.length >= 30 || !pairId || !uid) return;
    setSaving(true);
    try {
      await saveMine([...myItems, { id: makeItemId(), text: clean }]);
      setText("");
      await notifyPartner({
        pairId,
        currentUid: uid,
        route: "care_routine",
        action: "routine_item_added",
        title: "Daily routine updated 📋",
        body: `${myName || "Your partner"} added “${clean}” to their routine.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (item: RoutineItem) => Alert.alert("Remove this habit?", `“${item.text}” will be removed from your routine.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => void removeItem(item) },
  ]);

  const removeItem = async (item: RoutineItem) => {
    const cleanedCompletions = Object.fromEntries(
      Object.entries(mine?.completions || {}).map(([date, ids]) => [date, ids.filter((id) => id !== item.id)]),
    );
    await saveMine(myItems.filter((current) => current.id !== item.id), cleanedCompletions);
  };

  const toggleItem = async (item: RoutineItem) => {
    if (!pairId || !uid) return;
    const wasDone = myDone.includes(item.id);
    const nextDone = wasDone ? myDone.filter((id) => id !== item.id) : [...myDone, item.id];
    await saveMine(myItems, { ...(mine?.completions || {}), [today]: nextDone });
    void Haptics.selectionAsync();
    if (!wasDone && myItems.length > 0 && nextDone.length === myItems.length) {
      await notifyPartner({
        pairId,
        currentUid: uid,
        route: "care_routine",
        action: "routine_completed",
        title: "Routine complete ✅",
        body: `${myName || "Your partner"} finished their daily routine.`,
      });
    }
  };

  const nudgePartner = async () => {
    if (!pairId || !uid || nudging || !partner?.items.length || partnerDone.length === partner.items.length) return;
    setNudging(true);
    try {
      await notifyPartner({
        pairId,
        currentUid: uid,
        route: "care_routine",
        action: "routine_nudge",
        title: `${myName || "Your partner"} sent a gentle nudge 💛`,
        body: `You still have ${partner.items.length - partnerDone.length} routine item${partner.items.length - partnerDone.length === 1 ? "" : "s"} left today.`,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setTimeout(() => setNudging(false), 60_000);
    }
  };

  const cheerPartner = async () => {
    if (!pairId || !uid || cheering) return;
    setCheering(true);
    try {
      await notifyPartner({
        pairId,
        currentUid: uid,
        route: "care_routine",
        action: "routine_proud_of_you",
        title: "Proud of you, babyy 💛",
        body: `${myName || "Your partner"} is proud of you. Keep going at your own pace.`,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setTimeout(() => setCheering(false), 60_000);
    }
  };

  const partnerTotal = partner?.items.length || 0;
  const partnerName_ = partnerName || "Partner";
  const showing = tab === "mine" ? myItems : partner?.items || [];
  const doneIds = tab === "mine" ? myDone : partnerDone;

  return (
    <CarePage eyebrow="DAILY RHYTHM" title="Our routines" subtitle="Your own daily habits, with a quiet cheer for each other." icon={<ClipboardCheck color="#fff" size={23} />}>
      <View style={styles.progressRow}>
        <Progress label="You" done={myDone.length} total={myItems.length} active={tab === "mine"} onPress={() => setTab("mine")} />
        <Progress label={partnerName_} done={partnerDone.length} total={partnerTotal} active={tab === "partner"} onPress={() => setTab("partner")} />
      </View>

      <Segmented value={tab} onChange={setTab} options={[{ value: "mine", label: "My routine" }, { value: "partner", label: `${partnerName_}'s` }]} style={{ marginBottom: 14 }} />

      {tab === "mine" && (
        <View style={styles.composer}>
          <TextInput value={text} onChangeText={setText} onSubmitEditing={addItem} placeholder="Add a daily habit…" placeholderTextColor={t.textMuted} selectionColor={t.accent} style={styles.input} returnKeyType="done" maxLength={80} />
          <Pressable accessibilityLabel="Add habit" onPress={addItem} disabled={!text.trim() || saving} style={[styles.add, !text.trim() && { backgroundColor: t.surfacePressed }]}>
            {!!text.trim() && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
            <ArrowUp color={text.trim() ? "#fff" : t.textMuted} size={18} strokeWidth={2.6} />
          </Pressable>
        </View>
      )}

      {showing.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={tab === "mine" ? "Build your routine" : `${partnerName_} hasn't added habits yet`} body={tab === "mine" ? "Add the small things that help your day feel grounded: water, a walk, prayer, an early night." : "Once they do, you'll see their progress here each day."} />
      ) : (
        <Card padded={false} style={styles.list}>
          {showing.map((item, index) => {
            const done = doneIds.includes(item.id);
            const mineTab = tab === "mine";
            return (
              <Pressable key={item.id} disabled={!mineTab} onPress={() => toggleItem(item)} onLongPress={mineTab ? () => confirmRemove(item) : undefined} style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && { backgroundColor: t.surfacePressed }]}>
                <View style={[styles.check, done && { backgroundColor: mineTab ? t.accent : t.success, borderColor: "transparent" }]}>
                  {done && <Check color="#fff" size={15} strokeWidth={3} />}
                </View>
                <Text style={[styles.itemText, done && styles.itemDone]} numberOfLines={2}>{item.text}</Text>
                {mineTab && (
                  <Pressable accessibilityLabel={`Remove ${item.text}`} hitSlop={8} onPress={() => confirmRemove(item)} style={styles.delete}>
                    <Trash2 color={t.textMuted} size={15} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </Card>
      )}

      {tab === "partner" && (
        <View style={{ gap: 10, marginTop: 14 }}>
          {partnerTotal > 0 && partnerDone.length < partnerTotal && (
            <Button title={nudging ? "Nudge sent" : `Gently nudge ${partnerName_}`} icon={BellRing} variant="secondary" disabled={nudging} onPress={nudgePartner} />
          )}
          <Button title={cheering ? "Sent with love 💛" : "Send “proud of you”"} icon={Heart} disabled={cheering} onPress={cheerPartner} />
        </View>
      )}
      {tab === "mine" && myItems.length > 0 && <Text style={styles.hint}>Tap to tick off · long-press to remove</Text>}
    </CarePage>
  );
}

function Progress({ label, done, total, active, onPress }: { label: string; done: number; total: number; active: boolean; onPress: () => void }) {
  const t = useTheme();
  const styles = useStyles();
  const pct = total ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <Pressable onPress={onPress} style={[styles.progress, active && { borderColor: t.accent }]}>
      <Text style={styles.progressLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.progressValue}>{done}<Text style={styles.progressTotal}>/{total}</Text></Text>
      <View style={styles.track}><View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: complete ? t.success : t.accent }]} /></View>
      <Text style={[styles.progressState, complete && { color: t.successText }]}>{total === 0 ? "No habits yet" : complete ? "All done today ✓" : `${total - done} to go`}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  progressRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  progress: { flex: 1, padding: 14, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border, ...t.shadow },
  progressLabel: { color: t.textSecondary, fontSize: 12.5, fontWeight: "700" },
  progressValue: { color: t.text, fontSize: 28, fontWeight: "900", letterSpacing: -1, marginTop: 2 },
  progressTotal: { color: t.textMuted, fontSize: 18, fontWeight: "700" },
  track: { height: 6, borderRadius: 3, backgroundColor: t.surfaceSunken, marginTop: 8, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  progressState: { color: t.textMuted, fontSize: 11.5, fontWeight: "600", marginTop: 7 },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, padding: 5, paddingLeft: 16, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginBottom: 12, ...t.shadow },
  input: { flex: 1, color: t.text, fontSize: 15.5, minHeight: 44 },
  add: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  list: { borderRadius: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 15, paddingHorizontal: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: t.border },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: t.borderStrong, alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1, color: t.text, fontSize: 15.5, fontWeight: "600" },
  itemDone: { color: t.textMuted, textDecorationLine: "line-through" },
  delete: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  hint: { color: t.textMuted, fontSize: 12, textAlign: "center", marginTop: 12 },
}));
