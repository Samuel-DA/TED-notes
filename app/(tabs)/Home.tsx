import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { Heart } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionHeader, ScreenBackground } from "@/components/ui/kit";
import { useTabBarSpace } from "@/components/SleekTabBar";
import { makeStyles, useTheme } from "@/hooks/useTheme";

import { getQuestionOfTheDay, QuestionData } from "../../utils/dailyQuestions";
import {
  getPrayerPointOfTheDay,
  PrayerPointData,
} from "../../utils/prayerpoint";
import { getVerseOfTheDay, VerseData } from "../../utils/verseOfTheDay";

import AppHeader from "@/components/AppHeader";
import DailyConnectionCard from "../../components/DailyConnectionCard";
import DailyQuestionCard from "../../components/DailyQuestionCard";
import LongDistanceCard from "../../components/LongDistanceCard";
import LoveNote from "../../components/LoveNote";
import MoodSelector from "../../components/MoodSelector";
import PrayerCard from "../../components/PrayerCard";
import VerseCard from "../../components/VerseCard";

import { notifyPartner } from "@/services/notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";

export default function Home() {
  const { uid, myName, partnerName, pairId } = useApp();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const styles = useStyles();
  const tabSpace = useTabBarSpace();
  const [nextVisitAt, setNextVisitAt] = useState<number | null>(null);
  const [pingSent, setPingSent] = useState(false);

  /** DATA STATES */
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [prayerPoint, setPrayerPoint] = useState<PrayerPointData | null>(null);
  const [dailyQuestion, setDailyQuestion] = useState<QuestionData | null>(null);
  const [myMood, setMyMood] = useState("");
  const [partnerMood, setPartnerMood] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteTimestamps, setNoteTimestamps] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [actualPartnerUid, setActualPartnerUid] = useState<string | null>(null);

  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string>
  >({});
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isSendingPing, setIsSendingPing] = useState(false);

  const [prayerConfirmations, setPrayerConfirmations] = useState<string[]>([]);
  const [verseConfirmations, setVerseConfirmations] = useState<string[]>([]);
  const [dailyHistory, setDailyHistory] = useState<
    Record<string, { checkInUsers?: string[] }>
  >({});

  /** MOUNTED SPRING ANIMATION HOOKS */
  const prayerFade = useRef(new Animated.Value(0)).current;
  const prayerScale = useRef(new Animated.Value(0.9)).current;
  const verseFade = useRef(new Animated.Value(0)).current;
  const verseScale = useRef(new Animated.Value(0.9)).current;
  const questionFade = useRef(new Animated.Value(0)).current;
  const questionScale = useRef(new Animated.Value(0.9)).current;

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
      setVerseConfirmations(dailyData.readUsers || []);
      setQuestionAnswers(dailyData.questionAnswers || {});

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
  }, [pairId, uid]);

  /** DATA INITIALIZATION BOOTSTRAPPER */
  useEffect(() => {
    getVerseOfTheDay()
      .then((v) => {
        setVerse(v);
        Animated.parallel([
          Animated.timing(verseFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(verseScale, {
            toValue: 1,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(console.warn);

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

    const q = getQuestionOfTheDay();
    setDailyQuestion(q);
    Animated.parallel([
      Animated.timing(questionFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(questionScale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    prayerFade,
    prayerScale,
    questionFade,
    questionScale,
    verseFade,
    verseScale,
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

  const saveQuestionAnswer = async () => {
    if (!pairId || !uid || !typedAnswer.trim()) return;

    try {
      const todayString = getLocalDateString();
      await updateDoc(doc(db, "pairs", pairId), {
        [`dailyConfirmations.${todayString}.questionAnswers.${uid}`]:
          typedAnswer.trim(),
      });

      setTypedAnswer("");
      Keyboard.dismiss();

      if (actualPartnerUid) {
        await notifyPartner({
          pairId,
          currentUid: uid,
          route: "home",
          action: "daily_answer",
          title: "Question Answered! 💬",
          body: `${myName} answered today's prompt. Reveal what they wrote!`,
        });
      }
    } catch (e) {
      console.error(e);
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

  const toggleVerseConfirmation = async () => {
    if (!pairId || !uid) return;
    const todayString = getLocalDateString();
    const isAlreadyConfirmed = verseConfirmations.includes(uid);
    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`dailyConfirmations.${todayString}.readUsers`]: isAlreadyConfirmed
          ? arrayRemove(uid)
          : arrayUnion(uid),
      });
      if (!isAlreadyConfirmed && actualPartnerUid) {
        await notifyPartner({
          pairId,
          currentUid: uid,
          route: "home",
          action: "verse_complete",
          title: "Daily Bread 📖",
          body: `${myName} finished reading today's scripture verse!`,
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
  const iRead = verseConfirmations.includes(currentUid);
  const partnerRead = actualPartnerUid
    ? verseConfirmations.includes(actualPartnerUid)
    : false;

  const myAnswer = questionAnswers[currentUid] || "";
  const partnerAnswer = actualPartnerUid
    ? questionAnswers[actualPartnerUid] || ""
    : "";
  const todayCheckIns = dailyHistory[getLocalDateString()]?.checkInUsers || [];
  const iCheckedIn = todayCheckIns.includes(currentUid);
  const partnerCheckedIn = actualPartnerUid
    ? todayCheckIns.includes(actualPartnerUid)
    : false;

  const connectionStreak = (() => {
    if (!currentUid || !actualPartnerUid) return 0;
    let streak = 0;
    const cursor = new Date();
    const todayComplete = iCheckedIn && partnerCheckedIn;
    if (!todayComplete) cursor.setDate(cursor.getDate() - 1);

    for (let day = 0; day < 3660; day += 1) {
      const offset = cursor.getTimezoneOffset();
      const dateKey = new Date(cursor.getTime() - offset * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const users = dailyHistory[dateKey]?.checkInUsers || [];
      if (!users.includes(currentUid) || !users.includes(actualPartnerUid))
        break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  })();

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
            onToggle={toggleDailyCheckIn}
          />

          <MoodSelector yourMood={myMood} setYourMood={saveMyMood} partnerMood={partnerMood} partnerLabel={partnerName || "Partner"} />

          <DailyQuestionCard
            dailyQuestion={dailyQuestion}
            scaleAnim={questionScale}
            fadeAnim={questionFade}
            typedAnswer={typedAnswer}
            setTypedAnswer={setTypedAnswer}
            myAnswer={myAnswer}
            partnerAnswer={partnerAnswer}
            partnerName={partnerName || ""}
            onSave={saveQuestionAnswer}
          />

          <SectionHeader title="Faith together" style={{ marginTop: 12 }} />
          <View style={styles.grid}>
            <PrayerCard prayerPoint={prayerPoint} scaleAnim={prayerScale} fadeAnim={prayerFade} iPrayed={iPrayed} partnerPrayed={partnerPrayed} partnerName={partnerName || ""} onToggle={togglePrayerConfirmation} compact />
            <VerseCard verse={verse} scaleAnim={verseScale} fadeAnim={verseFade} iRead={iRead} partnerRead={partnerRead} partnerName={partnerName || ""} onToggle={toggleVerseConfirmation} compact />
          </View>

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
}));
