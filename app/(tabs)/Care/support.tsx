import Slider from "@react-native-community/slider";
import { CareCard, CarePage, careStyles } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";
import * as Haptics from "expo-haptics";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { Gauge, Gift, HeartHandshake, Plus, ShoppingBag, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

  const removeNeed = async (item: NeedItem) => {
    await saveProfile((mine?.needs || []).filter((need) => need.id !== item.id));
  };

  const saveOtish = async (value: number) => {
    if (!pairId || !uid) return;
    const rounded = Math.round(value);
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

  return (
    <CarePage
      eyebrow="EMOTIONAL SUPPORT AND NEEDS"
      title="What do you need?"
      subtitle={`A practical wish list and a private signal shared with ${partnerName || "your partner"}.`}
      icon={<HeartHandshake color="#fff" size={23} />}
    >
      <CareCard title="My needs and wishes" subtitle="Add gifts, practical things or anything you would appreciate" icon={<ShoppingBag color={palette.rose} size={20} />}>
        <View style={styles.inputRow}>
          <TextInput value={needText} onChangeText={setNeedText} onSubmitEditing={addNeed} placeholder="What would make life better?" placeholderTextColor="#9A919F" style={[careStyles.input, styles.input]} returnKeyType="done" />
          <Pressable accessibilityLabel="Add need" onPress={addNeed} style={styles.addButton}><Plus color="#fff" size={20} /></Pressable>
        </View>
        {!mine?.needs.length ? <Text style={styles.empty}>Your list is empty. Add something helpful, comforting or gift-worthy.</Text> : mine.needs.map((item) => (
          <View key={item.id} style={styles.needRow}><View style={styles.giftIcon}><Gift color={palette.rose} size={16} /></View><Text style={styles.needText}>{item.text}</Text><Pressable accessibilityLabel={`Remove ${item.text}`} onPress={() => removeNeed(item)} style={styles.delete}><Trash2 color="#B97A8C" size={16} /></Pressable></View>
        ))}
      </CareCard>

      <CareCard title={`${partnerName || "Partner"}'s needs and wishes`} subtitle="A quiet place to find meaningful gift and support ideas" icon={<Gift color={palette.plum} size={20} />}>
        {!partner?.needs.length ? <Text style={styles.empty}>{partnerName || "Your partner"} has not added anything yet.</Text> : partner.needs.map((item) => (
          <View key={item.id} style={styles.needRow}><View style={[styles.giftIcon, styles.partnerGift]}><Gift color={palette.plum} size={16} /></View><Text style={styles.needText}>{item.text}</Text></View>
        ))}
      </CareCard>

      <CareCard title="How OTISH are you?" subtitle="Move the scale from 1 to 10 — your latest time is saved" icon={<Gauge color={palette.plum} size={20} />}>
        <View style={styles.scaleValue}><Text style={styles.scaleNumber}>{otishValue}</Text><Text style={styles.scaleOutOf}>/ 10</Text></View>
        <Slider minimumValue={1} maximumValue={10} step={1} value={otishValue} onValueChange={(value) => setOtishValue(Math.round(value))} onSlidingComplete={saveOtish} minimumTrackTintColor={palette.rose} maximumTrackTintColor="rgba(91,46,117,0.18)" thumbTintColor={palette.rose} />
        <View style={styles.scaleLabels}><Text style={styles.scaleLabel}>1 · barely</Text><Text style={styles.scaleLabel}>10 · extremely</Text></View>
        <Text style={styles.timestamp}>{formatTimestamp(mine?.otish?.updatedAt)}</Text>
        <View style={styles.partnerSignal}><View><Text style={styles.partnerLabel}>{partnerName || "PARTNER"}</Text><Text style={styles.partnerTime}>{formatTimestamp(partner?.otish?.updatedAt)}</Text></View><Text style={styles.partnerScore}>{partner?.otish?.value || "—"}<Text style={styles.partnerOutOf}>/10</Text></Text></View>
      </CareCard>
    </CarePage>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginBottom: 5 },
  input: { flex: 1, marginBottom: 0 },
  addButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" },
  needRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(91,46,117,0.12)" },
  giftIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0F3" },
  partnerGift: { backgroundColor: "#F3EAF6" },
  needText: { flex: 1, color: palette.text, fontSize: 13.5, fontWeight: "800" },
  delete: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FBF2F5" },
  empty: { color: palette.muted, fontSize: 12.5, lineHeight: 19, paddingVertical: 6 },
  scaleValue: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", marginVertical: 6 },
  scaleNumber: { color: palette.rose, fontSize: 54, fontWeight: "900", letterSpacing: -2 },
  scaleOutOf: { color: palette.muted, fontSize: 16, fontWeight: "900", marginBottom: 9, marginLeft: 4 },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  scaleLabel: { color: palette.muted, fontSize: 10, fontWeight: "800" },
  timestamp: { color: palette.plum, fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 11 },
  partnerSignal: { marginTop: 16, minHeight: 68, borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(91,46,117,0.09)", borderWidth: 1, borderColor: "rgba(91,46,117,0.12)" },
  partnerLabel: { color: palette.plum, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  partnerTime: { color: palette.muted, fontSize: 10, marginTop: 4 },
  partnerScore: { color: palette.plum, fontSize: 28, fontWeight: "900" },
  partnerOutOf: { fontSize: 12, color: palette.muted },
});
