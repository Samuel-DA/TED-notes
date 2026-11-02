import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { CalendarDays, ChevronLeft, ChevronRight, Droplet, Droplets, HeartHandshake, Minus, NotebookPen, Plus, ShieldCheck, Sparkles, Trash2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { CarePage } from "@/components/care/CareUI";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { notifyPartner } from "@/services/notifications";
import { addDays, dayDiff, fromKey, shortDate, toKey } from "@/utils/dayKey";

type DailyLog = { flow: string; symptoms: string[]; mood: string; note: string };
type Tracker = {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  periodDays?: string[];
  dailyLogs?: Record<string, DailyLog>;
  updatedByName?: string;
};
type PhaseKey = "period" | "follicular" | "fertile" | "ovulation" | "luteal" | "late" | "none";
type Run = { start: string; end: string; length: number };

const ROSE = "#E0567A";
const VIOLET = "#A47FD6";
const OVULATION = "#8C5BB7";

const FLOWS = [
  { key: "None", drops: 0 },
  { key: "Spotting", drops: 1 },
  { key: "Light", drops: 1 },
  { key: "Medium", drops: 2 },
  { key: "Heavy", drops: 3 },
] as const;
const PERIOD_FLOWS = ["Light", "Medium", "Heavy"];
const SYMPTOMS = [
  { key: "Cramps", emoji: "⚡" }, { key: "Headache", emoji: "🤕" }, { key: "Bloating", emoji: "🎈" },
  { key: "Backache", emoji: "🦴" }, { key: "Tenderness", emoji: "💗" }, { key: "Fatigue", emoji: "🔋" },
  { key: "Acne", emoji: "✨" }, { key: "Cravings", emoji: "🍫" }, { key: "Nausea", emoji: "🤢" }, { key: "Insomnia", emoji: "🌙" },
];
const MOODS = [
  { emoji: "😊", label: "Happy" }, { emoji: "😌", label: "Calm" }, { emoji: "🥺", label: "Sensitive" },
  { emoji: "😢", label: "Low" }, { emoji: "😤", label: "Irritable" }, { emoji: "😰", label: "Anxious" }, { emoji: "🥱", label: "Tired" },
];
const PHASES: Record<PhaseKey, { label: string; color: string; body: string; support: string }> = {
  period: { label: "Period", color: ROSE, body: "Energy can dip and cramps are common. Warmth, rest, water and iron-rich food help.", support: "Offer a hot water bottle, take a chore off the list and keep plans low-key." },
  follicular: { label: "Follicular phase", color: "#E9A4B8", body: "Oestrogen rises after a period, and energy and mood often lift.", support: "A great time to plan something new or active together." },
  fertile: { label: "Fertile window", color: VIOLET, body: "The days around ovulation, when pregnancy is most likely.", support: "Energy and confidence are often higher, so a date night could go down well." },
  ovulation: { label: "Estimated ovulation", color: OVULATION, body: "The estimated day an egg is released. This is a calendar estimate, not a test result.", support: "Enjoy the good energy and check in on plans for the week ahead." },
  luteal: { label: "Luteal phase", color: "#C9A3D9", body: "Progesterone rises. Later in this phase, PMS symptoms such as bloating or low mood can appear.", support: "Extra patience, comfort food and fewer surprises go a long way." },
  late: { label: "Period late", color: "#F2B33D", body: "The period is later than the estimate. Stress, travel, illness and other changes can shift a cycle.", support: "Be reassuring. If it continues or you're worried, a test or a GP can help." },
  none: { label: "Not set up yet", color: "#B9A9C2", body: "Log the first day of a period to start cycle estimates.", support: "Set it up together so you both see the same calendar." },
};

const phaseFor = (cd0: number, cycle: number, period: number): PhaseKey => {
  if (cd0 < period) return "period";
  if (cd0 === cycle - 14) return "ovulation";
  if (cd0 >= cycle - 19 && cd0 <= cycle - 13) return "fertile";
  if (cd0 < cycle - 19) return "follicular";
  return "luteal";
};

const buildRuns = (days: string[]): Run[] => {
  const sorted = [...new Set(days)].sort();
  const runs: Run[] = [];
  sorted.forEach((day) => {
    const last = runs[runs.length - 1];
    if (last && dayDiff(fromKey(day), fromKey(last.end)) <= 2) {
      last.end = day;
      last.length = dayDiff(fromKey(day), fromKey(last.start)) + 1;
    } else runs.push({ start: day, end: day, length: 1 });
  });
  return runs;
};

const average = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null);
const isEmptyLog = (log: DailyLog) => log.flow === "None" && !log.symptoms.length && !log.mood && !log.note.trim();

export default function PeriodPage() {
  const t = useTheme();
  const styles = useStyles();
  const { pairId, uid, myName, partnerName } = useApp();
  const today = useMemo(() => new Date(), []);
  const todayKey = toKey(today);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const [cycleDraft, setCycleDraft] = useState(28);
  const [periodDraft, setPeriodDraft] = useState(5);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(doc(db, "pairs", pairId, "periodTracker", "shared"), (snapshot) => {
      setLoaded(true);
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Tracker;
      setTracker(data);
      setCycleDraft(data.cycleLength || 28);
      setPeriodDraft(data.periodLength || 5);
    }, () => setLoaded(true));
  }, [pairId]);

  const cycleLength = tracker?.cycleLength || 28;
  const periodLength = tracker?.periodLength || 5;
  const periodDays = useMemo(() => tracker?.periodDays || [], [tracker?.periodDays]);
  const periodSet = useMemo(() => new Set(periodDays), [periodDays]);
  const logs = useMemo(() => tracker?.dailyLogs || {}, [tracker?.dailyLogs]);
  const runs = useMemo(() => buildRuns(periodDays), [periodDays]);
  const lastStart = runs.length ? runs[runs.length - 1].start : tracker?.lastPeriodStart || null;

  const stats = useMemo(() => {
    const gaps = runs.slice(1).map((run, index) => dayDiff(fromKey(run.start), fromKey(runs[index].start))).filter((gap) => gap >= 15 && gap <= 60);
    return { avgCycle: average(gaps.slice(-6)), avgPeriod: average(runs.slice(-6).map((run) => run.length)), tracked: gaps.length };
  }, [runs]);

  const status = useMemo((): { phase: PhaseKey; cycleDay: number | null; nextStart: Date | null; daysUntil: number | null; late: number } => {
    if (!lastStart) return { phase: "none", cycleDay: null, nextStart: null, daysUntil: null, late: 0 };
    const since = Math.max(0, dayDiff(today, fromKey(lastStart)));
    const loggedToday = periodSet.has(todayKey);
    if (since < cycleLength) {
      return { phase: loggedToday ? "period" : phaseFor(since, cycleLength, periodLength), cycleDay: since + 1, nextStart: addDays(fromKey(lastStart), cycleLength), daysUntil: cycleLength - since, late: 0 };
    }
    const late = since - cycleLength;
    if (late <= 14) return { phase: loggedToday ? "period" : "late", cycleDay: since + 1, nextStart: addDays(fromKey(lastStart), cycleLength), daysUntil: -late, late };
    const cd0 = since % cycleLength;
    return { phase: loggedToday ? "period" : phaseFor(cd0, cycleLength, periodLength), cycleDay: cd0 + 1, nextStart: addDays(today, cycleLength - cd0), daysUntil: cycleLength - cd0, late: 0 };
  }, [cycleLength, lastStart, periodLength, periodSet, today, todayKey]);

  const currentRun = runs.find((run) => todayKey >= run.start && todayKey <= run.end);
  const phase = PHASES[status.phase];
  const headline = status.cycleDay === null
    ? "Log a period to begin"
    : currentRun ? `Period day ${dayDiff(today, fromKey(currentRun.start)) + 1}`
    : status.late > 0 ? `${status.late} day${status.late === 1 ? "" : "s"} late`
    : status.daysUntil === 0 ? "Period due today"
    : `Next period in ${status.daysUntil} day${status.daysUntil === 1 ? "" : "s"}`;

  const fertile = useMemo(() => {
    if (!status.nextStart) return null;
    let start = addDays(status.nextStart, -19);
    if (dayDiff(addDays(start, 6), today) < 0) start = addDays(status.nextStart, cycleLength - 19);
    return { start, end: addDays(start, 6) };
  }, [cycleLength, status.nextStart, today]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))] as (Date | null)[];
  }, [month]);

  const dayInfo = (date: Date) => {
    const key = toKey(date);
    const logged = periodSet.has(key);
    const log = logs[key];
    const hasNote = !!log && (log.symptoms?.length > 0 || !!log.mood || !!log.note);
    let predicted: PhaseKey | null = null;
    if (!logged && lastStart) {
      const diff = dayDiff(date, fromKey(lastStart));
      if (diff >= 0) {
        const ph = phaseFor(diff % cycleLength, cycleLength, periodLength);
        if (ph === "period") predicted = dayDiff(date, today) >= 0 ? "period" : null;
        else if (ph === "fertile" || ph === "ovulation") predicted = ph;
      }
    }
    return { key, logged, hasNote, predicted };
  };

  const persist = async (nextDays: string[], nextLogs: Record<string, DailyLog>, cycle = cycleLength, period = periodLength) => {
    if (!pairId || !uid) return;
    const days = [...new Set(nextDays)].sort().slice(-365);
    const nextRuns = buildRuns(days);
    const lastPeriodStart = nextRuns.length ? nextRuns[nextRuns.length - 1].start : tracker?.lastPeriodStart;
    if (!lastPeriodStart) return;
    const trimmedLogs = Object.fromEntries(Object.entries(nextLogs).sort(([a], [b]) => a.localeCompare(b)).slice(-180));
    await setDoc(doc(db, "pairs", pairId, "periodTracker", "shared"), {
      lastPeriodStart, cycleLength: cycle, periodLength: period, periodDays: days, dailyLogs: trimmedLogs,
      updatedBy: uid, updatedByName: myName || "Partner", updatedAt: serverTimestamp(),
    });
  };

  const saveDay = async (key: string, log: DailyLog) => {
    const isPeriod = PERIOD_FLOWS.includes(log.flow);
    if (!lastStart && !isPeriod) {
      Alert.alert("Log a period day first", "Choose Light, Medium or Heavy flow to set the first cycle start.");
      return false;
    }
    setBusy(true);
    try {
      const nextDays = isPeriod ? [...periodDays, key] : periodDays.filter((day) => day !== key);
      const nextLogs = { ...logs };
      if (isEmptyLog(log)) delete nextLogs[key];
      else nextLogs[key] = { ...log, note: log.note.trim() };
      await persist(nextDays, nextLogs);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (pairId && uid) void notifyPartner({ pairId, currentUid: uid, route: "care_period", action: "period_log_updated", title: "Cycle log updated 🌸", body: `${myName || "Your partner"} updated the shared cycle tracker for ${shortDate(fromKey(key))}.` });
      return true;
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : "Please try again.");
      return false;
    } finally { setBusy(false); }
  };

  const quickLogToday = () => {
    const existing = logs[todayKey];
    void saveDay(todayKey, { flow: existing && PERIOD_FLOWS.includes(existing.flow) ? existing.flow : "Medium", symptoms: existing?.symptoms || [], mood: existing?.mood || "", note: existing?.note || "" });
  };

  const savePattern = async () => {
    setBusy(true);
    try { await persist(periodDays, logs, cycleDraft, periodDraft); void Haptics.selectionAsync(); }
    catch (error) { Alert.alert("Couldn't save", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };

  const patternDirty = cycleDraft !== cycleLength || periodDraft !== periodLength;
  const history = runs.slice(-6).reverse();
  const maxCycle = Math.max(35, ...history.map((run, index) => (history[index + 1] ? dayDiff(fromKey(run.start), fromKey(history[index + 1].start)) : 0)));

  return (
    <CarePage eyebrow="SHARED WELLBEING" title="Cycle tracker" subtitle={`Shared privately with ${partnerName}.`} icon={<Droplets color="#fff" size={23} />}>
      {!loaded ? <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} /> : (
        <>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={t.heroWash} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <CycleRing cycleLength={cycleLength} periodLength={periodLength} cycleDay={status.cycleDay} late={status.late > 0} phaseLabel={phase.label} phaseColor={phase.color} />
            <Text style={styles.heroHeadline}>{headline}</Text>
            <Text style={styles.heroMeta}>
              {status.nextStart && !currentRun ? `Expected ${status.nextStart.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}` : currentRun ? `Started ${shortDate(fromKey(currentRun.start))}` : "Predictions start after your first log"}
            </Text>
            <View style={styles.heroActions}>
              <Pressable onPress={currentRun ? () => setSheetDay(todayKey) : quickLogToday} disabled={busy} style={({ pressed }) => [styles.heroPrimary, pressed && styles.pressed]}>
                <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Droplet color="#fff" size={17} fill="#fff" />
                <Text style={styles.heroPrimaryText}>{currentRun ? (periodSet.has(todayKey) ? "Edit today" : "Log today's flow") : "Period started today"}</Text>
              </Pressable>
              <Pressable onPress={() => setSheetDay(todayKey)} style={({ pressed }) => [styles.heroSecondary, pressed && styles.pressed]}>
                <NotebookPen color={t.text} size={17} />
                <Text style={styles.heroSecondaryText}>How I feel</Text>
              </Pressable>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <Stat label="Avg cycle" value={stats.avgCycle ? `${stats.avgCycle}d` : `${cycleLength}d`} hint={stats.avgCycle ? `${stats.tracked} tracked` : "Setting"} />
            <Stat label="Avg period" value={stats.avgPeriod ? `${stats.avgPeriod}d` : `${periodLength}d`} hint={stats.avgPeriod ? "Logged" : "Setting"} />
            <Stat label="Fertile" value={fertile ? `${fertile.start.getDate()}–${fertile.end.getDate()}` : "—"} hint={fertile ? fertile.start.toLocaleDateString(undefined, { month: "short" }) : "Estimate"} />
          </View>

          {/* Phase guide */}
          <Card>
            <View style={styles.phaseHead}>
              <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
              <Text style={styles.phaseTitle}>{phase.label}</Text>
            </View>
            <Text style={styles.body}>{phase.body}</Text>
            <View style={styles.supportBox}>
              <HeartHandshake color={t.accentText} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.supportLabel}>WAYS TO SHOW UP</Text>
                <Text style={styles.supportText}>{phase.support}</Text>
              </View>
            </View>
          </Card>

          {/* Calendar */}
          <Card>
            <View style={styles.monthNav}>
              <Pressable accessibilityLabel="Previous month" hitSlop={8} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.navButton}><ChevronLeft color={t.text} size={18} /></Pressable>
              <Pressable onPress={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
                <Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
              </Pressable>
              <Pressable accessibilityLabel="Next month" hitSlop={8} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.navButton}><ChevronRight color={t.text} size={18} /></Pressable>
            </View>
            <View style={styles.week}>{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekText}>{day}</Text>)}</View>
            <View style={styles.calendar}>
              {cells.map((date, index) => {
                if (!date) return <View key={`blank-${index}`} style={styles.cell} />;
                const info = dayInfo(date);
                const isToday = info.key === todayKey;
                return (
                  <Pressable key={info.key} accessibilityLabel={date.toDateString()} onPress={() => setSheetDay(info.key)} style={styles.cell}>
                    <View style={[
                      styles.day,
                      info.predicted === "fertile" && styles.dayFertile,
                      info.predicted === "ovulation" && styles.dayOvulation,
                      info.predicted === "period" && styles.dayPredicted,
                      info.logged && styles.dayLogged,
                      isToday && styles.dayToday,
                    ]}>
                      <Text style={[styles.dayText, isToday && styles.dayTextStrong, (info.logged || info.predicted === "ovulation") && { color: "#fff", fontWeight: "800" }]}>{date.getDate()}</Text>
                    </View>
                    {info.hasNote && <View style={[styles.noteDot, info.logged && { backgroundColor: "#fff" }]} />}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.legend}>
              <Legend style={{ backgroundColor: ROSE }} label="Period" />
              <Legend style={{ borderWidth: 1.5, borderColor: ROSE, borderStyle: "dashed" }} label="Predicted" />
              <Legend style={{ backgroundColor: "rgba(164,127,214,0.35)" }} label="Fertile" />
              <Legend style={{ backgroundColor: OVULATION }} label="Ovulation" />
            </View>
          </Card>

          {/* History */}
          <Card>
            <SectionTitle icon={<CalendarDays color={t.accentText} size={18} />} title="Cycle history" />
            {history.length ? history.map((run, index) => {
              const total = index === 0 ? Math.max(dayDiff(today, fromKey(run.start)) + 1, run.length) : dayDiff(fromKey(history[index - 1].start), fromKey(run.start));
              return (
                <View key={run.start} style={styles.historyRow}>
                  <View style={styles.historyText}>
                    <Text style={styles.historyDate}>{fromKey(run.start).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</Text>
                    <Text style={styles.historyMeta}>{index === 0 ? `Current · day ${total}` : `${total}-day cycle`} · {run.length}-day period</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(100, (total / maxCycle) * 100)}%` }]}>
                      <View style={[styles.barPeriod, { width: `${Math.min(100, (run.length / total) * 100)}%` }]} />
                    </View>
                  </View>
                </View>
              );
            }) : <Text style={styles.body}>Log period days to build your cycle history.</Text>}
          </Card>

          {/* Pattern */}
          <Card>
            <SectionTitle icon={<Sparkles color={t.accentText} size={18} />} title="Cycle settings" />
            <Text style={[styles.body, { marginBottom: 12 }]}>Used for predictions and the fertile window.</Text>
            <Stepper label="Cycle length" value={cycleDraft} min={21} max={40} onChange={setCycleDraft} />
            <Stepper label="Period length" value={periodDraft} min={2} max={10} onChange={setPeriodDraft} />
            {!!stats.avgCycle && stats.avgCycle >= 21 && stats.avgCycle <= 40 && stats.avgCycle !== cycleDraft && (
              <Pressable onPress={() => setCycleDraft(stats.avgCycle!)} style={styles.suggestion}>
                <Sparkles color={t.violetText} size={14} />
                <Text style={styles.suggestionText}>Use your logged average ({stats.avgCycle} days)</Text>
              </Pressable>
            )}
            {patternDirty && (
              <Pressable onPress={savePattern} disabled={busy || !lastStart} style={({ pressed }) => [styles.saveButton, (!lastStart || busy) && { opacity: 0.5 }, pressed && styles.pressed]}>
                <Text style={styles.saveText}>{lastStart ? "Save settings" : "Log a period first"}</Text>
              </Pressable>
            )}
          </Card>

          <View style={styles.privacy}>
            <ShieldCheck color={t.textMuted} size={16} />
            <Text style={styles.privacyText}>Only your paired accounts can see this. Predictions are estimates. Don&apos;t use them as contraception or a medical diagnosis.</Text>
          </View>
        </>
      )}

      <DaySheet
        dateKey={sheetDay}
        log={sheetDay ? logs[sheetDay] : undefined}
        isPeriodDay={sheetDay ? periodSet.has(sheetDay) : false}
        busy={busy}
        onClose={() => setSheetDay(null)}
        onSave={async (key, log) => { if (await saveDay(key, log)) setSheetDay(null); }}
      />
    </CarePage>
  );
}

/* ---------- Pieces ---------- */

function CycleRing({ cycleLength, periodLength, cycleDay, late, phaseLabel, phaseColor }: { cycleLength: number; periodLength: number; cycleDay: number | null; late: boolean; phaseLabel: string; phaseColor: string }) {
  const t = useTheme();
  const styles = useStyles();
  const size = 216;
  const stroke = 14;
  const r = (size - stroke) / 2 - 6;
  const c = size / 2;
  const per = 360 / cycleLength;
  const polar = (deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) }; };
  const arc = (start: number, end: number) => {
    if (end - start < 1) return "";
    const s = polar(start); const e = polar(end);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };
  const gap = 1.5;
  const markerDeg = cycleDay ? (Math.min(cycleDay, cycleLength) - 0.5) * per : 0;
  const marker = polar(markerDeg);
  const ovu = polar((cycleLength - 14 + 0.5) * per);
  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={t.surfaceSunken} strokeWidth={stroke} fill="none" />
        <Path d={arc(periodLength * per + gap, (cycleLength - 19) * per - gap)} stroke="rgba(233,164,184,0.28)" strokeWidth={stroke} strokeLinecap="round" fill="none" />
        <Path d={arc((cycleLength - 12) * per + gap, 360 - gap)} stroke="rgba(201,163,217,0.25)" strokeWidth={stroke} strokeLinecap="round" fill="none" />
        <Path d={arc((cycleLength - 19) * per + gap, (cycleLength - 12) * per - gap)} stroke={VIOLET} strokeOpacity={0.75} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        <Path d={arc(gap, periodLength * per - gap)} stroke={ROSE} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        <Circle cx={ovu.x} cy={ovu.y} r={4} fill={t.mode === "dark" ? "#fff" : OVULATION} />
        {cycleDay !== null && (
          <>
            <Circle cx={marker.x} cy={marker.y} r={14} fill={late ? "#F2B33D" : phaseColor} opacity={0.3} />
            <Circle cx={marker.x} cy={marker.y} r={9} fill="#fff" />
            <Circle cx={marker.x} cy={marker.y} r={5} fill={late ? "#F2B33D" : phaseColor} />
          </>
        )}
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.ringSmall}>{cycleDay ? "CYCLE DAY" : "WELCOME"}</Text>
        <Text style={styles.ringDay}>{cycleDay ?? "—"}</Text>
        <View style={[styles.ringChip, { backgroundColor: `${phaseColor}33`, borderColor: `${phaseColor}66` }]}>
          <Text style={styles.ringChipText}>{phaseLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function DaySheet({ dateKey, log, isPeriodDay, busy, onClose, onSave }: { dateKey: string | null; log?: DailyLog; isPeriodDay: boolean; busy: boolean; onClose: () => void; onSave: (key: string, log: DailyLog) => void }) {
  const t = useTheme();
  const styles = useStyles();
  const [flow, setFlow] = useState("None");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!dateKey) return;
    setFlow(log?.flow || (isPeriodDay ? "Medium" : "None"));
    setSymptoms(log?.symptoms || []);
    setMood(log?.mood || "");
    setNote(log?.note || "");
  }, [dateKey, log, isPeriodDay]);

  const toggle = (key: string) => { void Haptics.selectionAsync(); setSymptoms((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); };
  const hasData = !!log || isPeriodDay;

  return (
    <Modal visible={!!dateKey} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetEyebrow}>DAILY LOG</Text>
              <Text style={styles.sheetTitle}>{dateKey ? fromKey(dateKey).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : ""}</Text>
            </View>
            <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}><X color={t.text} size={18} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
            <Text style={styles.label}>FLOW</Text>
            <View style={styles.flowRow}>
              {FLOWS.map((item) => {
                const active = flow === item.key;
                return (
                  <Pressable key={item.key} onPress={() => { void Haptics.selectionAsync(); setFlow(item.key); }} style={[styles.flow, active && styles.flowActive]}>
                    <View style={styles.drops}>
                      {item.drops === 0 ? <Minus color={active ? "#fff" : t.textMuted} size={16} /> : Array.from({ length: item.drops }).map((_, i) => (
                        <Droplet key={i} size={item.key === "Spotting" ? 10 : 13} color={active ? "#fff" : ROSE} fill={active ? "#fff" : item.key === "Spotting" ? "transparent" : ROSE} />
                      ))}
                    </View>
                    <Text style={[styles.flowText, active && { color: "#fff" }]}>{item.key}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>SYMPTOMS</Text>
            <View style={styles.chips}>
              {SYMPTOMS.map((item) => {
                const active = symptoms.includes(item.key);
                return (
                  <Pressable key={item.key} onPress={() => toggle(item.key)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={styles.chipEmoji}>{item.emoji}</Text>
                    <Text style={[styles.chipText, active && { color: t.accentText }]}>{item.key}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>MOOD</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {MOODS.map((item) => {
                const active = mood === item.emoji;
                return (
                  <Pressable key={item.emoji} onPress={() => { void Haptics.selectionAsync(); setMood(active ? "" : item.emoji); }} style={[styles.mood, active && styles.moodActive]}>
                    <Text style={styles.moodEmoji}>{item.emoji}</Text>
                    <Text style={[styles.moodLabel, active && { color: t.violetText }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>NOTE</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Anything worth remembering…" placeholderTextColor={t.textMuted} multiline style={styles.noteInput} />
          </ScrollView>

          <View style={styles.sheetActions}>
            {hasData && (
              <Pressable accessibilityLabel="Clear this day" disabled={busy} onPress={() => dateKey && onSave(dateKey, { flow: "None", symptoms: [], mood: "", note: "" })} style={styles.clearButton}>
                <Trash2 color={t.dangerText} size={18} />
              </Pressable>
            )}
            <Pressable disabled={busy} onPress={() => dateKey && onSave(dateKey, { flow, symptoms, mood, note })} style={({ pressed }) => [styles.sheetSave, pressed && styles.pressed, busy && { opacity: 0.6 }]}>
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.saveText}>{busy ? "Saving…" : "Save log"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Card({ children }: { children: React.ReactNode }) { const styles = useStyles(); return <View style={styles.card}>{children}</View>; }
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { const styles = useStyles(); return <View style={styles.sectionTitle}>{icon}<Text style={styles.sectionTitleText}>{title}</Text></View>; }
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  const styles = useStyles();
  return <View style={styles.stat}><Text style={styles.statLabel}>{label.toUpperCase()}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statHint}>{hint}</Text></View>;
}
function Legend({ style, label }: { style: object; label: string }) { const styles = useStyles(); return <View style={styles.legendItem}><View style={[styles.legendDot, style]} /><Text style={styles.legendText}>{label}</Text></View>; }
function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const t = useTheme();
  const styles = useStyles();
  const step = (delta: number) => { const next = Math.min(max, Math.max(min, value + delta)); if (next !== value) { void Haptics.selectionAsync(); onChange(next); } };
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable accessibilityLabel={`Decrease ${label}`} onPress={() => step(-1)} style={[styles.stepButton, value <= min && { opacity: 0.35 }]}><Minus color={t.text} size={16} /></Pressable>
        <Text style={styles.stepValue}>{value}<Text style={styles.stepUnit}> days</Text></Text>
        <Pressable accessibilityLabel={`Increase ${label}`} onPress={() => step(1)} style={[styles.stepButton, value >= max && { opacity: 0.35 }]}><Plus color={t.text} size={16} /></Pressable>
      </View>
    </View>
  );
}


const useStyles = makeStyles((t) => ({
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  hero: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow, borderRadius: 28, paddingTop: 22, paddingBottom: 18, paddingHorizontal: 16, marginBottom: 12, overflow: "hidden", alignItems: "center" },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringSmall: { color: t.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  ringDay: { color: t.text, fontSize: 56, fontWeight: "800", letterSpacing: -2, lineHeight: 62 },
  ringChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  ringChipText: { color: t.text, fontSize: 11, fontWeight: "700" },
  heroHeadline: { color: t.text, fontSize: 21, fontWeight: "800", marginTop: 14, letterSpacing: -0.4 },
  heroMeta: { color: t.textSecondary, fontSize: 13, marginTop: 4 },
  heroActions: { flexDirection: "row", gap: 9, marginTop: 18, alignSelf: "stretch" },
  heroPrimary: { flex: 1.4, height: 50, borderRadius: 16, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  heroPrimaryText: { color: "#fff", fontSize: 14.5, fontWeight: "800" },
  heroSecondary: { flex: 1, height: 50, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  heroSecondaryText: { color: t.text, fontSize: 14, fontWeight: "700" },
  stats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stat: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow, flex: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12 },
  statLabel: { color: t.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  statValue: { color: t.text, fontSize: 20, fontWeight: "800", marginTop: 4, letterSpacing: -0.4 },
  statHint: { color: t.textMuted, fontSize: 10.5, marginTop: 1 },
  card: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow, borderRadius: 24, padding: 18, marginBottom: 12 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitleText: { color: t.text, fontSize: 17, fontWeight: "800" },
  body: { color: t.textSecondary, fontSize: 13.5, lineHeight: 20 },
  phaseHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseTitle: { color: t.text, fontSize: 17, fontWeight: "800" },
  supportBox: { flexDirection: "row", gap: 10, marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: "rgba(224,86,122,0.12)", borderWidth: 1, borderColor: "rgba(224,86,122,0.22)" },
  supportLabel: { color: t.accentText, fontSize: 9.5, fontWeight: "800", letterSpacing: 1.1 },
  supportText: { color: t.text, fontSize: 13.5, lineHeight: 19, marginTop: 3 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  navButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
  monthTitle: { color: t.text, fontSize: 16, fontWeight: "800" },
  week: { flexDirection: "row", marginBottom: 6 },
  weekText: { width: "14.285%", textAlign: "center", color: t.textMuted, fontSize: 11, fontWeight: "800" },
  calendar: { flexDirection: "row", flexWrap: "wrap", rowGap: 4 },
  cell: { width: "14.285%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  day: { width: "84%", aspectRatio: 1, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  dayFertile: { backgroundColor: "rgba(164,127,214,0.22)" },
  dayOvulation: { backgroundColor: OVULATION },
  dayPredicted: { borderWidth: 1.5, borderColor: ROSE, borderStyle: "dashed" },
  dayLogged: { backgroundColor: ROSE, borderWidth: 0 },
  dayToday: { borderWidth: 2, borderColor: t.text, borderStyle: "solid" },
  dayText: { color: t.textSecondary, fontSize: 13, fontWeight: "600" },
  dayTextStrong: { color: t.text, fontWeight: "800" },
  noteDot: { position: "absolute", bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: t.accentText },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 11, height: 11, borderRadius: 6 },
  legendText: { color: t.textSecondary, fontSize: 11, fontWeight: "600" },
  historyRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
  historyText: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 },
  historyDate: { color: t.text, fontSize: 14, fontWeight: "700" },
  historyMeta: { color: t.textMuted, fontSize: 11.5 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: t.surface, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: "rgba(201,163,217,0.35)", overflow: "hidden" },
  barPeriod: { height: 8, borderRadius: 4, backgroundColor: ROSE },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  stepperLabel: { color: t.text, fontSize: 14.5, fontWeight: "700" },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
  stepValue: { color: t.text, fontSize: 17, fontWeight: "800", minWidth: 70, textAlign: "center" },
  stepUnit: { color: t.textMuted, fontSize: 12, fontWeight: "600" },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(164,127,214,0.18)" },
  suggestionText: { color: t.violetText, fontSize: 12, fontWeight: "700" },
  saveButton: { height: 48, borderRadius: 15, backgroundColor: ROSE, alignItems: "center", justifyContent: "center", marginTop: 12 },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  privacy: { flexDirection: "row", gap: 8, paddingHorizontal: 6, paddingTop: 4 },
  privacyText: { flex: 1, color: t.textMuted, fontSize: 11, lineHeight: 16 },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: t.overlay },
  sheet: { maxHeight: "88%", backgroundColor: t.surfaceRaised, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, borderWidth: 1, borderColor: t.border },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: t.surfacePressed, alignSelf: "center", marginBottom: 14 },
  sheetHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sheetEyebrow: { color: t.accentText, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  sheetTitle: { color: t.text, fontSize: 21, fontWeight: "800", marginTop: 3, letterSpacing: -0.3 },
  closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
  label: { color: t.textMuted, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.3, marginTop: 16, marginBottom: 9 },
  flowRow: { flexDirection: "row", gap: 6 },
  flow: { flex: 1, height: 64, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center", gap: 6 },
  flowActive: { backgroundColor: ROSE, borderColor: ROSE },
  drops: { flexDirection: "row", gap: 1, height: 16, alignItems: "center" },
  flowText: { color: t.textSecondary, fontSize: 11, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
  chipActive: { backgroundColor: t.accentSoft, borderColor: t.accent },
  chipEmoji: { fontSize: 13 },
  chipText: { color: t.textSecondary, fontSize: 12.5, fontWeight: "600" },
  mood: { width: 68, height: 72, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center", gap: 4 },
  moodActive: { backgroundColor: t.violetSoft, borderColor: t.violet },
  moodEmoji: { fontSize: 24 },
  moodLabel: { color: t.textSecondary, fontSize: 10.5, fontWeight: "700" },
  noteInput: { minHeight: 84, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, color: t.text, fontSize: 14.5, padding: 14, textAlignVertical: "top" },
  sheetActions: { flexDirection: "row", gap: 9, marginTop: 14 },
  clearButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: t.dangerSoft, alignItems: "center", justifyContent: "center" },
  sheetSave: { flex: 1, height: 52, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
}));
