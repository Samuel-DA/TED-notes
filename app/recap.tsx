// app/recap.tsx — the Sunday-evening "your week together" recap, plus past weeks.
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { CalendarHeart, CheckCircle2, Flame, HandHeart, Images, MessageCircle, MessageCircleHeart, Mic, Shirt, Sparkles } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { Button, Card, SectionHeader, Screen, type IconType } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { addDays, fromKey, toKey } from "@/utils/dayKey";

export type Recap = {
  id: string;
  weekStart: string;
  weekEnd: string;
  checkInDays: number;
  prayedTogether: number;
  questionsAnswered: number;
  questionHighlight?: string | null;
  messages: number;
  outfits: number;
  plansDone: number;
  voiceNotes: number;
  streak: number;
};

type Day = { checkInUsers?: string[]; prayedUsers?: string[]; questionAnswers?: Record<string, string> };

const range = (r: Pick<Recap, "weekStart" | "weekEnd">) =>
  `${fromKey(r.weekStart).toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${fromKey(r.weekEnd).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

function headline(r: Recap, partner: string) {
  if (r.checkInDays === 7) return `A perfect week with ${partner} 💞`;
  if (r.checkInDays >= 5) return `You showed up for each other ${r.checkInDays} of 7 days`;
  if (r.messages > 100) return `${r.messages} messages. You two had a lot to say`;
  if (r.checkInDays > 0) return "Every check-in counts. Keep going this week";
  return "A quiet week. Start fresh with a check-in today";
}

export default function RecapScreen() {
  const { pairId, partnerName, resumeKey } = useApp();
  const router = useRouter();
  const s = useStyles();
  const t = useTheme();
  const [recaps, setRecaps] = useState<Recap[] | null>(null);
  const [history, setHistory] = useState<Record<string, Day>>({});
  const [members, setMembers] = useState<string[]>([]);
  const partner = partnerName || "your partner";

  useEffect(() => {
    if (!pairId) return;
    const unsubRecaps = onSnapshot(query(collection(db, "pairs", pairId, "recaps"), orderBy("weekEnd", "desc"), limit(12)), (snap) => {
      setRecaps(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recap));
    }, () => setRecaps([]));
    const unsubPair = onSnapshot(doc(db, "pairs", pairId), (snap) => {
      setHistory(snap.data()?.dailyConfirmations || {});
      setMembers(snap.data()?.members || []);
    });
    return () => { unsubRecaps(); unsubPair(); };
  }, [pairId, resumeKey]);

  // Live "this week so far": everything since the last recap (or the last 7 days).
  const soFar = useMemo(() => {
    const both = (list?: string[]) => members.length === 2 && members.every((m) => list?.includes(m));
    const since = recaps?.[0]?.weekEnd;
    const days: string[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const key = toKey(addDays(new Date(), -i));
      if (!since || key > since) days.push(key);
    }
    return {
      days: days.length,
      checkIns: days.filter((k) => both(history[k]?.checkInUsers)).length,
      prayers: days.filter((k) => both(history[k]?.prayedUsers)).length,
      questions: days.filter((k) => members.length === 2 && members.every((m) => history[k]?.questionAnswers?.[m])).length,
    };
  }, [history, members, recaps]);

  const latest = recaps?.[0];

  return (
    <Screen bottom="safe">
      <AppHeader back eyebrow="WEEKLY RECAP" title="Your week together" subtitle="A little look back every Sunday evening." icon={<CalendarHeart color="#fff" size={22} />} />

      {recaps === null ? <ActivityIndicator color={t.accent} style={{ marginTop: 30 }} /> : (
        <>
          {latest ? (
            <View style={s.hero}>
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroFill} />
              <Text style={s.heroEyebrow}>{range(latest).toUpperCase()}</Text>
              <Text style={s.heroTitle}>{headline(latest, partner)}</Text>
              <View style={s.week}>
                {Array.from({ length: 7 }, (_, i) => {
                  const key = toKey(addDays(fromKey(latest.weekStart), i));
                  const done = members.length === 2 && members.every((m) => history[key]?.checkInUsers?.includes(m));
                  return (
                    <View key={key} style={s.weekDay}>
                      <View style={[s.weekDot, done && s.weekDotOn]}>{done && <Flame color={t.accent} size={13} />}</View>
                      <Text style={s.weekLabel}>{fromKey(key).toLocaleDateString(undefined, { weekday: "narrow" })}</Text>
                    </View>
                  );
                })}
              </View>
              {latest.streak > 1 && <Text style={s.heroFoot}>🔥 {latest.streak}-day streak going into this week</Text>}
            </View>
          ) : (
            <Card style={{ marginBottom: 6 }}>
              <Text style={s.emptyTitle}>Your first recap lands on Sunday</Text>
              <Text style={s.emptyBody}>Every Sunday at 6pm you’ll both get a summary of the week: check-ins, prayers, questions, photos and plans.</Text>
            </Card>
          )}

          {latest && (
            <View style={s.grid}>
              <Stat icon={CheckCircle2} value={`${latest.checkInDays}/7`} label="Days you both checked in" />
              <Stat icon={HandHeart} value={latest.prayedTogether} label="Days you prayed together" />
              <Stat icon={MessageCircleHeart} value={latest.questionsAnswered} label="Questions answered" />
              <Stat icon={MessageCircle} value={latest.messages} label="Messages" />
              <Stat icon={Shirt} value={latest.outfits} label="Outfits posted" />
              <Stat icon={Sparkles} value={latest.plansDone} label="Plans done" />
              {latest.voiceNotes > 0 && <Stat icon={Mic} value={latest.voiceNotes} label="Voice notes" />}
            </View>
          )}

          {latest?.questionHighlight ? (
            <Card style={{ marginTop: 4 }}>
              <Text style={s.quoteEyebrow}>A QUESTION YOU BOTH ANSWERED</Text>
              <Text style={s.quote}>“{latest.questionHighlight}”</Text>
            </Card>
          ) : null}

          <SectionHeader title="This week so far" style={{ marginTop: 16 }} />
          <Card>
            <Text style={s.soFar}>
              {soFar.checkIns} of {soFar.days} days checked in together · {soFar.prayers} prayers · {soFar.questions} questions
            </Text>
            <Button title="See your memories" icon={Images} variant="secondary" onPress={() => router.push("/memories")} style={{ marginTop: 12 }} />
          </Card>

          {recaps.length > 1 && (
            <>
              <SectionHeader title="Earlier weeks" style={{ marginTop: 16 }} />
              {recaps.slice(1).map((r) => (
                <View key={r.id} style={s.pastRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pastRange}>{range(r)}</Text>
                    <Text style={s.pastBody}>{r.checkInDays}/7 check-ins · {r.messages} messages · {r.questionsAnswered} questions</Text>
                  </View>
                  <Text style={s.pastScore}>{r.checkInDays === 7 ? "💞" : r.checkInDays >= 5 ? "🔥" : "🌱"}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function Stat({ icon: Icon, value, label }: { icon: IconType; value: number | string; label: string }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={s.stat}>
      <Icon color={t.accentText} size={17} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  hero: { borderRadius: 26, overflow: "hidden", padding: 20, marginBottom: 12, ...t.shadowLg },
  heroFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroEyebrow: { color: "rgba(255,255,255,0.8)", fontSize: 11.5, fontWeight: "800", letterSpacing: 1.1 },
  heroTitle: { color: "#fff", fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 6, lineHeight: 29 },
  week: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  weekDay: { alignItems: "center", gap: 5 },
  weekDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  weekDotOn: { backgroundColor: "#fff" },
  weekLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: "700" },
  heroFoot: { color: "#fff", fontSize: 13.5, fontWeight: "700", marginTop: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  stat: { width: "48%", flexGrow: 1, backgroundColor: t.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: t.border },
  statValue: { color: t.text, fontSize: 24, fontWeight: "800", marginTop: 8, letterSpacing: -0.5 },
  statLabel: { color: t.textSecondary, fontSize: 12.5, marginTop: 2, fontWeight: "600" },
  quoteEyebrow: { color: t.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  quote: { color: t.text, fontSize: 16, fontWeight: "600", marginTop: 6, lineHeight: 23 },
  emptyTitle: { color: t.text, fontSize: 17, fontWeight: "800" },
  emptyBody: { color: t.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 20 },
  soFar: { color: t.text, fontSize: 14.5, fontWeight: "600", lineHeight: 21 },
  pastRow: { flexDirection: "row", alignItems: "center", backgroundColor: t.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: t.border },
  pastRange: { color: t.text, fontSize: 14.5, fontWeight: "700" },
  pastBody: { color: t.textSecondary, fontSize: 12.5, marginTop: 3 },
  pastScore: { fontSize: 22 },
}));
