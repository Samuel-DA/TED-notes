import { LinearGradient } from "expo-linear-gradient";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Heart } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import {
  getPrayerPointOfTheDay,
  PrayerPointData,
} from "../../utils/prayerpoint";
import { getVerseOfTheDay, VerseData } from "../../utils/verseOfTheDay";

import LoveNote from "../../components/LoveNote";
import MoodSelector from "../../components/MoodSelector";
import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";

const MOODS = ["🥰", "😊", "😌", "🥺", "😔"];

export default function Home() {
  /** CONTEXT */
  const { uid, myName, partnerName, pairId } = useApp();

  /** STATE */
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [prayerPoint, setPrayerPoint] = useState<PrayerPointData | null>(null);
  const prayerFade = useRef(new Animated.Value(0)).current;
  const prayerScale = useRef(new Animated.Value(0.9)).current;
  const [myMood, setMyMood] = useState("🥰");
  const [partnerMood, setPartnerMood] = useState("🥰");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /** ANIMATION */
  const verseFade = useRef(new Animated.Value(0)).current;
  const verseScale = useRef(new Animated.Value(0.9)).current;

  /** FIRESTORE SUBSCRIPTION */
  useEffect(() => {
    if (!pairId || !uid) return;

    const unsub = onSnapshot(doc(db, "pairs", pairId), (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      const moods = data.moods || {};
      const allNotes = data.notes || {};

      setMyMood(moods[uid] || "🥰");
      setNotes(allNotes);

      const partnerUid = Object.keys(moods).find((id) => id !== uid);
      setPartnerMood(partnerUid ? moods[partnerUid] : "🥰");

      setLoading(false);
    });

    return unsub;
  }, [pairId, uid]);

  /** VERSE OF THE DAY */
  useEffect(() => {
    getVerseOfTheDay()
      .then((v) => {
        setVerse(v);
        Animated.parallel([
          Animated.timing(verseFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(verseScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(console.warn);
  }, []);

  // PRAYER POINT OF THE DAY
  useEffect(() => {
    getPrayerPointOfTheDay()
      .then((p) => {
        setPrayerPoint(p);

        // Animate in
        Animated.parallel([
          Animated.timing(prayerFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(prayerScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      })
      .catch(console.warn);
  }, []);

  /** KEYBOARD HANDLING */
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /** SAVE MY MOOD ONLY */
  const saveMyMood = async (emoji: string) => {
    if (!pairId || !uid || emoji === myMood) return;
    setMyMood(emoji);
    await updateDoc(doc(db, "pairs", pairId), {
      [`moods.${uid}`]: emoji,
      updatedAt: Date.now(),
    });
  };

  /** SAVE MY NOTE ONLY */
  const saveMyNote = async () => {
    if (!pairId || !uid) return;
    await updateDoc(doc(db, "pairs", pairId), {
      [`notes.${uid}`]: notes[uid] || "",
      updatedAt: Date.now(),
    });
  };

  /** FIND PARTNER UID SAFELY */
  const partnerUid = uid
    ? Object.keys(notes).find((id) => id !== uid)
    : undefined;

  /** RENDER */
  return (
    <LinearGradient
      colors={["#f472b6", "#c084fc"]}
      style={{ flex: 1,  paddingHorizontal: 10 }}
    >
      {loading || !uid || !pairId ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>
            Loading your space…
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: keyboardHeight + 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false} 
          >
            <ConfettiCannon count={50} origin={{ x: -10, y: 0 }} fadeOut />

            {/* HEART ICON */}
            <View style={{ marginLeft: 4, paddingTop: 12 }}>
              <Heart color="#fff" size={50} />
            </View>

            <Text
              style={{
                fontSize: 36,
                fontWeight: "800",
                color: "#fff",
                marginBottom: 4,
              }}
            >
              TED Space
            </Text>
            <Text style={{ color: "#fce7f3", fontSize: 16, marginBottom: 24 }}>
              A space just for {myName} and {partnerName || "Partner"}
            </Text>

             {prayerPoint && (
              <Animated.View
                style={{
                  marginBottom: 24,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.2)", // slightly more visible
                  transform: [{ scale: prayerScale }],
                  opacity: prayerFade,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  Prayer Point of the Day
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontStyle: "italic",
                    marginBottom: 6,
                  }}
                >
                  {prayerPoint.text}
                </Text>
                <Text style={{ color: "#fce7f3", fontSize: 14 }}>
                  — {prayerPoint.reference}
                </Text>
              </Animated.View>
            )}

            {/* MOODS */}
            <MoodSelector
              yourMood={myMood}
              setYourMood={saveMyMood}
              partnerMood={partnerMood}
              MOODS={MOODS}
              yourLabel="Your Mood"
              partnerLabel={`${partnerName || "Partner"}'s Mood`}
            />

            {/* PARTNER NOTE */}
            <LoveNote
              title={`${partnerName || "Partner"}'s note 💕`}
              note={partnerUid ? notes[partnerUid] || "" : ""}
              readOnly
            />

            {/* MY NOTE */}
            <LoveNote
              title={`${myName}'s note 💜`}
              note={notes[uid] || ""}
              setNote={(v) => setNotes((n) => ({ ...n, [uid]: v }))}
              saveNote={saveMyNote}
            />
 {/* VERSE OF THE DAY */}
            {verse && (
              <Animated.View
                style={{
                  marginBottom: 24,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  transform: [{ scale: verseScale }],
                  opacity: verseFade,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  Verse of the Day
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontStyle: "italic",
                    marginBottom: 6,
                  }}
                >
                  “{verse.text}
                </Text>
                <Text style={{ color: "#fce7f3", fontSize: 14 }}>
                  — {verse.reference}
                </Text>
              </Animated.View>
            )}
          
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
}
