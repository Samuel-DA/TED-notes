import Slider from "@react-native-community/slider";
import { BlurView } from "expo-blur";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, HeartPulse, Save, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CareCard, CarePage, careStyles } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";

type DailyLog = { flow: string; symptoms: string[]; mood: string; note: string };
type Tracker = {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  periodDays?: string[];
  dailyLogs?: Record<string, DailyLog>;
  updatedByName?: string;
};

const FLOWS = ["None", "Light", "Medium", "Heavy"];
const SYMPTOMS = ["Cramps", "Headache", "Bloating", "Backache", "Tenderness", "Fatigue"];
const MOODS = ["😊", "😌", "😕", "😢", "😤", "🥱"];
const toKey = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const fromKey = (value: string) => new Date(`${value}T12:00:00`);
const dayDiff = (a: Date, b: Date) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() - new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 86400000);
const positiveMod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export default function PeriodPage() {
  const { pairId, uid, myName, partnerName } = useApp();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(toKey(today));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [flow, setFlow] = useState("None");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(doc(db, "pairs", pairId, "periodTracker", "shared"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Tracker;
      setTracker(data); setCycleLength(data.cycleLength || 28); setPeriodLength(data.periodLength || 5);
    });
  }, [pairId]);

  useEffect(() => {
    const log = tracker?.dailyLogs?.[selected];
    setFlow(log?.flow || (tracker?.periodDays?.includes(selected) ? "Medium" : "None"));
    setSymptoms(log?.symptoms || []); setMood(log?.mood || ""); setNote(log?.note || "");
  }, [selected, tracker]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];
  }, [month]);

  const phase = (date: Date) => {
    if (tracker?.periodDays?.includes(toKey(date))) return "logged";
    if (!tracker?.lastPeriodStart) return "none";
    const cycleDay = positiveMod(dayDiff(date, fromKey(tracker.lastPeriodStart)), cycleLength);
    if (cycleDay < periodLength) return "period";
    if (cycleDay === cycleLength - 14) return "ovulation";
    if (cycleDay >= cycleLength - 19 && cycleDay <= cycleLength - 13) return "fertile";
    return "none";
  };

  const cycleDay = tracker?.lastPeriodStart ? positiveMod(dayDiff(today, fromKey(tracker.lastPeriodStart)), cycleLength) + 1 : null;
  const nextPeriod = (() => {
    if (!tracker?.lastPeriodStart) return null;
    const next = fromKey(tracker.lastPeriodStart);
    while (dayDiff(next, today) < 0) next.setDate(next.getDate() + cycleLength);
    return next;
  })();
  const daysUntil = nextPeriod ? dayDiff(nextPeriod, today) : null;
  const currentPhase = cycleDay === null ? "No cycle yet" : cycleDay <= periodLength ? "Period" : cycleDay === cycleLength - 14 ? "Estimated ovulation" : cycleDay >= cycleLength - 19 && cycleDay <= cycleLength - 13 ? "Fertile window" : cycleDay < cycleLength / 2 ? "Follicular phase" : "Luteal phase";

  const history = useMemo(() => {
    const days = [...(tracker?.periodDays || [])].sort();
    const starts: string[] = [];
    days.forEach((day, index) => { if (index === 0 || dayDiff(fromKey(day), fromKey(days[index - 1])) > 1) starts.push(day); });
    return starts.slice(-4).reverse();
  }, [tracker?.periodDays]);

  const saveDay = async () => {
    if (!pairId || !uid) return;
    if (!tracker?.lastPeriodStart && flow === "None") {
      Alert.alert("Log a period day first", "Choose Light, Medium or Heavy flow to establish the first cycle start.");
      return;
    }
    setSaving(true);
    try {
      const isPeriod = flow !== "None";
      const currentDays = tracker?.periodDays || [];
      const nextDays = (isPeriod ? [...new Set([...currentDays, selected])] : currentDays.filter((day) => day !== selected)).sort().slice(-365);
      const currentLogs = tracker?.dailyLogs || {};
      const nextLogs = Object.fromEntries([...Object.entries({ ...currentLogs, [selected]: { flow, symptoms, mood, note: note.trim() } })].sort(([left], [right]) => left.localeCompare(right)).slice(-180));
      const previousStart = tracker?.lastPeriodStart;
      const shouldBecomeStart = isPeriod && (!previousStart || dayDiff(fromKey(selected), fromKey(previousStart)) >= 14);
      const lastPeriodStart = shouldBecomeStart ? selected : previousStart || selected;
      await setDoc(doc(db, "pairs", pairId, "periodTracker", "shared"), { lastPeriodStart, cycleLength, periodLength, periodDays: nextDays, dailyLogs: nextLogs, updatedBy: uid, updatedByName: myName || "Partner", updatedAt: serverTimestamp() }, { merge: true });
      await notifyPartner({ pairId, currentUid: uid, route: "care_period", action: "period_log_updated", title: "Cycle log updated 🌸", body: `${myName || "Your partner"} updated the shared cycle tracker for ${fromKey(selected).toLocaleDateString(undefined, { day: "numeric", month: "short" })}.` });
    } finally { setSaving(false); }
  };

  const savePattern = async () => {
    if (!pairId || !uid) return;
    const lastPeriodStart = tracker?.lastPeriodStart || selected;
    await setDoc(doc(db, "pairs", pairId, "periodTracker", "shared"), { lastPeriodStart, cycleLength, periodLength, periodDays: tracker?.periodDays || [], dailyLogs: tracker?.dailyLogs || {}, updatedBy: uid, updatedByName: myName || "Partner", updatedAt: serverTimestamp() }, { merge: true });
  };

  const toggleSymptom = (item: string) => setSymptoms((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);

  return <CarePage eyebrow="SHARED WELLBEING" title="Cycle tracker" subtitle={`Period, symptoms and cycle insights shared with ${partnerName}.`} icon={<Droplets color="#fff" size={23} />}>
    <View style={styles.summary}><BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} /><View><Text style={styles.summaryLabel}>{currentPhase.toUpperCase()}</Text><Text style={styles.summaryDate}>{cycleDay ? `Cycle day ${cycleDay}` : "Start your first log"}</Text><Text style={styles.summaryMeta}>{nextPeriod ? `${daysUntil === 0 ? "Period expected today" : `${daysUntil} day${daysUntil === 1 ? "" : "s"} until next estimate`}` : "Predictions begin after a period is logged"}</Text></View><View style={styles.orb}><HeartPulse color="#fff" size={28} /></View></View>

    <View style={styles.insights}><Insight label="NEXT PERIOD" value={nextPeriod ? nextPeriod.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"} /><Insight label="CYCLE" value={`${cycleLength} days`} /><Insight label="PERIOD" value={`${periodLength} days`} /></View>

    <CareCard title="Cycle calendar" subtitle="Tap any day to view or add a daily log" icon={<CalendarDays color="#BE3455" size={20} />}>
      <View style={styles.monthNav}><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.navButton}><ChevronLeft color={palette.text} size={20} /></Pressable><Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.navButton}><ChevronRight color={palette.text} size={20} /></Pressable></View>
      <View style={styles.week}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekText}>{day}</Text>)}</View>
      <View style={styles.calendar}>{cells.map((date, index) => { if (!date) return <View key={`blank-${index}`} style={styles.dayCell} />; const key = toKey(date); const type = phase(date); const chosen = selected === key; const isToday = toKey(today) === key; return <Pressable accessibilityLabel={date.toDateString()} key={key} onPress={() => setSelected(key)} style={[styles.dayCell, type === "period" && styles.periodDay, type === "logged" && styles.loggedDay, type === "fertile" && styles.fertileDay, type === "ovulation" && styles.ovulationDay, chosen && styles.selectedDay]}><Text style={[styles.dayText, (chosen || type === "logged" || type === "ovulation") && styles.selectedText]}>{date.getDate()}</Text>{isToday && <View style={[styles.todayDot, (chosen || type === "logged") && { backgroundColor: "#fff" }]} />}</Pressable>; })}</View>
      <View style={styles.legend}><Legend color="#C63D60" label="Logged" /><Legend color="#FFE1E9" label="Predicted" /><Legend color="#EADCF7" label="Fertile" /><Legend color="#8C5BB7" label="Ovulation" /></View>
    </CareCard>

    <CareCard title={fromKey(selected).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} subtitle="Daily period and wellbeing log" icon={<Droplets color={palette.rose} size={20} />}>
      <Text style={styles.sectionLabel}>FLOW</Text><View style={styles.options}>{FLOWS.map((item) => <Pressable key={item} onPress={() => setFlow(item)} style={[styles.option, flow === item && styles.optionActive]}><Text style={[styles.optionText, flow === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.sectionLabel}>SYMPTOMS</Text><View style={styles.chips}>{SYMPTOMS.map((item) => <Pressable key={item} onPress={() => toggleSymptom(item)} style={[styles.chip, symptoms.includes(item) && styles.chipActive]}><Text style={[styles.chipText, symptoms.includes(item) && styles.chipTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.sectionLabel}>MOOD</Text><View style={styles.moods}>{MOODS.map((item) => <Pressable key={item} onPress={() => setMood(item)} style={[styles.mood, mood === item && styles.moodActive]}><Text style={styles.moodText}>{item}</Text></Pressable>)}</View>
      <TextInput value={note} onChangeText={setNote} placeholder="Notes for this day…" placeholderTextColor="#9A919F" multiline style={[careStyles.input, styles.note]} />
      <Pressable style={careStyles.primaryButton} onPress={saveDay} disabled={saving}><Save color="#fff" size={18} /><Text style={careStyles.primaryText}>{saving ? "Saving…" : "Save daily log"}</Text></Pressable>
    </CareCard>

    <CareCard title="Cycle pattern" subtitle="Used for period and fertile-window estimates">
      <SliderRow label="Average cycle" value={cycleLength} min={21} max={40} suffix="days" onChange={setCycleLength} /><SliderRow label="Period length" value={periodLength} min={2} max={10} suffix="days" onChange={setPeriodLength} />
      <Pressable style={careStyles.secondaryButton} onPress={savePattern}><Save color={palette.plum} size={17} /><Text style={careStyles.secondaryText}>Save cycle pattern</Text></Pressable>
    </CareCard>

    <CareCard title="Recent cycles" subtitle="Cycle starts based on logged period days">{history.length ? history.map((start, index) => <View key={start} style={styles.historyRow}><View style={styles.historyDot} /><View style={{ flex: 1 }}><Text style={styles.historyDate}>{fromKey(start).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</Text><Text style={styles.historyMeta}>{index < history.length - 1 ? `${dayDiff(fromKey(start), fromKey(history[index + 1]))} day cycle` : "Earliest saved cycle"}</Text></View></View>) : <Text style={careStyles.muted}>Log period days to build cycle history.</Text>}</CareCard>

    <View style={styles.privacy}><ShieldCheck color="#D7CADB" size={17} /><Text style={styles.privacyText}>Visible only to both paired accounts. Predictions are estimates and must not be used as contraception or medical diagnosis.</Text></View>
  </CarePage>;
}

function Insight({ label, value }: { label: string; value: string }) { return <View style={styles.insight}><Text style={styles.insightLabel}>{label}</Text><Text style={styles.insightValue}>{value}</Text></View>; }
function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }
function SliderRow({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) { return <View style={styles.sliderBlock}><View style={styles.sliderHead}><Text style={styles.sliderLabel}>{label}</Text><Text style={styles.sliderValue}>{value} {suffix}</Text></View><Slider minimumValue={min} maximumValue={max} step={1} value={value} onValueChange={onChange} minimumTrackTintColor={palette.rose} maximumTrackTintColor="#E9DFE8" thumbTintColor={palette.rose} /></View>; }

const styles = StyleSheet.create({
  summary: { minHeight: 136, borderRadius: 16, padding: 19, backgroundColor: "rgba(181,68,90,0.52)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, overflow: "hidden" },
  summaryLabel: { color: "#FFD9E3", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 }, summaryDate: { color: "#fff", fontSize: 25, fontWeight: "700", marginTop: 6 }, summaryMeta: { color: "#F8C9D5", fontSize: 11.5, lineHeight: 16, marginTop: 5, maxWidth: 230 }, orb: { width: 58, height: 58, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  insights: { flexDirection: "row", gap: 8, marginBottom: 14 }, insight: { flex: 1, padding: 11, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, insightLabel: { color: "#D9CADD", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.7 }, insightValue: { color: "#fff", fontSize: 13, fontWeight: "900", marginTop: 4 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }, navButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#F7F2F7", alignItems: "center", justifyContent: "center" }, monthTitle: { color: palette.text, fontSize: 16, fontWeight: "700" }, week: { flexDirection: "row", marginBottom: 5 }, weekText: { width: "14.285%", textAlign: "center", color: "#A297A5", fontSize: 10, fontWeight: "800" }, calendar: { flexDirection: "row", flexWrap: "wrap", rowGap: 5 }, dayCell: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 12 }, dayText: { color: palette.text, fontSize: 12, fontWeight: "700" }, periodDay: { backgroundColor: "#FFE1E9" }, loggedDay: { backgroundColor: "#C63D60" }, fertileDay: { backgroundColor: "#F0E7F8" }, ovulationDay: { backgroundColor: "#8C5BB7" }, selectedDay: { backgroundColor: palette.rose, borderWidth: 2, borderColor: "#fff", shadowColor: palette.rose, shadowOpacity: 0.25, shadowRadius: 7, elevation: 3 }, selectedText: { color: "#fff", fontWeight: "800" }, todayDot: { position: "absolute", bottom: 5, width: 3, height: 3, borderRadius: 2, backgroundColor: palette.rose }, legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 14 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { color: palette.muted, fontSize: 9, fontWeight: "700" },
  sectionLabel: { color: palette.plum, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 4, marginBottom: 8 }, options: { flexDirection: "row", gap: 6, marginBottom: 15 }, option: { flex: 1, minHeight: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F1F6" }, optionActive: { backgroundColor: palette.rose }, optionText: { color: palette.muted, fontSize: 10.5, fontWeight: "800" }, optionTextActive: { color: "#fff" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 15 }, chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, backgroundColor: "#F6F1F6" }, chipActive: { backgroundColor: "#F3DDE5", borderWidth: 1, borderColor: "#E8A1B4" }, chipText: { color: palette.muted, fontSize: 10.5, fontWeight: "800" }, chipTextActive: { color: "#9F2747" }, moods: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }, mood: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F1F6" }, moodActive: { backgroundColor: "#F3DDE5", borderWidth: 2, borderColor: palette.rose }, moodText: { fontSize: 21 }, note: { minHeight: 80, paddingTop: 13, textAlignVertical: "top" },
  sliderBlock: { marginBottom: 16 }, sliderHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }, sliderLabel: { color: palette.text, fontSize: 13, fontWeight: "800" }, sliderValue: { color: palette.rose, fontSize: 13, fontWeight: "900" },
  historyRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(91,46,117,0.12)" }, historyDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.rose }, historyDate: { color: palette.text, fontSize: 13, fontWeight: "900" }, historyMeta: { color: palette.muted, fontSize: 10.5, marginTop: 3 },
  privacy: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }, privacyText: { flex: 1, color: "#E1D7E4", fontSize: 10.5, lineHeight: 16 },
});
