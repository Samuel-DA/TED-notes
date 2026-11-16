// app/memories.tsx — one scrollable timeline of everything you've shared.
import { Image } from "expo-image";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { CalendarHeart, CheckCircle2, Flame, Heart, Images, MessageCircleHeart, Shirt, Sparkles } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import MediaThumb from "@/components/chat/MediaThumb";
import MediaViewer from "@/components/chat/MediaViewer";
import { Chip, EmptyState, Screen, type IconType } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { useE2EE } from "@/context/E2EEContext";
import { db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useStorageFile } from "@/services/media";
import type { ChatMedia, Message } from "@/types/chat";
import { fromKey } from "@/utils/dayKey";

type Kind = "photo" | "outfit" | "question" | "plan" | "date" | "milestone";
type Memory = {
  id: string;
  at: number;
  kind: Kind;
  title: string;
  body?: string;
  by?: string;
  media?: ChatMedia;
  outfit?: { path: string; width: number; height: number; caption?: string };
  answers?: { name: string; text: string }[];
};

const FILTERS: { key: "all" | Kind; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "photo", label: "Photos" },
  { key: "outfit", label: "Outfits" },
  { key: "question", label: "Questions" },
  { key: "plan", label: "Plans" },
  { key: "milestone", label: "Milestones" },
];

const KIND_META: Record<Kind, { icon: IconType; tone: "accent" | "violet" | "success" | "warning" | "info" }> = {
  photo: { icon: Images, tone: "accent" },
  outfit: { icon: Shirt, tone: "violet" },
  question: { icon: MessageCircleHeart, tone: "info" },
  plan: { icon: CheckCircle2, tone: "success" },
  date: { icon: CalendarHeart, tone: "violet" },
  milestone: { icon: Flame, tone: "warning" },
};

const MILESTONES = [7, 14, 30, 50, 100, 150, 200, 365];
const millis = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === "function" ? (v as { toMillis: () => number }).toMillis() : typeof v === "number" ? v : 0);
const dayNumber = (key: string) => Math.round(fromKey(key).getTime() / 86400000);

export default function Memories() {
  const { pairId, uid, partnerUid, myName, partnerName, resumeKey } = useApp();
  const e2ee = useE2EE();
  const s = useStyles();
  const t = useTheme();
  const [items, setItems] = useState<Memory[] | null>(null);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [viewing, setViewing] = useState<{ media: ChatMedia; caption?: string } | null>(null);

  const nameOf = (id?: string) => (id === uid ? "You" : partnerName || "Your partner");
  const openCaption = e2ee.openJson;

  useEffect(() => {
    if (!pairId || !uid) return;
    let alive = true;
    const pairRef = doc(db, "pairs", pairId);
    const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);
    (async () => {
      const [pairSnap, outfits, media, todos, dates] = await Promise.all([
        safe(getDoc(pairRef), null),
        safe(getDocs(query(collection(pairRef, "proofOfLife"), orderBy("createdAt", "desc"), limit(200))), null),
        safe(getDocs(query(collection(pairRef, "messages"), where("type", "in", ["image", "video"]), orderBy("createdAt", "desc"), limit(150))), null),
        safe(getDocs(query(collection(pairRef, "todos"), where("completed", "==", true))), null),
        safe(getDocs(collection(pairRef, "careDates")), null),
      ]);
      const out: Memory[] = [];
      const now = Date.now();

      outfits?.docs.forEach((d) => {
        const p = d.data();
        out.push({ id: `o-${d.id}`, at: millis(p.createdAt) || fromKey(p.date).getTime(), kind: "outfit", title: `${p.ownerUid === uid ? "Your" : `${partnerName || "Their"}'s`} outfit`, body: p.caption || undefined, by: p.ownerUid, outfit: { path: p.storagePath, width: p.width, height: p.height, caption: p.caption } });
      });

      media?.docs.forEach((d) => {
        const m = { id: d.id, ...d.data() } as Message;
        if (!m.media || m.deletedAt) return;
        let caption = m.text;
        if (m.e2ee) caption = openCaption<{ t?: string }>({ ...m.e2ee })?.t ?? "";
        out.push({ id: `m-${d.id}`, at: millis(m.createdAt), kind: "photo", title: m.media.kind === "video" ? "Video in chat" : "Photo in chat", body: caption || undefined, by: m.senderId, media: m.media });
      });

      todos?.docs.forEach((d) => {
        const p = d.data();
        const at = millis(p.completedAt);
        if (at) out.push({ id: `p-${d.id}`, at, kind: "plan", title: "Plan done together", body: p.text });
      });

      dates?.docs.forEach((d) => {
        const p = d.data();
        if (typeof p.dateAt === "number" && p.dateAt <= now) out.push({ id: `d-${d.id}`, at: p.dateAt, kind: "date", title: p.title, body: p.note || undefined });
      });

      const pair = pairSnap?.data();
      if (pair) {
        const members: string[] = pair.members || [];
        const history: Record<string, { checkInUsers?: string[]; question?: { text?: string }; questionAnswers?: Record<string, string> }> = pair.dailyConfirmations || {};
        const both = (list?: string[]) => members.length === 2 && members.every((m) => list?.includes(m));

        Object.entries(history).forEach(([key, day]) => {
          const answers = day.questionAnswers || {};
          if (day.question?.text && members.length === 2 && members.every((m) => answers[m])) {
            out.push({ id: `q-${key}`, at: fromKey(key).getTime(), kind: "question", title: day.question.text, answers: members.map((m) => ({ name: nameOf(m), text: answers[m] })) });
          }
        });

        // Streak milestones: the day each run of shared check-ins hit 7, 30, 100…
        let run = 0;
        let prev: number | null = null;
        Object.keys(history).filter((k) => both(history[k].checkInUsers)).sort().forEach((key) => {
          const n = dayNumber(key);
          run = prev !== null && n - prev === 1 ? run + 1 : 1;
          prev = n;
          if (MILESTONES.includes(run)) out.push({ id: `s-${key}`, at: fromKey(key).getTime(), kind: "milestone", title: `${run}-day streak 🔥`, body: "You both checked in every single day." });
        });

        const started = millis(pair.createdAt);
        if (started) out.push({ id: "start", at: started, kind: "milestone", title: "Your space began", body: `${myName || "You"} and ${partnerName || "your partner"} paired up on TED Space.` });
      }

      if (alive) setItems(out.filter((m) => m.at > 0).sort((a, b) => b.at - a.at));
    })();
    return () => { alive = false; };
    // nameOf/openCaption only depend on the values listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairId, uid, partnerUid, partnerName, resumeKey, e2ee.active]);

  const months = useMemo(() => {
    const groups: { label: string; items: Memory[] }[] = [];
    (items || []).filter((m) => filter === "all" || m.kind === filter || (filter === "milestone" && m.kind === "date")).forEach((m) => {
      const label = new Date(m.at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(m); else groups.push({ label, items: [m] });
    });
    return groups;
  }, [items, filter]);

  const counts = useMemo(() => ({
    photos: (items || []).filter((m) => m.kind === "photo" || m.kind === "outfit").length,
    questions: (items || []).filter((m) => m.kind === "question").length,
  }), [items]);

  return (
    <Screen bottom="safe">
      <AppHeader back eyebrow="MEMORIES" title="Your story so far" subtitle={items ? `${counts.photos} photos · ${counts.questions} questions answered together` : "Gathering your moments…"} icon={<Heart color="#fff" size={22} fill="rgba(255,255,255,0.3)" />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} style={s.filtersWrap}>
        {FILTERS.map((f) => <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
      </ScrollView>

      {items === null ? <ActivityIndicator color={t.accent} style={{ marginTop: 30 }} /> : !months.length ? (
        <EmptyState icon={Sparkles} title="Nothing here yet" body="Photos, outfits, answered questions and finished plans collect here as you share them." />
      ) : months.map((group) => (
        <View key={group.label} style={s.month}>
          <Text style={s.monthLabel}>{group.label.toUpperCase()}</Text>
          <View style={s.rail}>
            {group.items.map((m) => <MemoryRow key={m.id} memory={m} by={m.by ? nameOf(m.by) : undefined} onOpen={setViewing} />)}
          </View>
        </View>
      ))}
      <MediaViewer media={viewing?.media ?? null} caption={viewing?.caption} onClose={() => setViewing(null)} />
    </Screen>
  );
}

function MemoryRow({ memory: m, by, onOpen }: { memory: Memory; by?: string; onOpen: (v: { media: ChatMedia; caption?: string }) => void }) {
  const s = useStyles();
  const t = useTheme();
  const meta = KIND_META[m.kind];
  const Icon = meta.icon;
  const tones = { accent: [t.accentSoft, t.accentText], violet: [t.violetSoft, t.violetText], success: [t.successSoft, t.successText], warning: [t.warningSoft, t.warningText], info: [t.infoSoft, t.infoText] } as const;
  const [bg, fg] = tones[meta.tone];
  const when = new Date(m.at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const outfitMedia: ChatMedia | undefined = m.outfit ? { path: m.outfit.path, kind: "image", mimeType: "image/jpeg", width: m.outfit.width, height: m.outfit.height } : undefined;

  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: bg }]}><Icon color={fg} size={15} /></View>
      <View style={s.card}>
        <Text style={s.meta}>{when}{by ? ` · ${by}` : ""}</Text>
        <Text style={s.title}>{m.title}</Text>
        {m.answers?.map((a) => (
          <View key={a.name} style={s.answer}><Text style={s.answerName}>{a.name}</Text><Text style={s.answerText}>{a.text}</Text></View>
        ))}
        {m.media && <View style={s.mediaBox}><MediaThumb media={m.media} maxWidth={260} onPress={() => onOpen({ media: m.media!, caption: m.body })} /></View>}
        {outfitMedia && <OutfitThumb path={outfitMedia.path} onPress={() => onOpen({ media: outfitMedia, caption: m.body })} />}
        {m.body && !m.answers ? <Text style={s.body}>{m.body}</Text> : null}
      </View>
    </View>
  );
}

function OutfitThumb({ path, onPress }: { path: string; onPress: () => void }) {
  const s = useStyles();
  const { uri } = useStorageFile(path);
  return (
    <Pressable accessibilityLabel="Open outfit photo" onPress={onPress} style={s.outfit}>
      {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} /> : <ActivityIndicator />}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  filtersWrap: { marginHorizontal: -16, marginBottom: 8 },
  filters: { paddingHorizontal: 16, gap: 8 },
  month: { marginTop: 14 },
  monthLabel: { color: t.textMuted, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  rail: { borderLeftWidth: 2, borderLeftColor: t.border, marginLeft: 15, paddingLeft: 0 },
  row: { flexDirection: "row", marginBottom: 14, marginLeft: -16 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: t.bgSolid },
  card: { flex: 1, marginLeft: 10, backgroundColor: t.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: t.border },
  meta: { color: t.textMuted, fontSize: 11.5, fontWeight: "700" },
  title: { color: t.text, fontSize: 15.5, fontWeight: "700", marginTop: 3, lineHeight: 21 },
  body: { color: t.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 20 },
  answer: { marginTop: 8, backgroundColor: t.surfaceSunken, borderRadius: 12, padding: 10 },
  answerName: { color: t.accentText, fontSize: 11.5, fontWeight: "800", marginBottom: 2 },
  answerText: { color: t.text, fontSize: 14, lineHeight: 20 },
  mediaBox: { marginTop: 10 },
  outfit: { marginTop: 10, width: 150, height: 200, borderRadius: 14, overflow: "hidden", backgroundColor: t.surfaceSunken, alignItems: "center", justifyContent: "center" },
}));
