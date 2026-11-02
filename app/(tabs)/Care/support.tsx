import { LinearGradient } from "expo-linear-gradient";
import { CarePage } from "@/components/care/CareUI";
import { Card, EmptyState, SectionHeader, Segmented } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";
import * as Haptics from "expo-haptics";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { ArrowUp, Gift, HeartHandshake, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type NeedItem = { id: string; text: string; createdAt: number };
type CareProfile = {
  ownerUid: string;
  needs: NeedItem[];
  otish?: { value: number; updatedAt?: Timestamp };
};

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTimestamp(value?: Timestamp) {
  if (!value?.toDate) return "Not shared yet";
  return `Updated ${value.toDate().toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function SupportPage() {
  const { pairId, uid, myName, partnerName } = useApp();
  const [profiles, setProfiles] = useState<Record<string, CareProfile>>({});
  const [needText, setNeedText] = useState("");
  const [otishValue, setOtishValue] = useState(5);
  const [saving, setSaving] = useState(false);
  const t = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<"mine" | "partner">("partner");

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(collection(db, "pairs", pairId, "careProfiles"), (snapshot) => {
      const next: Record<string, CareProfile> = {};
      snapshot.docs.forEach((profileDoc) => {
        const data = profileDoc.data() as CareProfile;
        next[data.ownerUid || profileDoc.id] = {
          ownerUid: data.ownerUid || profileDoc.id,
          needs: Array.isArray(data.needs) ? data.needs : [],
          otish: data.otish,
        };
      });
      setProfiles(next);
    });
  }, [pairId]);

  const mine = uid ? profiles[uid] : undefined;
  const partner = useMemo(
    () => Object.values(profiles).find((profile) => profile.ownerUid !== uid),
    [profiles, uid],
  );

  useEffect(() => {
    if (mine?.otish?.value) setOtishValue(mine.otish.value);
  }, [mine?.otish?.value]);

  const saveProfile = async (needs: NeedItem[], otish = mine?.otish) => {
    if (!pairId || !uid) return;
    await setDoc(doc(db, "pairs", pairId, "careProfiles", uid), {
      ownerUid: uid,
      needs,
      ...(otish ? { otish } : {}),
      updatedAt: serverTimestamp(),
    });
  };

  const addNeed = async () => {
    const clean = needText.trim();
    if (!clean || saving || !pairId || !uid || (mine?.needs.length || 0) >= 30) return;
    setSaving(true);
    try {
      await saveProfile([...(mine?.needs || []), { id: makeId(), text: clean, createdAt: Date.now() }]);
      setNeedText("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await notifyPartner({
        pairId,
        currentUid: uid,
        route: "care_support",
        action: "need_added",
        title: `${myName || "Your partner"} added a wish 🎁`,
        body: `“${clean}” was added to their needs list.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (item: NeedItem) => Alert.alert("Remove this?", `“${item.text}” will be removed from your list.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => void removeNeed(item) },
  ]);

  const removeNeed = async (item: NeedItem) => {
    await saveProfile((mine?.needs || []).filter((need) => need.id !== item.id));
  };

  const saveOtish = async (value: number) => {
    if (!pairId || !uid) return;
    const rounded = Math.round(value);
    if (rounded === mine?.otish?.value) return;
    setOtishValue(rounded);
    await saveProfile(mine?.needs || [], { value: rounded, updatedAt: serverTimestamp() as unknown as Timestamp });
    void Haptics.selectionAsync();
    await notifyPartner({
      pairId,
      currentUid: uid,
      route: "care_support",
      action: "otish_updated",
      title: "OTISH signal updated",
      body: `${myName || "Your partner"} is ${rounded}/10 OTISH right now.`,
    });
  };

  const partnerLabel = partnerName || "Partner";
  const list = tab === "mine" ? mine?.needs || [] : partner?.needs || [];
  const partnerScore = partner?.otish?.value;

  return (
    <CarePage eyebrow="SUPPORT AND NEEDS" title="What do you need?" subtitle={`A wish list and a private signal shared with ${partnerLabel}.`} icon={<HeartHandshake color="#fff" size={23} />}>
      <Card variant="hero" style={styles.signalCard}>
        <View style={styles.signalTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{partnerLabel.toUpperCase()}&apos;S OTISH SIGNAL</Text>
            <Text style={styles.signalTime}>{formatTimestamp(partner?.otish?.updatedAt)}</Text>
          </View>
          <Text style={styles.partnerScore}>{partnerScore ?? "—"}<Text style={styles.outOf}>/10</Text></Text>
        </View>
        <View style={styles.meter}>
          {Array.from({ length: 10 }).map((_, i) => <View key={i} style={[styles.meterBar, partnerScore && i < partnerScore ? { backgroundColor: t.accent, opacity: 0.45 + (i / 10) * 0.55 } : null]} />)}
        </View>
      </Card>

      <SectionHeader title="How OTISH are you?" />
      <Card style={styles.mineCard}>
        <View style={styles.scale}>
          {Array.from({ length: 10 }).map((_, i) => {
            const value = i + 1;
            const active = value === otishValue;
            const filled = value <= otishValue;
            return (
              <Pressable key={value} accessibilityLabel={`Set ${value} out of 10`} onPress={() => void saveOtish(value)} style={({ pressed }) => [styles.dot, filled && { backgroundColor: t.accentSoft, borderColor: "transparent" }, active && styles.dotActive, pressed && { transform: [{ scale: 0.9 }] }]}>
                {active && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />}
                <Text style={[styles.dotText, filled && { color: t.accentText }, active && { color: "#fff" }]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.scaleLabels}><Text style={styles.scaleLabel}>Barely</Text><Text style={styles.scaleLabel}>Extremely</Text></View>
        <Text style={styles.myTime}>{formatTimestamp(mine?.otish?.updatedAt)} · tap a number to share</Text>
      </Card>

      <SectionHeader title="Needs and wishes" />
      <Segmented value={tab} onChange={setTab} options={[{ value: "partner", label: `${partnerLabel}'s list`, count: partner?.needs.length || 0 }, { value: "mine", label: "My list", count: mine?.needs.length || 0 }]} style={{ marginBottom: 12 }} />

      {tab === "mine" && (
        <View style={styles.composer}>
          <TextInput value={needText} onChangeText={setNeedText} onSubmitEditing={addNeed} placeholder="What would make life better?" placeholderTextColor={t.textMuted} selectionColor={t.accent} style={styles.input} returnKeyType="done" maxLength={120} />
          <Pressable accessibilityLabel="Add to list" onPress={addNeed} disabled={!needText.trim() || saving} style={[styles.add, !needText.trim() && { backgroundColor: t.surfacePressed }]}>
            {!!needText.trim() && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
            <ArrowUp color={needText.trim() ? "#fff" : t.textMuted} size={18} strokeWidth={2.6} />
          </Pressable>
        </View>
      )}

      {list.length === 0 ? (
        <EmptyState icon={Gift} title={tab === "mine" ? "Your list is empty" : `${partnerLabel} hasn't added anything yet`} body={tab === "mine" ? "Add gifts, practical help or anything comforting. They'll see it here." : "When they do, it's a quiet place to find meaningful ideas."} />
      ) : (
        <Card padded={false} style={{ borderRadius: 22 }}>
          {list.map((item, index) => (
            <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={[styles.gift, tab === "partner" && { backgroundColor: t.violetSoft }]}><Gift color={tab === "partner" ? t.violetText : t.accentText} size={16} /></View>
              <Text style={styles.needText}>{item.text}</Text>
              {tab === "mine" && <Pressable accessibilityLabel={`Remove ${item.text}`} hitSlop={8} onPress={() => confirmRemove(item)} style={styles.delete}><Trash2 color={t.textMuted} size={15} /></Pressable>}
            </View>
          ))}
        </Card>
      )}
    </CarePage>
  );
}

const useStyles = makeStyles((t) => ({
  signalCard: { padding: 18, borderRadius: 24 },
  signalTop: { flexDirection: "row", alignItems: "center" },
  eyebrow: { color: t.accentText, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  signalTime: { color: t.textSecondary, fontSize: 12.5, marginTop: 4 },
  partnerScore: { color: t.text, fontSize: 40, fontWeight: "900", letterSpacing: -1.5 },
  outOf: { color: t.textMuted, fontSize: 16, fontWeight: "700" },
  meter: { flexDirection: "row", gap: 4, marginTop: 14 },
  meterBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: t.surfaceSunken },
  mineCard: { padding: 16, borderRadius: 22 },
  scale: { flexDirection: "row", gap: 5 },
  dot: { flex: 1, aspectRatio: 0.8, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, overflow: "hidden" },
  dotActive: { transform: [{ scale: 1.08 }] },
  dotText: { color: t.textSecondary, fontSize: 14, fontWeight: "800" },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  scaleLabel: { color: t.textMuted, fontSize: 11.5, fontWeight: "700" },
  myTime: { color: t.textMuted, fontSize: 12, textAlign: "center", marginTop: 12 },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, padding: 5, paddingLeft: 16, borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginBottom: 12, ...t.shadow },
  input: { flex: 1, color: t.text, fontSize: 15.5, minHeight: 44 },
  add: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: t.border },
  gift: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: t.accentSoft },
  needText: { flex: 1, color: t.text, fontSize: 15, fontWeight: "600" },
  delete: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
}));
