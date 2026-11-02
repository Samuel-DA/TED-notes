import { CalendarHeart, Plane } from "lucide-react-native";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import DatePicker from "@/components/ui/DatePicker";
import { Button, Card, Sheet } from "@/components/ui/kit";
import { db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { notifyPartner } from "@/services/notifications";
import { dayDiff, fromKey, toKey } from "@/utils/dayKey";

type Props = {
  pairId: string;
  uid: string;
  myName: string;
  partnerName: string;
  /** Pass when the parent already listens to the pair document (avoids a second listener). */
  nextVisitAt?: number | null;
};

export default function LongDistanceCard({ pairId, uid, myName, partnerName, nextVisitAt: provided }: Props) {
  const t = useTheme();
  const s = useStyles();
  const [own, setOwn] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nextVisitAt = provided !== undefined ? provided : own;

  useEffect(() => {
    if (provided !== undefined) return;
    return onSnapshot(doc(db, "pairs", pairId), (snapshot) => {
      const value = snapshot.data()?.nextVisitAt;
      setOwn(typeof value === "number" ? value : null);
    });
  }, [pairId, provided]);

  const today = useMemo(() => new Date(), []);
  const days = nextVisitAt ? dayDiff(new Date(nextVisitAt), today) : null;
  const upcoming = days !== null && days >= 0;

  const openPicker = () => { setPicked(nextVisitAt && upcoming ? toKey(new Date(nextVisitAt)) : null); setOpen(true); };
  const save = async () => {
    if (!picked) return;
    const at = fromKey(picked).getTime();
    setSaving(true);
    try {
      await setDoc(doc(db, "pairs", pairId), { nextVisitAt: at, nextVisitUpdatedAt: serverTimestamp() }, { merge: true });
      setOpen(false);
      void notifyPartner({ pairId, currentUid: uid, route: "home", action: "reunion_date_updated", title: "The countdown changed ✈️", body: `${myName} set your next time together for ${fromKey(picked).toLocaleDateString(undefined, { day: "numeric", month: "long" })}.` });
    } finally { setSaving(false); }
  };

  return (
    <Card style={s.card}>
      <View style={s.top}>
        <View style={s.icon}><Plane color={t.accentText} size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>ACROSS THE MILES</Text>
          <Text style={s.title}>Next time together</Text>
        </View>
        {upcoming && (
          <View style={s.counter}>
            <Text style={s.days}>{days}</Text>
            <Text style={s.daysLabel}>{days === 1 ? "day" : "days"}</Text>
          </View>
        )}
      </View>
      <Text style={s.body}>
        {upcoming
          ? days === 0 ? `Today's the day. Enjoy every minute with ${partnerName} ❤️` : `Until you see ${partnerName} on ${new Date(nextVisitAt!).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}.`
          : nextVisitAt ? "Hope the last visit was lovely. When's the next one?" : "Give the distance an ending to look forward to."}
      </Text>
      <Button title={upcoming ? "Change date" : "Set reunion date"} icon={CalendarHeart} variant="secondary" size="sm" onPress={openPicker} style={{ marginTop: 14 }} />

      <Sheet visible={open} onClose={() => setOpen(false)} eyebrow="COUNTDOWN" title="When will you be together?">
        <DatePicker value={picked} onChange={setPicked} minDate={toKey(today)} />
        <Button title={picked ? `Save ${fromKey(picked).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "Pick a date"} disabled={!picked} loading={saving} onPress={save} style={{ marginTop: 16 }} />
      </Sheet>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { marginBottom: 12, padding: 18, borderRadius: 24 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: t.accentSoft },
  eyebrow: { color: t.textMuted, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: t.text, fontSize: 17, fontWeight: "800", marginTop: 2 },
  counter: { alignItems: "flex-end" },
  days: { color: t.accent, fontSize: 34, fontWeight: "900", letterSpacing: -1.2, lineHeight: 36 },
  daysLabel: { color: t.textMuted, fontSize: 11, fontWeight: "700" },
  body: { color: t.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 14 },
}));
