import AsyncStorage from "@react-native-async-storage/async-storage";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { CalendarHeart, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { CarePage } from "@/components/care/CareUI";
import DatePicker from "@/components/ui/DatePicker";
import { Badge, Button, Card, EmptyState, Field, SectionHeader, Sheet } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { notifyPartner, scheduleImportantDateNotificationAsync } from "@/services/notifications";
import { dayDiff, fromKey, toKey } from "@/utils/dayKey";

type ImportantDate = { id: string; title: string; dateAt: number; note?: string };

const relative = (days: number) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : days < 0 ? `${-days} day${days === -1 ? "" : "s"} ago` : `In ${days} days`);

export default function DatesPage() {
  const { pairId, uid, myName } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(query(collection(db, "pairs", pairId, "careDates"), orderBy("dateAt", "asc")), (snap) => {
      setDates(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as ImportantDate));
      setLoaded(true);
    }, () => setLoaded(true));
  }, [pairId]);

  // Schedule a 9am local reminder for each upcoming date (once per device).
  useEffect(() => {
    dates.forEach(async (item) => {
      const reminderAt = new Date(item.dateAt); reminderAt.setHours(9, 0, 0, 0);
      if (reminderAt.getTime() <= Date.now()) return;
      const key = `@ted-care-date:${item.id}:${item.dateAt}`;
      if (await AsyncStorage.getItem(key)) return;
      const id = await scheduleImportantDateNotificationAsync({ title: `Today: ${item.title} 💗`, body: item.note || "An important date you saved together.", date: reminderAt });
      if (id) await AsyncStorage.setItem(key, id);
    });
  }, [dates]);

  const upcoming = dates.filter((d) => dayDiff(new Date(d.dateAt), today) >= 0);
  const past = dates.filter((d) => dayDiff(new Date(d.dateAt), today) < 0).reverse();

  const openAdd = () => { setTitle(""); setDateKey(null); setNote(""); setOpen(true); };

  const add = async () => {
    if (!pairId || !uid || !title.trim() || !dateKey) return;
    const at = fromKey(dateKey); at.setHours(9, 0, 0, 0);
    setSaving(true);
    try {
      await addDoc(collection(db, "pairs", pairId, "careDates"), { title: title.trim(), dateAt: at.getTime(), note: note.trim(), createdBy: uid, createdAt: serverTimestamp() });
      setOpen(false);
      void notifyPartner({ pairId, currentUid: uid, route: "care_dates", action: "date_added", title: "Important date added 📅", body: `${myName || "Your partner"} added “${title.trim()}” for ${at.toLocaleDateString(undefined, { day: "numeric", month: "long" })}.` });
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };

  const remove = (item: ImportantDate) => Alert.alert("Delete this date?", `“${item.title}” will be removed for both of you.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => {
      if (!pairId || !uid) return;
      await deleteDoc(doc(db, "pairs", pairId, "careDates", item.id));
      void notifyPartner({ pairId, currentUid: uid, route: "care_dates", action: "date_removed", title: "Important date removed", body: `${myName || "Your partner"} removed “${item.title}”.` });
    } },
  ]);

  const Row = ({ item, faded }: { item: ImportantDate; faded?: boolean }) => {
    const date = new Date(item.dateAt);
    const days = dayDiff(date, today);
    return (
      <Card style={[s.row, faded && { opacity: 0.6 }]}>
        <View style={[s.badge, days === 0 && { backgroundColor: t.accent }]}>
          <Text style={[s.day, days === 0 && { color: "#fff" }]}>{date.getDate()}</Text>
          <Text style={[s.month, days === 0 && { color: "#fff" }]}>{date.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={2}>{item.title}</Text>
          {!!item.note && <Text style={s.note} numberOfLines={2}>{item.note}</Text>}
          <View style={{ marginTop: 7 }}><Badge label={relative(days)} tone={days === 0 ? "accent" : days > 0 && days <= 7 ? "warning" : "neutral"} /></View>
        </View>
        <Pressable accessibilityLabel={`Delete ${item.title}`} hitSlop={6} onPress={() => remove(item)} style={s.delete}><Trash2 color={t.textMuted} size={17} /></Pressable>
      </Card>
    );
  };

  return (
    <CarePage eyebrow="REMINDERS" title="Important dates" subtitle="Appointments, milestones and moments that deserve care." icon={<CalendarHeart color="#fff" size={23} />}>
      <Button title="Add a date" icon={Plus} onPress={openAdd} />

      {loaded && !dates.length ? (
        <EmptyState icon={CalendarHeart} title="Nothing saved yet" body="Add birthdays, appointments and anniversaries. You'll both get a reminder at 9am on the day." style={{ marginTop: 20 }} />
      ) : (
        <>
          {upcoming.length > 0 && <SectionHeader title={`Coming up · ${upcoming.length}`} />}
          {upcoming.map((item) => <Row key={item.id} item={item} />)}
          {past.length > 0 && <SectionHeader title="Past" />}
          {past.slice(0, 10).map((item) => <Row key={item.id} item={item} faded />)}
        </>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} eyebrow="NEW REMINDER" title="Add an important date">
        <Field label="What's happening?" value={title} onChangeText={setTitle} placeholder="Mum's birthday" maxLength={80} />
        <Text style={s.pickLabel}>When</Text>
        <DatePicker value={dateKey} onChange={setDateKey} minDate={toKey(today)} />
        <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Book the restaurant by Friday" style={{ marginTop: 14 }} maxLength={200} />
        <Button title={dateKey ? `Save for ${fromKey(dateKey).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "Pick a date"} disabled={!title.trim() || !dateKey} loading={saving} onPress={add} />
      </Sheet>
    </CarePage>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10, padding: 14 },
  badge: { width: 54, height: 58, borderRadius: 17, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" },
  day: { color: t.accentText, fontWeight: "900", fontSize: 21, lineHeight: 24 },
  month: { color: t.accentText, fontWeight: "800", fontSize: 10, letterSpacing: 0.8 },
  title: { color: t.text, fontWeight: "800", fontSize: 15.5 },
  note: { color: t.textSecondary, fontSize: 13, marginTop: 3 },
  delete: { width: 38, height: 38, borderRadius: 13, backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
  pickLabel: { color: t.textSecondary, fontSize: 12.5, fontWeight: "700", marginBottom: 10, marginLeft: 2 },
}));
