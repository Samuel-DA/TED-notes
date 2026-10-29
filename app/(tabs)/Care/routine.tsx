import { CareCard, CarePage, careStyles } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";
import * as Haptics from "expo-haptics";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { BellRing, Check, ClipboardCheck, Heart, Plus, Square, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

  return (
    <CarePage
      eyebrow="DAILY RHYTHM"
      title="Our routines"
      subtitle="Build your own list, check it daily and quietly cheer each other on."
      icon={<ClipboardCheck color="#fff" size={23} />}
    >
      <CareCard title="My daily routine" subtitle={`${myDone.length} of ${myItems.length} complete today`}>
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={addItem}
            placeholder="Add a daily habit…"
            placeholderTextColor="#9A919F"
            style={[careStyles.input, styles.input]}
            returnKeyType="done"
          />
          <Pressable accessibilityLabel="Add routine item" onPress={addItem} style={styles.addButton}>
            <Plus color="#fff" size={20} />
          </Pressable>
        </View>
        {myItems.length === 0 ? (
          <Text style={styles.empty}>Your routine is empty. Add the small things that help your day feel grounded.</Text>
        ) : myItems.map((item, index) => {
          const done = myDone.includes(item.id);
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.flowRail}>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => toggleItem(item)} style={[styles.check, done && styles.checkDone]}>
                  {done ? <Check color="#fff" size={16} strokeWidth={3} /> : <Square color={palette.plum} size={17} />}
                </Pressable>
                {index < myItems.length - 1 && <View style={[styles.connector, done && styles.connectorDone]} />}
              </View>
              <View style={styles.itemCopy}><Text style={styles.stepLabel}>DAILY ITEM</Text><Text style={[styles.itemText, done && styles.itemDone]}>{item.text}</Text></View>
              <Pressable accessibilityLabel={`Remove ${item.text}`} onPress={() => removeItem(item)} style={styles.delete}>
                <Trash2 color="#B97A8C" size={16} />
              </Pressable>
            </View>
          );
        })}
      </CareCard>

      <CareCard title={`${partnerName}'s routine`} subtitle={`${partnerDone.length} of ${partner?.items.length || 0} complete today`}>
        {!partner?.items.length ? (
          <Text style={styles.empty}>{partnerName} has not created a routine yet.</Text>
        ) : partner.items.map((item, index) => {
          const done = partnerDone.includes(item.id);
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.flowRail}>
                <View style={[styles.check, done && styles.partnerCheck]}>{done ? <Check color="#fff" size={16} strokeWidth={3} /> : <Square color={palette.plum} size={17} />}</View>
                {index < partner.items.length - 1 && <View style={[styles.connector, done && styles.partnerConnectorDone]} />}
              </View>
              <View style={styles.itemCopy}><Text style={styles.stepLabel}>DAILY ITEM</Text><Text style={[styles.itemText, done && styles.itemDone]}>{item.text}</Text></View>
            </View>
          );
        })}
        {!!partner?.items.length && partnerDone.length < partner.items.length && <Pressable disabled={nudging} onPress={nudgePartner} style={[styles.nudgeButton, nudging && styles.nudgeDisabled]}><BellRing color={palette.plum} size={17} /><Text style={styles.nudgeText}>{nudging ? "Nudge sent" : `Nudge ${partnerName}`}</Text></Pressable>}
        <Pressable disabled={cheering} onPress={cheerPartner} style={[styles.cheerButton, cheering && styles.nudgeDisabled]}><Heart color="#fff" size={17} fill="#fff" /><Text style={styles.cheerText}>{cheering ? "Sent with love 💛" : "Proud of you babyy"}</Text></Pressable>
      </CareCard>
    </CarePage>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: "row", gap: 9, alignItems: "flex-start", marginBottom: 6 },
  input: { flex: 1, marginBottom: 0 },
  addButton: { width: 50, height: 50, borderRadius: 14, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" },
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 11 },
  flowRail: { width: 32, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  check: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F2F7", borderWidth: 1, borderColor: "rgba(91,46,117,0.16)", zIndex: 2 },
  checkDone: { backgroundColor: palette.rose },
  partnerCheck: { backgroundColor: palette.success },
  connector: { position: "absolute", top: "50%", marginTop: 16, bottom: -34, width: 3, borderRadius: 2, backgroundColor: "rgba(91,46,117,0.14)" },
  connectorDone: { backgroundColor: "rgba(181,68,90,0.52)" },
  partnerConnectorDone: { backgroundColor: "rgba(46,153,116,0.50)" },
  itemCopy: { flex: 1, minWidth: 0 },
  stepLabel: { color: palette.rose, fontSize: 8.5, fontWeight: "800", letterSpacing: 1, marginBottom: 3 },
  itemText: { color: palette.text, fontSize: 15, fontWeight: "700" },
  itemDone: { color: palette.muted, textDecorationLine: "line-through" },
  delete: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FBF2F5" },
  nudgeButton: { minHeight: 46, marginTop: 12, borderRadius: 15, backgroundColor: "#F1E7F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  nudgeText: { color: palette.plum, fontSize: 12.5, fontWeight: "900" },
  nudgeDisabled: { opacity: 0.58 },
  cheerButton: { minHeight: 48, marginTop: 10, borderRadius: 15, backgroundColor: palette.rose, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  cheerText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  empty: { color: palette.muted, fontSize: 12.5, lineHeight: 19, paddingVertical: 6 },
});
