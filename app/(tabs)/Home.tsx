import { LinearGradient } from "expo-linear-gradient";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { Heart } from "lucide-react-native"; 
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
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

import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";
import { sendPushNotification } from "@/services/notifications"; 

export default function Home() {
  const { uid, myName, partnerName, pairId } = useApp();

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
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  };

  const getPartnerPushToken = useCallback(async (pUid: string) => {
    try {
      const partnerDoc = await getDoc(doc(db, "users", pUid));
      if (partnerDoc.exists()) {
        return partnerDoc.data().expoPushToken || null;
      }
    } catch (e) {
      console.error("Error fetching token:", e);
    }
    return null;
  }, []);

  /** LIVE FIRESTORE SYNC SYNC ENGINE */
  useEffect(() => {
    if (!pairId || !uid) return;

    const unsub = onSnapshot(doc(db, "pairs", pairId), async (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      const moods = data.moods || {};
      const moodDates = data.moodDates || {}; 
      const members = data.members || [];
      const todayString = getLocalDateString();

      // Clear historic dates maps routine syncs
      const dailyData = data.dailyConfirmations?.[todayString] || {};
      setPrayerConfirmations(dailyData.prayedUsers || []);
      setVerseConfirmations(dailyData.readUsers || []);
      setQuestionAnswers(dailyData.questionAnswers || {});

      const pUid = members.find((id: string) => id !== uid) || null;
      setActualPartnerUid(pUid);

      const updatesToApply: Record<string, any> = {};

      if (moods[uid] && moodDates[uid] !== todayString) {
        updatesToApply[`moods.${uid}`] = "";
        updatesToApply[`moodDates.${uid}`] = null;
        setMyMood("");
      } else {
        setMyMood(moods[uid] || "");
      }

      if (pUid) {
        if (moods[pUid] && moodDates[pUid] !== todayString) {
          updatesToApply[`moods.${pUid}`] = "";
          updatesToApply[`moodDates.${pUid}`] = null;
          setPartnerMood("");
        } else {
          setPartnerMood(moods[pUid] || "");
        }
      }

      if (Object.keys(updatesToApply).length > 0) {
        try {
          await updateDoc(doc(db, "pairs", pairId), updatesToApply);
        } catch (e) {
          console.error("Failed executing calendar date resets:", e);
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
    getVerseOfTheDay().then((v) => {
      setVerse(v);
      Animated.parallel([
        Animated.timing(verseFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(verseScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]).start();
    }).catch(console.warn);

    getPrayerPointOfTheDay().then((p) => {
      setPrayerPoint(p);
      Animated.parallel([
        Animated.timing(prayerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(prayerScale, { toValue: 1, friction: 7, useNativeDriver: true }),
      ]).start();
    }).catch(console.warn);

    const q = getQuestionOfTheDay();
    setDailyQuestion(q);
    Animated.parallel([
      Animated.timing(questionFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(questionScale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  /** ACTIONS */
  const sendThinkingOfYouPing = async () => {
    if (!actualPartnerUid || isSendingPing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSendingPing(true);

    try {
      const token = await getPartnerPushToken(actualPartnerUid);
      if (token) {
        await sendPushNotification(token, "Thinking of you... 💞", `${myName} is thinking about you right now!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSendingPing(false), 2000);
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
        const token = await getPartnerPushToken(actualPartnerUid);
        if (token) {
          await sendPushNotification(token, "Question Answered! 💬", `${myName} answered today's prompt. Reveal what they wrote!`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePrayerConfirmation = async () => {
    if (!pairId || !uid) return;
    const todayString = getLocalDateString();
    const isAlreadyConfirmed = prayerConfirmations.includes(uid);
    const updatedArray = isAlreadyConfirmed ? prayerConfirmations.filter(id => id !== uid) : [...prayerConfirmations, uid];

    try {
      await updateDoc(doc(db, "pairs", pairId), { [`dailyConfirmations.${todayString}.prayedUsers`]: updatedArray });
      if (!isAlreadyConfirmed && actualPartnerUid) {
        const token = await getPartnerPushToken(actualPartnerUid);
        if (token) await sendPushNotification(token, "Amen! 🙏", `${myName} has prayed over the prayer point today!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleVerseConfirmation = async () => {
    if (!pairId || !uid) return;
    const todayString = getLocalDateString();
    const isAlreadyConfirmed = verseConfirmations.includes(uid);
    const updatedArray = isAlreadyConfirmed ? verseConfirmations.filter(id => id !== uid) : [...verseConfirmations, uid];

    try {
      await updateDoc(doc(db, "pairs", pairId), { [`dailyConfirmations.${todayString}.readUsers`]: updatedArray });
      if (!isAlreadyConfirmed && actualPartnerUid) {
        const token = await getPartnerPushToken(actualPartnerUid);
        if (token) await sendPushNotification(token, "Daily Bread 📖", `${myName} finished reading today's scripture verse!`);
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
        const token = await getPartnerPushToken(actualPartnerUid);
        if (token) await sendPushNotification(token, "Mood Update! Status check 💕", `${myName} changed their mood to ${emoji}`);
      }
    } catch (e) {
      console.error(e);
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
        const token = await getPartnerPushToken(actualPartnerUid);
        if (token) await sendPushNotification(token, "New Love Note left for you 💜", `${myName} updated their love note for you!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const iPrayed = prayerConfirmations.includes(uid);
  const partnerPrayed = actualPartnerUid ? prayerConfirmations.includes(actualPartnerUid) : false;
  const iRead = verseConfirmations.includes(uid);
  const partnerRead = actualPartnerUid ? verseConfirmations.includes(actualPartnerUid) : false;

  const myAnswer = questionAnswers[uid] || "";
  const partnerAnswer = actualPartnerUid ? questionAnswers[actualPartnerUid] || "" : "";

  return (
    <LinearGradient colors={["#f472b6", "#c084fc"]} style={{ flex: 1 }}>
      {loading || !uid || !pairId ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", fontSize: 16, marginTop: 12 }}>Loading your space…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          // 👑 'height' behavior combined with structural vertical padding offsets prevents soft layout compression issues on Android devices
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 24}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: Platform.OS === 'android' ? 90 : 60 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ConfettiCannon count={40} origin={{ x: -10, y: 0 }} fadeOut />

            {/* HEADER BLOCK */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <TouchableOpacity onPress={sendThinkingOfYouPing} activeOpacity={0.6} disabled={isSendingPing}>
                <Heart color="#fff" size={36} fill={isSendingPing ? "#ffe4e6" : "#fff"} style={{ marginRight: 10, transform: [{ scale: isSendingPing ? 1.2 : 1 }] }} />
              </TouchableOpacity>
              <View>
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>TED Space</Text>
                <Text style={{ color: "#fce7f3", fontSize: 14 }}>Just for {myName} & {partnerName || "Partner"}</Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontStyle: "italic" }}>Tap 🤍 to ping</Text>
              </View>
            </View>

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
              <MoodSelector yourMood={myMood} setYourMood={saveMyMood} partnerMood={partnerMood} yourLabel="Your Mood" partnerLabel={`${partnerName || "Partner"}'s Mood`} />
            </View>

            <View style={{ gap: 12, marginBottom: 16 }}>
              <LoveNote title={`${partnerName || "Partner"}'s note 💕`} note={actualPartnerUid ? notes[actualPartnerUid] || "" : ""} timestamp={actualPartnerUid ? noteTimestamps[actualPartnerUid] : undefined} readOnly />
              <LoveNote title={`${myName}'s note 💜`} note={notes[uid] || ""} timestamp={noteTimestamps[uid]} setNote={(v) => setNotes((n) => ({ ...n, [uid]: v }))} saveNote={saveMyNote} />
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