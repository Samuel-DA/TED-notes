import { LinearGradient } from "expo-linear-gradient";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

import { useApp } from "../../../context/AppContext";
import { db } from "../../../firebase";
import Scoreboard from "./ScoreBoard";

const GAME_ID = "guess";

interface GuessEntry {
  uid: string;
  guess: string;
  correct: boolean;
}

interface Game {
  prompt: string | null;
  answer: string | null;
  hint: string | null;
  createdBy: string | null;
  status: "idle" | "guessing" | "finished";
  winner: string | null;
  attemptsLeft: number;
  guesses?: GuessEntry[];
}

export default function GuessGame() {
  const { uid, pairId, myName, partnerName, loading: appLoading } = useApp();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  const [word, setWord] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [guess, setGuess] = useState("");

  const [confettiKey, setConfettiKey] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const gameRef = pairId ? doc(db, "pairs", pairId, "games", GAME_ID) : null;

  /** ───────────── Ensure Game Doc ───────────── */
  useEffect(() => {
    if (!gameRef) return;

    (async () => {
      const snap = await getDoc(gameRef);
      if (!snap.exists()) {
        await setDoc(gameRef, {
          status: "idle",
          prompt: null,
          answer: null,
          hint: null,
          createdBy: null,
          winner: null,
          attemptsLeft: 5,
          guesses: [],
        });
      }
    })();
  }, [gameRef]);

  /** ───────────── Listen Game ───────────── */
  useEffect(() => {
    if (!gameRef) return;

    return onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setGame({
        ...data,
        attemptsLeft:
          typeof data.attemptsLeft === "number" ? data.attemptsLeft : 5,
        guesses: data.guesses ?? [],
      } as Game);

      setLoading(false);
    });
  }, [gameRef]);

  /** Auto-scroll guesses */
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [game?.guesses]);

  if (appLoading || loading || !game) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const isCreator = game.createdBy === uid;
  const canGuess = !isCreator && game.status === "guessing";
  const showReset = game.status !== "idle";

  /** ───────────── Actions ───────────── */
  const startGame = async () => {
    if (!word || !answer || !uid || !gameRef) return;

    await updateDoc(gameRef, {
      prompt: word,
      answer: answer.toLowerCase(),
      hint: hint || null,
      createdBy: uid,
      status: "guessing",
      winner: null,
      attemptsLeft: 5,
      guesses: [],
    });

    setWord("");
    setAnswer("");
    setHint("");
  };

  const submitGuess = async () => {
    if (!guess || !uid || !gameRef) return;

    const isCorrect = guess.toLowerCase() === game.answer;

    await updateDoc(gameRef, {
      guesses: arrayUnion({ uid, guess, correct: isCorrect }),
    });

    if (isCorrect) {
      setConfettiKey((k) => k + 1);

      await updateDoc(gameRef, {
        status: "finished",
        winner: uid,
      });

      await updateDoc(doc(db, "pairs", pairId!, "scoreboard", "global"), {
        [uid]: increment(1),
      });
    } else {
      const remaining = game.attemptsLeft - 1;

      if (remaining <= 0) {
        Alert.alert("❌ No attempts left");
        await updateDoc(gameRef, {
          status: "finished",
          winner: game.createdBy,
          attemptsLeft: 0,
        });
      } else {
        await updateDoc(gameRef, { attemptsLeft: remaining });
        Alert.alert(`❌ Wrong guess (${remaining} left)`);
      }
    }

    setGuess("");
  };

  const resetGame = async () => {
    if (!gameRef) return;

    await updateDoc(gameRef, {
      status: "idle",
      prompt: null,
      answer: null,
      hint: null,
      createdBy: null,
      winner: null,
      attemptsLeft: 5,
      guesses: [],
    });
  };

  const nameForUid = (id: string) =>
    id === uid ? (myName ?? "You") : (partnerName ?? "Partner");

  return (
    <LinearGradient colors={["#eef2ff", "#fdf2f8"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {game.status === "finished" && (
            <ConfettiCannon
              key={confettiKey}
              count={180}
              origin={{ x: 200, y: -10 }}
              fadeOut
              fallSpeed={3500}
            />
          )}

          {game.status === "idle" && (
            <View style={styles.card}>
              <Text style={styles.title}>{myName} sets the challenge 💜</Text>

              <TextInput
                placeholder="Word (e.g. ILY)"
                placeholderTextColor="#9ca3af"
                value={word}
                onChangeText={setWord}
                style={styles.input}
              />
              <TextInput
                placeholder="Correct answer"
                placeholderTextColor="#9ca3af"
                value={answer}
                onChangeText={setAnswer}
                style={styles.input}
              />
              <TextInput
                placeholder="Hint (optional)"
                placeholderTextColor="#9ca3af"
                value={hint}
                onChangeText={setHint}
                style={styles.input}
              />

              <TouchableOpacity style={styles.button} onPress={startGame}>
                <Text style={styles.buttonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          )}

          {game.status !== "idle" && (
            <View style={styles.card}>
              <Text style={styles.prompt}>{game.prompt}</Text>
              {game.hint && <Text style={styles.hint}>💡 {game.hint}</Text>}

              <Text style={styles.attempts}>
                Attempts left: {game.attemptsLeft}
              </Text>

              {canGuess && (
                <>
                  <TextInput
                    placeholder={`Your guess, ${myName ?? ""}`}
                    value={guess}
                    onChangeText={setGuess}
                    style={styles.input}
                  />
                  <TouchableOpacity style={styles.button} onPress={submitGuess}>
                    <Text style={styles.buttonText}>Submit Guess</Text>
                  </TouchableOpacity>
                </>
              )}

              <ScrollView
                ref={scrollRef}
                style={{ marginTop: 12, maxHeight: 200 }}
              >
                {game.guesses?.map((g, i) => (
                  <Text
                    key={i}
                    style={{
                      color: g.correct ? "#16a34a" : "#b91c1c",
                      fontWeight: g.uid === uid ? "700" : "500",
                      marginBottom: 4,
                    }}
                  >
                    {nameForUid(g.uid)}: {g.guess} {g.correct ? "✅" : "❌"}
                  </Text>
                ))}
              </ScrollView>

              {game.status === "finished" && (
                <Text style={styles.win}>
                  🎉 Winner: {nameForUid(game.winner!)}
                </Text>
              )}

              {showReset && (
                <TouchableOpacity
                  style={[styles.button, { marginTop: 12 }]}
                  onPress={resetGame}
                >
                  <Text style={styles.buttonText}>Start New Game</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Scoreboard pairId={pairId} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  prompt: { fontSize: 26, fontWeight: "900", textAlign: "center" },
  hint: { textAlign: "center", marginTop: 6, color: "#7c3aed" },
  attempts: { textAlign: "center", marginVertical: 10, fontWeight: "600" },
  input: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800" },
  win: { fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 12 },
});
