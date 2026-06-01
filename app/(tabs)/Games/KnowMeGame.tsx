import { getAuth } from "firebase/auth";
import {
  doc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { db } from "../../../firebase";

const GAME_ID = "guess";
const SCOREBOARD_ID = "global";

export default function GuessGame({ pairId }: { pairId: string | null }) {
  const uid = getAuth().currentUser?.uid;

  const [game, setGame] = useState<any>(null);
  const [input, setInput] = useState("");
  const [confettiKey, setConfettiKey] = useState(0);

  // 🔹 Firestore references (conditionally initialized but hooks use them safely)
  const gameRef = pairId ? doc(db, "pairs", pairId, "games", GAME_ID) : null;
  const scoreboardRef = pairId
    ? doc(db, "pairs", pairId, "scoreboard", SCOREBOARD_ID)
    : null;

  /** 🔁 Listen to game state */
  useEffect(() => {
    if (!gameRef) return;

    const unsub = onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) {
        setGame({ status: "idle" });
        return;
      }
      setGame(snap.data());
    });

    return unsub;
  }, [gameRef]);

  // 🚨 Early return for safety
  if (!pairId || !uid || !gameRef || !scoreboardRef) return null;
  if (!game) return null;

  const isCreator = game.createdBy === uid;
  const isGuessing = game.status === "guessing";

  /** 🎯 Start a new game */
  const startGame = async () => {
    if (!input.trim()) return;

    await setDoc(gameRef, {
      prompt: input.trim(),
      answer: input.trim().toLowerCase(),
      createdBy: uid,
      status: "guessing",
      winner: null,
      createdAt: Date.now(),
    });

    setInput("");
  };

  /** ✅ Submit a guess */
  const submitGuess = async () => {
    if (!input.trim()) return;

    if (input.trim().toLowerCase() === game.answer) {
      setConfettiKey((k) => k + 1);

      await updateDoc(gameRef, {
        status: "finished",
        winner: uid,
        finishedAt: Date.now(),
      });

      await setDoc(
        scoreboardRef,
        {
          [uid]: increment(1),
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    } else {
      alert("❌ Not quite — try again!");
    }

    setInput("");
  };

  /** 🔁 Reset the game round */
  const resetGame = async () => {
    await setDoc(gameRef, { status: "idle" });
  };

  return (
    <View style={styles.card}>
      <ConfettiCannon
        key={confettiKey}
        count={80}
        origin={{ x: 0, y: 0 }}
        fadeOut
        autoStart
      />

      <Text style={styles.title}>🎯 Guess Game</Text>

      {/* IDLE state */}
      {game.status === "idle" && (
        <>
          <Text style={styles.label}>Enter a word or phrase</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="e.g. ILY"
            style={styles.input}
          />
          <TouchableOpacity style={styles.btn} onPress={startGame}>
            <Text style={styles.btnText}>Start Game</Text>
          </TouchableOpacity>
        </>
      )}

      {/* GUESSING state */}
      {isGuessing && (
        <>
          <Text style={styles.prompt}>
            {isCreator
              ? "Waiting for your partner to guess… 💭"
              : `Guess what "${game.prompt}" means:`}
          </Text>

          {!isCreator && (
            <>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Your guess…"
                style={styles.input}
              />
              <TouchableOpacity style={styles.btn} onPress={submitGuess}>
                <Text style={styles.btnText}>Submit Guess</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* FINISHED state */}
      {game.status === "finished" && (
        <>
          <Text style={styles.win}>
            🎉 Winner: {game.winner === uid ? "You!" : "Your partner"}
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
            <Text style={styles.resetText}>Play Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#4f46e5" },
  label: { marginTop: 10, color: "#6b7280" },
  prompt: { marginTop: 14, fontSize: 16, color: "#111827" },
  win: { marginTop: 16, fontSize: 18, fontWeight: "700" },
  input: {
    marginTop: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  btn: {
    marginTop: 12,
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  resetBtn: { marginTop: 12 },
  resetText: {
    color: "#4f46e5",
    fontWeight: "700",
    textAlign: "center",
  },
});
