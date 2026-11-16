import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { ChevronRight, Heart, Images, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionHeader, ScreenBackground } from "@/components/ui/kit";
import { useTabBarSpace } from "@/components/SleekTabBar";
import { makeStyles, useTheme } from "@/hooks/useTheme";

import { getQuestionOfTheDay } from "../../utils/dailyQuestions";
import type { Suggestion } from "../../utils/questionDeck";
import QuestionOfTheDay, { type QuestionDay } from "@/components/QuestionOfTheDay";
import OutfitOfTheDay from "@/components/OutfitOfTheDay";
import {
  getPrayerPointOfTheDay,
  PrayerPointData,
} from "../../utils/prayerpoint";

import AppHeader from "@/components/AppHeader";
import DailyConnectionCard from "../../components/DailyConnectionCard";
import LongDistanceCard from "../../components/LongDistanceCard";
import LoveNote from "../../components/LoveNote";
import MoodSelector from "../../components/MoodSelector";
import PrayerCard from "../../components/PrayerCard";

import { notifyPartner } from "@/services/notifications";
import { updateWidget } from "@/services/widget";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";

/** Whole days until a visit (0 = today), or null when none is coming up. */
function daysUntil(at: number | null) {
  if (!at) return null;
  const diff = at - Date.now();
  return diff < -86400000 ? null : Math.max(0, Math.ceil(diff / 86400000));
}

export default function Home() {
  const { uid, myName, partnerName, pairId, today, resumeKey } = useApp();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const styles = useStyles();
  const tabSpace = useTabBarSpace();
  const router = useRouter();
  const [nextVisitAt, setNextVisitAt] = useState<number | null>(null);
  const [pingSent, setPingSent] = useState(false);

  /** DATA STATES */
  const [prayerPoint, setPrayerPoint] = useState<PrayerPointData | null>(null);
  const [myMood, setMyMood] = useState("");
  const [partnerMood, setPartnerMood] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteTimestamps, setNoteTimestamps] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [actualPartnerUid, setActualPartnerUid] = useState<string | null>(null);

  const [questionDay, setQuestionDay] = useState<QuestionDay>({});
  const [askedIds, setAskedIds] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSendingPing, setIsSendingPing] = useState(false);

  const [prayerConfirmations, setPrayerConfirmations] = useState<string[]>([]);
  const [dailyHistory, setDailyHistory] = useState<
    Record<string, { checkInUsers?: string[] }>
  >({});

  /** MOUNTED SPRING ANIMATION HOOKS */
  const prayerFade = useRef(new Animated.Value(0)).current;
  const prayerScale = useRef(new Animated.Value(0.9)).current;

  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  /** 🚀 FIXED LIVE FIRESTORE SYNC ENGINE (DECOUPLED FROM RECURSIVE WRITES) */
  useEffect(() => {
    if (!pairId || !uid) return;

    const unsub = onSnapshot(doc(db, "pairs", pairId), (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      const moods = data.moods || {};
      const moodDates = data.moodDates || {};
      const members = data.members || [];
      const todayString = getLocalDateString();

      const history = data.dailyConfirmations || {};
      const dailyData = history[todayString] || {};
      setDailyHistory(history);
      setPrayerConfirmations(dailyData.prayedUsers || []);
      setQuestionDay({ question: dailyData.question, questionAnswers: dailyData.questionAnswers || {}, questionReactions: dailyData.questionReactions || {} });
      setAskedIds(Array.isArray(data.askedQuestionIds) ? data.askedQuestionIds : []);
      setSuggestions(Array.isArray(data.questionSuggestions) ? data.questionSuggestions : []);

      const pUid = members.find((id: string) => id !== uid) || null;
      setActualPartnerUid(pUid);

      // 🌟 Local Evaluation Only: Prevents recursive database write loops inside the listener stream
      if (moods[uid] && moodDates[uid] !== todayString) {
        setMyMood("");
      } else {
        setMyMood(moods[uid] || "");
      }

      if (pUid) {
        if (moods[pUid] && moodDates[pUid] !== todayString) {
          setPartnerMood("");
        } else {
          setPartnerMood(moods[pUid] || "");
        }
      }

      setNotes(data.notes || {});
      setNextVisitAt(typeof data.nextVisitAt === "number" ? data.nextVisitAt : null);
      setNoteTimestamps(data.noteTimestamps || {});
      setLoading(false);
    });

    return unsub;
  }, [pairId, uid, today, resumeKey]);

  /** DATA INITIALIZATION BOOTSTRAPPER */
  useEffect(() => {
    getPrayerPointOfTheDay()
      .then((p) => {
        setPrayerPoint(p);
        Animated.parallel([
          Animated.timing(prayerFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(prayerScale, {
            toValue: 1,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(console.warn);

  }, [
    today,
    prayerFade,
    prayerScale,
  ]);

  /** ACTIONS */
  const sendThinkingOfYouPing = async () => {
    if (!actualPartnerUid || isSendingPing || pingSent) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSendingPing(true);

    try {
      await notifyPartner({
        pairId: pairId || "",
        currentUid: uid || "",
        route: "home",
        action: "thinking_of_you",
        title: "Thinking of you... 💞",
        body: `${myName} is thinking about you right now!`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setPingSent(true);
      setTimeout(() => setIsSendingPing(false), 1000);
      setTimeout(() => setPingSent(false), 30_000);
    }
  };

  const togglePrayerConfirmation = async () => {
    if (!pairId || !uid) return;
    const todayString = getLocalDateString();
    const isAlreadyConfirmed = prayerConfirmations.includes(uid);
    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`dailyConfirmations.${todayString}.prayedUsers`]: isAlreadyConfirmed
          ? arrayRemove(uid)
          : arrayUnion(uid),
      });
      if (!isAlreadyConfirmed && actualPartnerUid) {
        await notifyPartner({
          pairId,
          currentUid: uid,
          route: "home",
          action: "prayer_complete",
          title: "Amen! 🙏",
          body: `${myName} has prayed over the prayer point today!`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveMyMood = async (emoji: string) => {
    if (!pairId || !uid || emoji === myMood) return;
    setMyMood(emoji);
    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`moods.${uid}`]: emoji,
        [`moodDates.${uid}`]: getLocalDateString(),
      });
      if (actualPartnerUid) {
        await notifyPartner({
          pairId,
          currentUid: uid,
          route: "home",
          action: "mood_updated",
          title: "Mood Update! Status check 💕",
          body: `${myName} changed their mood to ${emoji}`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDailyCheckIn = async () => {
    if (!pairId || !uid) return;
    const todayString = getLocalDateString();
    const checkedIn =
      dailyHistory[todayString]?.checkInUsers?.includes(uid) ?? false;
    const partnerWasAlreadyHere = actualPartnerUid
      ? (dailyHistory[todayString]?.checkInUsers?.includes(actualPartnerUid) ??
        false)
      : false;

    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`dailyConfirmations.${todayString}.checkInUsers`]: checkedIn
          ? arrayRemove(uid)
          : arrayUnion(uid),
      });

      if (!checkedIn && actualPartnerUid) {
        await notifyPartner({
          pairId,
          currentUid: uid,
          route: "home",
          action: "daily_checkin",
          title: partnerWasAlreadyHere
            ? "Shared streak secured 🔥"
            : "Daily connection 💞",
          body: partnerWasAlreadyHere
            ? `${myName || "Your partner"} checked in too. You both completed today.`
            : `${myName || "Your partner"} checked in for today. Your check-in will complete the day.`,
        });
      }
    } catch (error) {
      console.error("Unable to update daily check-in:", error);
    }
  };

  const saveMyNote = async (text: string) => {
    if (!pairId || !uid) return;
    setNotes((current) => ({ ...current, [uid]: text }));
    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`notes.${uid}`]: text,
        [`noteTimestamps.${uid}`]: Date.now(),
      });
      if (actualPartnerUid) {
        await notifyPartner({
          pairId,
          currentUid: uid,
          route: "home",
          action: "love_note_updated",
          title: "New Love Note left for you 💜",
          body: `${myName} updated their love note for you!`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentUid = uid ?? "";
  const iPrayed = prayerConfirmations.includes(currentUid);
  const partnerPrayed = actualPartnerUid
    ? prayerConfirmations.includes(actualPartnerUid)
    : false;

  const todayCheckIns = dailyHistory[getLocalDateString()]?.checkInUsers || [];
  const iCheckedIn = todayCheckIns.includes(currentUid);
  const partnerCheckedIn = actualPartnerUid
    ? todayCheckIns.includes(actualPartnerUid)
    : false;

  /** Current and best shared check-in streaks (days where you both checked in). */
  const { current: connectionStreak, best: bestStreak } = (() => {
    if (!currentUid || !actualPartnerUid) return { current: 0, best: 0 };
    const keyOf = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const both = new Set(
      Object.entries(dailyHistory)
        .filter(([, day]) => (day?.checkInUsers || []).includes(currentUid) && (day?.checkInUsers || []).includes(actualPartnerUid))
        .map(([key]) => key),
    );
    // Current streak: count back from today (or yesterday if today isn't complete yet).
    let current = 0;
    const cursor = new Date();
    if (!both.has(keyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (both.has(keyOf(cursor))) { current += 1; cursor.setDate(cursor.getDate() - 1); }
    // Best streak: longest run of consecutive completed days in the whole history.
    let best = 0;
    let run = 0;
    let previous: number | null = null;
    [...both].sort().forEach((key) => {
      const day = Math.round(new Date(`${key}T12:00:00`).getTime() / 86400000);
      run = previous !== null && day - previous === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      previous = day;
    });
    return { current, best: Math.max(best, current) };
  })();

  // Keep the home-screen widget in step with what's on screen.
  const answers = questionDay.questionAnswers || {};
  const iAnswered = !!(uid && answers[uid]);
  const partnerAnswered = !!(actualPartnerUid && answers[actualPartnerUid]);
  const widgetQuestion = iAnswered && partnerAnswered ? "revealed" : iAnswered ? "waiting" : partnerAnswered ? "answer" : "pick";
  const reunionDays = daysUntil(nextVisitAt);
  useEffect(() => {
    if (loading || !partnerName) return;
    void updateWidget({ partnerName, partnerMood, streak: connectionStreak, best: bestStreak, reunionDays, question: widgetQuestion, meCheckedIn: iCheckedIn, partnerCheckedIn });
  }, [loading, partnerName, partnerMood, connectionStreak, bestStreak, reunionDays, widgetQuestion, iCheckedIn, partnerCheckedIn]);

  const legacyQuestion = getQuestionOfTheDay().question.replace(/\s*#\d+\s*$/, "");
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  if (loading || !uid || !pairId) {
    return (
      <ScreenBackground style={styles.loading}>
        <ActivityIndicator size="large" color={t.accent} />
        <Text style={styles.loadingText}>Loading your space…</Text>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 4, paddingBottom: tabSpace + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppHeader
            eyebrow={dateLabel}
            title={`${greeting}, ${myName || "love"}`}
            subtitle={partnerName ? `You and ${partnerName}` : undefined}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={pingSent ? "Thinking of you sent" : "Send Thinking of You"}
                onPress={sendThinkingOfYouPing}
                style={({ pressed }) => [styles.ping, pressed && { transform: [{ scale: 0.92 }] }]}
              >
                <LinearGradient colors={pingSent ? [t.success, t.success] : t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Heart color="#fff" fill={pingSent ? "#fff" : "rgba(255,255,255,0.25)"} size={22} />
                <Text style={styles.pingText}>{pingSent ? "Sent" : isSendingPing ? "…" : "Ping"}</Text>
              </Pressable>
            }
          />

          <DailyConnectionCard
            checkedIn={iCheckedIn}
            partnerCheckedIn={partnerCheckedIn}
            partnerName={partnerName || ""}
            streak={connectionStreak}
            bestStreak={bestStreak}
            onToggle={toggleDailyCheckIn}
          />

          <MoodSelector yourMood={myMood} setYourMood={saveMyMood} partnerMood={partnerMood} partnerLabel={partnerName || "Partner"} />

          <QuestionOfTheDay
            pairId={pairId}
            uid={uid}
            partnerUid={actualPartnerUid}
            myName={myName || "Your partner"}
            partnerName={partnerName || ""}
            today={today}
            day={questionDay}
            askedIds={askedIds}
            suggestions={suggestions}
            legacyQuestion={legacyQuestion}
          />

          <OutfitOfTheDay partnerUid={actualPartnerUid} partnerName={partnerName || ""} />

          <View style={styles.grid}>
            <Pressable accessibilityRole="button" onPress={() => router.push("/memories")} style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.85 }]}>
              <View style={[styles.shortcutIcon, { backgroundColor: t.accentSoft }]}><Images color={t.accentText} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={styles.shortcutTitle}>Memories</Text><Text style={styles.shortcutSub}>Your story so far</Text></View>
              <ChevronRight color={t.textMuted} size={16} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push("/recap")} style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.85 }]}>
              <View style={[styles.shortcutIcon, { backgroundColor: t.violetSoft }]}><Sparkles color={t.violetText} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={styles.shortcutTitle}>Your week</Text><Text style={styles.shortcutSub}>Weekly recap</Text></View>
              <ChevronRight color={t.textMuted} size={16} />
            </Pressable>
          </View>

          <SectionHeader title="Pray together" style={{ marginTop: 12 }} />
          <PrayerCard prayerPoint={prayerPoint} scaleAnim={prayerScale} fadeAnim={prayerFade} iPrayed={iPrayed} partnerPrayed={partnerPrayed} partnerName={partnerName || ""} onToggle={togglePrayerConfirmation} />

          <SectionHeader title="Love notes" />
          <View style={styles.grid}>
            <LoveNote title={`From ${partnerName || "them"}`} note={actualPartnerUid ? notes[actualPartnerUid] || "" : ""} timestamp={actualPartnerUid ? noteTimestamps[actualPartnerUid] : undefined} readOnly compact />
            <LoveNote title="Your note" note={notes[uid] || ""} timestamp={noteTimestamps[uid]} onSave={saveMyNote} compact />
          </View>

          <View style={{ height: 12 }} />
          <LongDistanceCard pairId={pairId} uid={uid} myName={myName || "Your partner"} partnerName={partnerName || "your love"} nextVisitAt={nextVisitAt} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  loading: { alignItems: "center", justifyContent: "center" },
  loadingText: { color: t.textSecondary, fontSize: 15, marginTop: 12, fontWeight: "600" },
  grid: { flexDirection: "row", alignItems: "stretch", gap: 10 },
  ping: { width: 58, height: 58, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center", gap: 1, ...t.shadow },
  pingText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  shortcut: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: t.surface, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: t.border, marginTop: 4, marginBottom: 6 },
  shortcutIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shortcutTitle: { color: t.text, fontSize: 14, fontWeight: "800" },
  shortcutSub: { color: t.textSecondary, fontSize: 11.5, marginTop: 1 },
}));
