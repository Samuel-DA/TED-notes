import { LinearGradient } from "expo-linear-gradient";
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { HeartPulse } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import * as Haptics from "expo-haptics";

import { getPrayerPointOfTheDay, PrayerPointData } from "../../utils/prayerpoint";
import { getVerseOfTheDay, VerseData } from "../../utils/verseOfTheDay";
import { getQuestionOfTheDay, QuestionData } from "../../utils/dailyQuestions";

import LoveNote from "../../components/LoveNote";
import MoodSelector from "../../components/MoodSelector";
import PrayerCard from "../../components/PrayerCard";
import VerseCard from "../../components/VerseCard";
import DailyQuestionCard from "../../components/DailyQuestionCard";
import DailyConnectionCard from "../../components/DailyConnectionCard";
import LongDistanceCard from "../../components/LongDistanceCard";
import AppHeader from "@/components/AppHeader";

import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";
import { notifyPartner } from "@/services/notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@/constants/design";

export default function Home() {
  const { uid, myName, partnerName, pairId } = useApp();
  const insets = useSafeAreaInsets();

  /** DATA STATES */
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [prayerPoint, setPrayerPoint] = useState<PrayerPointData | null>(null);
  const [dailyQuestion, setDailyQuestion] = useState<QuestionData | null>(null);
  const [myMood, setMyMood] = useState("");
  const [partnerMood, setPartnerMood] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteTimestamps, setNoteTimestamps] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actualPartnerUid, setActualPartnerUid] = useState<string | null>(null);

  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
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
          Animated.timing(verseFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(verseScale, { toValue: 1, friction: 7, useNativeDriver: true }),
        ]).start();
      })
      .catch(console.warn);

    getPrayerPointOfTheDay()
      .then((p) => {
        setPrayerPoint(p);
        Animated.parallel([
          Animated.timing(prayerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(prayerScale, { toValue: 1, friction: 7, useNativeDriver: true }),
        ]).start();
      })
      .catch(console.warn);

    const q = getQuestionOfTheDay();
    setDailyQuestion(q);
    Animated.parallel([
      Animated.timing(questionFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(questionScale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [prayerFade, prayerScale, questionFade, questionScale, verseFade, verseScale]);

  /** ACTIONS */
  const sendThinkingOfYouPing = async () => {
    if (!actualPartnerUid || isSendingPing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSendingPing(true);

    try {
      await notifyPartner({ pairId: pairId || "", currentUid: uid || "", route: "home", action: "thinking_of_you", title: "Thinking of you... 💞", body: `${myName} is thinking about you right now!` });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSendingPing(false), 1000);
    }
  };

  const saveQuestionAnswer = async () => {
    if (!pairId || !uid || !typedAnswer.trim()) return;

    try {
      const todayString = getLocalDateString();
      await updateDoc(doc(db, "pairs", pairId), {
        [`dailyConfirmations.${todayString}.questionAnswers.${uid}`]: typedAnswer.trim(),
      });

      setTypedAnswer("");
      Keyboard.dismiss();

      if (actualPartnerUid) {
        await notifyPartner({ pairId, currentUid: uid, route: "home", action: "daily_answer", title: "Question Answered! 💬", body: `${myName} answered today's prompt. Reveal what they wrote!` });
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
        await notifyPartner({ pairId, currentUid: uid, route: "home", action: "prayer_complete", title: "Amen! 🙏", body: `${myName} has prayed over the prayer point today!` });
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
        await notifyPartner({ pairId, currentUid: uid, route: "home", action: "verse_complete", title: "Daily Bread 📖", body: `${myName} finished reading today's scripture verse!` });
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
        await notifyPartner({ pairId, currentUid: uid, route: "home", action: "mood_updated", title: "Mood Update! Status check 💕", body: `${myName} changed their mood to ${emoji}` });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDailyCheckIn = async () => {
    if (!pairId || !uid) return;
    const todayString = getLocalDateString();
    const checkedIn = dailyHistory[todayString]?.checkInUsers?.includes(uid) ?? false;

    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`dailyConfirmations.${todayString}.checkInUsers`]: checkedIn
          ? arrayRemove(uid)
          : arrayUnion(uid),
      });

      if (!checkedIn && actualPartnerUid) {
        await notifyPartner({ pairId, currentUid: uid, route: "home", action: "daily_checkin", title: "Daily connection 💞", body: `${myName || "Your partner"} checked in for today. Join them!` });
      }
    } catch (error) {
      console.error("Unable to update daily check-in:", error);
    }
  };

  const saveMyNote = async () => {
    if (!pairId || !uid) return;
    try {
      await updateDoc(doc(db, "pairs", pairId), {
        [`notes.${uid}`]: notes[uid] || "",
        [`noteTimestamps.${uid}`]: Date.now(),
      });
      if (actualPartnerUid) {
        await notifyPartner({ pairId, currentUid: uid, route: "home", action: "love_note_updated", title: "New Love Note left for you 💜", body: `${myName} updated their love note for you!` });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentUid = uid ?? "";
  const iPrayed = prayerConfirmations.includes(currentUid);
  const partnerPrayed = actualPartnerUid ? prayerConfirmations.includes(actualPartnerUid) : false;
  const iRead = verseConfirmations.includes(currentUid);
  const partnerRead = actualPartnerUid ? verseConfirmations.includes(actualPartnerUid) : false;

  const myAnswer = questionAnswers[currentUid] || "";
  const partnerAnswer = actualPartnerUid ? questionAnswers[actualPartnerUid] || "" : "";
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
      if (!users.includes(currentUid) || !users.includes(actualPartnerUid)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  })();

  return (
    <LinearGradient colors={[palette.ink, "#34203D", "#6A315C"]} style={{ flex: 1 }}>
      {loading || !uid || !pairId ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", fontSize: 16, marginTop: 12 }}>
            Loading your space…
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 24}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: insets.top + 18,
              paddingBottom: 125,
            }}
            /* ⚡️ FIX: Bypasses keyboard layout focus interceptors to enable immediate touch registration */
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <ConfettiCannon count={40} origin={{ x: -10, y: 0 }} fadeOut />

            {/* HEADER BLOCK */}
            <AppHeader
              eyebrow="YOUR PRIVATE SPACE"
              title={`Hi, ${myName || "love"}`}
              subtitle={`Connected with ${partnerName || "your partner"}\n${isSendingPing ? "Sending your Thinking of You…" : "Tap the heart icon to send a Thinking of You"}`}
              icon={<HeartPulse color="#fff" fill="rgba(255,255,255,0.18)" size={25} />}
              onIconPress={sendThinkingOfYouPing}
              iconAccessibilityLabel="Send Thinking of You"
            />

            <DailyConnectionCard
              checkedIn={iCheckedIn}
              partnerCheckedIn={partnerCheckedIn}
              partnerName={partnerName || "Partner"}
              streak={connectionStreak}
              onToggle={toggleDailyCheckIn}
            />

            <LongDistanceCard pairId={pairId} uid={uid || ""} myName={myName || "Your partner"} partnerName={partnerName || "your love"} />

            {/* MODULAR COMPONENT BLOCKS */}
            <PrayerCard
              prayerPoint={prayerPoint}
              scaleAnim={prayerScale}
              fadeAnim={prayerFade}
              iPrayed={iPrayed}
              partnerPrayed={partnerPrayed}
              partnerName={partnerName || ""}
              onToggle={togglePrayerConfirmation}
            />

            <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 16, marginBottom: 16 }}>
              <MoodSelector
                yourMood={myMood}
                setYourMood={saveMyMood}
                partnerMood={partnerMood}
                yourLabel="Your Mood"
                partnerLabel={`${partnerName || "Partner"}'s Mood`}
              />
            </View>

            <View style={{ gap: 12, marginBottom: 16 }}>
              <LoveNote
                title={`${partnerName || "Partner"}'s note 💕`}
                note={actualPartnerUid ? notes[actualPartnerUid] || "" : ""}
                timestamp={actualPartnerUid ? noteTimestamps[actualPartnerUid] : undefined}
                readOnly
              />
              <LoveNote
                title={`${myName}'s note 💜`}
                note={notes[uid] || ""}
                timestamp={noteTimestamps[uid]}
                setNote={(v) => setNotes((n) => ({ ...n, [uid]: v }))}
                saveNote={saveMyNote}
              />
            </View>

            <VerseCard
              verse={verse}
              scaleAnim={verseScale}
              fadeAnim={verseFade}
              iRead={iRead}
              partnerRead={partnerRead}
              partnerName={partnerName || ""}
              onToggle={toggleVerseConfirmation}
            />

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
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
}
