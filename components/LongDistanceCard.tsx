import { palette } from "@/constants/design";
import { db } from "@/firebase";
import { CalendarHeart, Check, Plane, X } from "lucide-react-native";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { notifyPartner } from "@/services/notifications";

type Props = {
  pairId: string;
  uid: string;
  myName: string;
  partnerName: string;
};

export default function LongDistanceCard({ pairId, uid, myName, partnerName }: Props) {
  const [nextVisitAt, setNextVisitAt] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [dateText, setDateText] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, "pairs", pairId), (snapshot) => {
      const value = snapshot.data()?.nextVisitAt;
      setNextVisitAt(typeof value === "number" ? value : null);
    });
  }, [pairId]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    if (!nextVisitAt || now === null) return null;
    const remaining = Math.max(0, nextVisitAt - now);
    const days = Math.ceil(remaining / 86_400_000);
    return {
      days,
      date: new Date(nextVisitAt).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
  }, [nextVisitAt, now]);

  const saveDate = async () => {
    const parsed = new Date(`${dateText}T12:00:00`);
    if (!dateText || Number.isNaN(parsed.getTime())) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "pairs", pairId),
        { nextVisitAt: parsed.getTime(), nextVisitUpdatedAt: serverTimestamp() },
        { merge: true },
      );
      await notifyPartner({ pairId, currentUid: uid, route: "home", action: "reunion_date_updated", title: "The countdown changed ✈️", body: `${myName} updated your next-together date to ${parsed.toLocaleDateString()}.` });
      setEditing(false);
      setDateText("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}><Plane color={palette.rose} size={22} /></View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>ACROSS THE MILES</Text>
          <Text style={styles.title}>Next time together</Text>
        </View>
        {countdown && <Text style={styles.days}>{countdown.days}</Text>}
      </View>

      {countdown ? (
        <>
          <Text style={styles.countdownText}>
            {countdown.days === 0 ? "Today is the day ❤️" : `${countdown.days} day${countdown.days === 1 ? "" : "s"} until ${partnerName}`}
          </Text>
          <Text style={styles.date}>{countdown.date}</Text>
        </>
      ) : (
        <Text style={styles.emptyText}>Give the distance an ending to look forward to.</Text>
      )}

      {editing ? (
        <View style={styles.editorRow}>
          <TextInput
            value={dateText}
            onChangeText={setDateText}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#A49AAA"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />
          <Pressable onPress={saveDate} disabled={saving} style={styles.confirmButton}>
            <Check color="#fff" size={18} />
          </Pressable>
          <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
            <X color={palette.muted} size={18} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => setEditing(true)} style={styles.action}>
          <CalendarHeart color="#F0B9C4" size={17} />
          <Text style={styles.actionText}>{countdown ? "Change reunion date" : "Set reunion date"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)" },
  topRow: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFF0F3", alignItems: "center", justifyContent: "center" },
  heading: { flex: 1, marginLeft: 12 },
  eyebrow: { color: "#F0B9C4", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 2 },
  days: { color: "#F6CAD3", fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  countdownText: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 18 },
  date: { color: "rgba(255,255,255,0.58)", fontSize: 13, marginTop: 4 },
  emptyText: { color: "rgba(255,255,255,0.62)", fontSize: 14, lineHeight: 21, marginTop: 16 },
  action: { marginTop: 18, minHeight: 46, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  editorRow: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 8 },
  input: { flex: 1, height: 46, borderRadius: 14, backgroundColor: "#F7F3F8", paddingHorizontal: 14, color: palette.text, fontWeight: "700" },
  confirmButton: { width: 46, height: 46, borderRadius: 14, backgroundColor: palette.success, alignItems: "center", justifyContent: "center" },
  cancelButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F4F1F5", alignItems: "center", justifyContent: "center" },
});
