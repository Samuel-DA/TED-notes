// app/(tabs)/Games/KnowMeGame.tsx
import { getAuth } from "firebase/auth";
import { doc, increment, onSnapshot, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { db } from "../../../firebase";
import { gameStyles } from "./theme";
import { notifyGamePartner } from "./notify";

const GAME_ID = "knowme";
const SCOREBOARD_ID = "global";

export default function KnowMeGame({ pairId, myName }: { pairId: string | null; myName: string }) {
  const uid = getAuth().currentUser?.uid;

  const [game, setGame] = useState<any>(null);
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  const gameRef = pairId ? doc(db, "pairs", pairId, "games", GAME_ID) : null;
  const scoreboardRef = pairId ? doc(db, "pairs", pairId, "scoreboard", SCOREBOARD_ID) : null;

  useEffect(() => {
    if (!gameRef) return;
    return onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) {
        setGame({ status: "idle" });
        return;
      }
      setGame(snap.data());
    });
  }, [gameRef]);

  if (!pairId || !uid || !gameRef || !scoreboardRef) return null;
  if (!game) {
    return (
      <View style={gameStyles.card}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  const isCreator = game.createdBy === uid;

  const startGame = async () => {
    if (!questionInput.trim() || !answerInput.trim()) return;

    await setDoc(gameRef, {
      prompt: questionInput.trim(),
      answer: answerInput.trim().toLowerCase(),
      createdBy: uid,
      status: "guessing",
      winner: null,
      wrongGuesses: [], // Array to track incorrect attempts live
      createdAt: Date.now(),
    });

    await notifyGamePartner(pairId, uid, "🧠 Know Me Challenge!", `${myName} asked a question to see how well you know them!`);
    setQuestionInput("");
    setAnswerInput("");
  };

  const submitGuess = async () => {
    if (!guessInput.trim()) return;
    const cleanGuess = guessInput.trim();

    if (cleanGuess.toLowerCase() === game.answer) {
      setConfettiKey((k) => k + 1);

      await updateDoc(gameRef, {
        status: "finished",
        winner: uid,
        finishedAt: Date.now(),
      });

      await setDoc(scoreboardRef, { [uid]: increment(1), updatedAt: Date.now() }, { merge: true });
      await notifyGamePartner(pairId, uid, "🎉 Dynamic Duo!", `${myName} knows you perfectly and scored a point!`);
    } else {
      // Modern inline warning state
      setErrorMessage(`"${cleanGuess}" isn't correct. Try again!`);
      setTimeout(() => setErrorMessage(null), 3500);

      // Log incorrect guess live for the creator to see
      await updateDoc(gameRef, {
        wrongGuesses: arrayUnion(cleanGuess)
      });
    }
    setGuessInput("");
  };

  const handleAbandonAndClear = () => {
    Alert.alert(
      "Abandon Game? ⚠️",
      "Are you sure you want to end this question early? No points will be awarded.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear Game", 
          style: "destructive", 
          onPress: async () => {
            await resetGame();
            await notifyGamePartner(pairId, uid, "🔄 Game Reset", `${myName} cleared the active question to start fresh.`);
          } 
        }
      ]
    );
  };

  const resetGame = async () => {
    await setDoc(gameRef, { status: "idle" });
  };

  return (
    <View style={gameStyles.card}>
      {game.status === "finished" && game.winner === uid && (
        <ConfettiCannon key={confettiKey} count={100} origin={{ x: 180, y: -20 }} fadeOut autoStart />
      )}

      <View style={gameStyles.titleRow}>
        <MaterialCommunityIcons name="brain" size={24} color="#6366f1" />
        <Text style={gameStyles.title}>Know Me</Text>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* IDLE STATE */}
      {game.status === "idle" && (
        <>
          <Text style={gameStyles.description}>Test your partner's knowledge about you by writing a question and its correct answer.</Text>
          
          <Text style={gameStyles.label}>Your Question</Text>
          <TextInput
            value={questionInput}
            onChangeText={setQuestionInput} // ✅ Fixed this: Now calling the function properly!
            placeholder="e.g., What is my dream travel destination?"
            placeholderTextColor="#9ca3af"
            style={gameStyles.input}
          />

          <Text style={gameStyles.label}>The Correct Answer</Text>
          <TextInput
            value={answerInput}
            onChangeText={setAnswerInput}
            placeholder="e.g., Tokyo"
            placeholderTextColor="#9ca3af"
            style={gameStyles.input}
            autoCapitalize="none"
          />

          <TouchableOpacity style={gameStyles.btn} onPress={startGame}>
            <Text style={gameStyles.btnText}>Lock Question</Text>
          </TouchableOpacity>
        </>
      )}

      {/* GUESSING STATE */}
      {game.status === "guessing" && (
        <>
          {isCreator ? (
            <View style={gameStyles.waitingContainer}>
              <ActivityIndicator size="small" color="#6366f1" style={{ marginBottom: 12 }} />
              <Text style={gameStyles.waitingText}>Question locked: <Text style={{ fontWeight: "700" }}>"{game.prompt}"</Text></Text>
              
              {/* LIVE WRONG GUESS TRACKER */}
              {game.wrongGuesses && game.wrongGuesses.length > 0 ? (
                <View style={styles.wrongGuessesBox}>
                  <Text style={styles.wrongGuessesTitle}>Partner's incorrect attempts:</Text>
                  <View style={styles.badgeContainer}>
                    {game.wrongGuesses.map((g: string, idx: number) => (
                      <View key={idx} style={styles.guessBadge}>
                        <Text style={styles.guessBadgeText}>{g}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={[gameStyles.waitingText, { fontSize: 13, marginTop: 8 }]}>
                  Waiting for your partner to guess the answer... 💭
                </Text>
              )}

              <TouchableOpacity style={styles.abandonBtn} onPress={handleAbandonAndClear}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.abandonBtnText}>Clear & End Challenge</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={gameStyles.description}>Your partner wants to see if you know the answer to this question:</Text>
              <View style={gameStyles.promptContainer}>
                <Text style={gameStyles.promptText}>“{game.prompt}”</Text>
              </View>

              <Text style={gameStyles.label}>Your Guess</Text>
              <TextInput
                value={guessInput}
                onChangeText={setGuessInput}
                placeholder="Type your guess..."
                placeholderTextColor="#9ca3af"
                style={gameStyles.input}
                autoCapitalize="none"
              />
              <TouchableOpacity style={gameStyles.btn} onPress={submitGuess}>
                <Text style={gameStyles.btnText}>Submit Guess</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.abandonBtn} onPress={handleAbandonAndClear}>
                <Ionicons name="refresh-outline" size={16} color="#64748b" />
                <Text style={[styles.abandonBtnText, { color: "#64748b" }]}>Give Up & Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* FINISHED STATE */}
      {game.status === "finished" && (
        <View style={gameStyles.winContainer}>
          <Ionicons name="trophy" size={40} color="#eab308" />
          <Text style={gameStyles.winText}>
            {game.winner === uid ? "🎉 You got it right!" : "🙌 Your partner guessed correctly!"}
          </Text>
          <Text style={gameStyles.revealText}>The correct answer was: <Text style={{ fontWeight: "700" }}>{game.answer}</Text></Text>
          
          <TouchableOpacity style={gameStyles.resetBtn} onPress={resetGame}>
            <Text style={gameStyles.resetText}>Play Another Round</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#fca5a5",
    gap: 8,
  },
  errorText: { color: "#b91c1c", fontSize: 14, fontWeight: "600", flex: 1 },
  wrongGuessesBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  wrongGuessesTitle: { fontSize: 13, fontWeight: "700", color: "#64748b", marginBottom: 8, textAlign: "center" },
  badgeContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  guessBadge: { backgroundColor: "#fee2e2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: "#fca5a5" },
  guessBadgeText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
  abandonBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    gap: 6,
  },
  abandonBtnText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
});