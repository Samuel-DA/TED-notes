import Slider from "@react-native-community/slider";
import { BlurView } from "expo-blur";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, Save, ShieldCheck } from "lucide-react-native";
import React, { useMemo, useState, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CareCard, CarePage, careStyles } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";

type Tracker = { lastPeriodStart: string; cycleLength: number; periodLength: number; updatedByName?: string };
const toKey = (date: Date) => { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); };
const fromKey = (value: string) => new Date(`${value}T12:00:00`);
const dayDiff = (a: Date, b: Date) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() - new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 86400000);
const positiveMod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export default function PeriodPage() {
  const { pairId, uid, myName, partnerName } = useApp();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toKey(today)); const [cycleLength, setCycleLength] = useState(28); const [periodLength, setPeriodLength] = useState(5); const [tracker, setTracker] = useState<Tracker | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { if (!pairId) return; return onSnapshot(doc(db, "pairs", pairId, "periodTracker", "shared"), (snap) => { if (!snap.exists()) return; const data = snap.data() as Tracker; setTracker(data); setSelected(data.lastPeriodStart); setCycleLength(data.cycleLength || 28); setPeriodLength(data.periodLength || 5); }); }, [pairId]);
  const cells = useMemo(() => { const first = new Date(month.getFullYear(), month.getMonth(), 1); const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))]; }, [month]);
  const phase = (date: Date) => {
    if (!tracker?.lastPeriodStart) return "none"; const diff = dayDiff(date, fromKey(tracker.lastPeriodStart)); const cycleDay = positiveMod(diff, cycleLength);
    if (cycleDay < periodLength) return "period"; if (cycleDay === cycleLength - 14) return "ovulation"; if (cycleDay >= cycleLength - 19 && cycleDay <= cycleLength - 13) return "fertile"; return "none";
  };
  const nextPeriod = useMemo(() => { if (!tracker?.lastPeriodStart) return null; const next = fromKey(tracker.lastPeriodStart); while (dayDiff(next, today) < 0) next.setDate(next.getDate() + cycleLength); return next; }, [cycleLength, today, tracker]);
  const save = async () => { if (!pairId || !uid) return; setSaving(true); try { await setDoc(doc(db, "pairs", pairId, "periodTracker", "shared"), { lastPeriodStart: selected, cycleLength, periodLength, updatedBy: uid, updatedByName: myName || "Partner", updatedAt: serverTimestamp() }, { merge: true }); await notifyPartner({ pairId, currentUid: uid, route: "care_period", action: "period_tracker_updated", title: "Shared cycle updated 🌸", body: `${myName || "Your partner"} updated the shared period calendar.` }); } finally { setSaving(false); } };
  return <CarePage eyebrow="SHARED WELLBEING" title="Period tracker" subtitle={`A clear cycle view shared with ${partnerName || "your partner"}.`} icon={<Droplets color="#fff" size={23} />}>
    <View style={styles.summary}>
      <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
      <View><Text style={styles.summaryLabel}>NEXT ESTIMATE</Text><Text style={styles.summaryDate}>{nextPeriod ? nextPeriod.toLocaleDateString(undefined, { day: "numeric", month: "long" }) : "Add a start date"}</Text><Text style={styles.summaryMeta}>{tracker?.updatedByName ? `Last updated by ${tracker.updatedByName}` : "No shared cycle saved yet"}</Text></View>
      <View style={styles.orb}><Droplets color="#fff" fill="rgba(255,255,255,0.28)" size={27} /></View>
    </View>
    <CareCard title="Cycle calendar" subtitle="Tap the first day of the most recent period" icon={<CalendarDays color="#BE3455" size={20} />}>
      <View style={styles.monthNav}><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.navButton}><ChevronLeft color={palette.text} size={20} /></Pressable><Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.navButton}><ChevronRight color={palette.text} size={20} /></Pressable></View>
      <View style={styles.week}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekText}>{day}</Text>)}</View>
      <View style={styles.calendar}>{cells.map((date, index) => { if (!date) return <View key={`blank-${index}`} style={styles.dayCell} />; const key = toKey(date); const type = phase(date); const chosen = selected === key; const isToday = toKey(today) === key; return <Pressable accessibilityLabel={date.toDateString()} key={key} onPress={() => setSelected(key)} style={[styles.dayCell, type === "period" && styles.periodDay, type === "fertile" && styles.fertileDay, type === "ovulation" && styles.ovulationDay, chosen && styles.selectedDay]}><Text style={[styles.dayText, chosen && styles.selectedText]}>{date.getDate()}</Text>{isToday && <View style={[styles.todayDot, chosen && { backgroundColor: "#fff" }]} />}</Pressable>; })}</View>
      <View style={styles.legend}><Legend color="#E85D75" label="Period" /><Legend color="#EADCF7" label="Fertile" /><Legend color="#8C5BB7" label="Ovulation" /></View>
      <View style={styles.selectedBanner}><Text style={styles.selectedLabel}>Selected start date</Text><Text style={styles.selectedValue}>{fromKey(selected).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</Text></View>
    </CareCard>
    <CareCard title="Your cycle pattern" subtitle="Adjust the estimates with smooth sliders">
      <SliderRow label="Average cycle" value={cycleLength} min={21} max={40} suffix="days" onChange={setCycleLength} />
      <SliderRow label="Period length" value={periodLength} min={2} max={10} suffix="days" onChange={setPeriodLength} />
      <Pressable style={careStyles.primaryButton} onPress={save} disabled={saving}><Save color="#fff" size={18} /><Text style={careStyles.primaryText}>{saving ? "Saving…" : "Save shared tracker"}</Text></Pressable>
    </CareCard>
    <View style={styles.privacy}><ShieldCheck color="#66756F" size={17} /><Text style={styles.privacyText}>This tracker is visible to both paired accounts. Predictions are estimates only and must not be used as contraception or medical diagnosis.</Text></View>
  </CarePage>;
}

function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }
function SliderRow({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) { return <View style={styles.sliderBlock}><View style={styles.sliderHead}><Text style={styles.sliderLabel}>{label}</Text><Text style={styles.sliderValue}>{value} {suffix}</Text></View><Slider minimumValue={min} maximumValue={max} step={1} value={value} onValueChange={onChange} minimumTrackTintColor={palette.rose} maximumTrackTintColor="#E9DFE8" thumbTintColor={palette.rose} /></View>; }

const styles = StyleSheet.create({
  summary: { minHeight: 126, borderRadius: 26, padding: 19, backgroundColor: "rgba(185,54,89,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, overflow: "hidden" }, summaryLabel: { color: "#FFD9E3", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, summaryDate: { color: "#fff", fontSize: 25, fontWeight: "900", marginTop: 6 }, summaryMeta: { color: "#F8C9D5", fontSize: 11, marginTop: 5 }, orb: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }, navButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#F7F2F7", alignItems: "center", justifyContent: "center" }, monthTitle: { color: palette.text, fontSize: 16, fontWeight: "900" }, week: { flexDirection: "row", marginBottom: 5 }, weekText: { width: "14.285%", textAlign: "center", color: "#A297A5", fontSize: 10, fontWeight: "900" }, calendar: { flexDirection: "row", flexWrap: "wrap", rowGap: 5 }, dayCell: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 14 }, dayText: { color: palette.text, fontSize: 12, fontWeight: "700" }, periodDay: { backgroundColor: "#FFE1E9" }, fertileDay: { backgroundColor: "#F0E7F8" }, ovulationDay: { backgroundColor: "#8C5BB7" }, selectedDay: { backgroundColor: palette.rose, shadowColor: palette.rose, shadowOpacity: 0.25, shadowRadius: 7, elevation: 3 }, selectedText: { color: "#fff", fontWeight: "900" }, todayDot: { position: "absolute", bottom: 5, width: 3, height: 3, borderRadius: 2, backgroundColor: palette.rose }, legend: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 14 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 5 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { color: palette.muted, fontSize: 9.5, fontWeight: "700" }, selectedBanner: { backgroundColor: "#FBF4F7", borderRadius: 15, padding: 12, marginTop: 14 }, selectedLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, selectedValue: { color: palette.text, fontSize: 13, fontWeight: "900", marginTop: 4 },
  sliderBlock: { marginBottom: 16 }, sliderHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }, sliderLabel: { color: palette.text, fontSize: 13, fontWeight: "800" }, sliderValue: { color: palette.rose, fontSize: 13, fontWeight: "900" }, privacy: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, privacyText: { flex: 1, color: "#E1D7E4", fontSize: 10.5, lineHeight: 16 },
});
