// app/(tabs)/Games/GuessGame.tsx
import { getAuth } from "firebase/auth";
import { arrayUnion, doc, increment, onSnapshot, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../firebase";
import { gameStyles } from "./theme";
import { notifyGamePartner } from "./notify";

const GAME_ID = "guess";
const SCOREBOARD_ID = "global";

export default function GuessGame({ pairId, myName }: { pairId: string | null; myName: string }) {
  const uid = getAuth().currentUser?.uid;

  const [game, setGame] = useState<any>(null);
  
  // Explicitly tracked input states for setup configuration
  const [guessWord, setGuessWord] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [hintInput, setHintInput] = useState("");
  
  const [playerGuess, setPlayerGuess] = useState("");
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
    if (!guessWord.trim() || !correctAnswer.trim()) return;

    await setDoc(gameRef, {
      prompt: guessWord.trim(),
      answer: correctAnswer.trim().toLowerCase(),
      hint: hintInput.trim() || null,
      createdBy: uid,
      status: "guessing",
      winner: null,
      wrongGuesses: [],
      createdAt: Date.now(),
    });

    await notifyGamePartner(pairId, uid, "🎯 New Guessing Game!", `${myName} set a new secret challenge for you to decode!`);
    
    // Clear all creation fields cleanly
    setGuessWord("");
    setCorrectAnswer("");
    setHintInput("");
  };

  const submitGuess = async () => {
    if (!playerGuess.trim()) return;
    const cleanGuess = playerGuess.trim();

    if (cleanGuess.toLowerCase() === game.answer) {
      let awarded = false;
      await runTransaction(db, async (transaction) => {
        const currentGame = await transaction.get(gameRef);
        if (!currentGame.exists() || currentGame.data().status !== "guessing") return;
        if (currentGame.data().answer !== cleanGuess.toLowerCase()) return;

        transaction.update(gameRef, {
          status: "finished",
          winner: uid,
          finishedAt: Date.now(),
        });
        transaction.set(
          scoreboardRef,
          { [uid]: increment(1), updatedAt: Date.now() },
          { merge: true },
        );
        awarded = true;
      });

      if (awarded) {
        setConfettiKey((k) => k + 1);
        await notifyGamePartner(pairId, uid, "🎉 Challenge Solved!", `${myName} successfully deciphered your word!`);
      }
    } else {
      setErrorMessage(`"${cleanGuess}" isn't quite right. Try again!`);
      setTimeout(() => setErrorMessage(null), 3500);

      await updateDoc(gameRef, {
        wrongGuesses: arrayUnion(cleanGuess)
      });
    }
    setPlayerGuess("");
  };

  const handleAbandonAndClear = () => {
    Alert.alert(
      "Abandon Game? ⚠️",
      "Are you sure you want to end this game early? No points will be awarded.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear Game", 
          style: "destructive", 
          onPress: async () => {
            await resetGame();
            await notifyGamePartner(pairId, uid, "🔄 Game Reset", `${myName} cleared the active guessing game to start fresh.`);
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
        <Ionicons name="gift" size={24} color="#6366f1" />
        <Text style={gameStyles.title}>Guess the Meaning</Text>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* IDLE STATE: CHOSEN CHANNELS FOR CREATION */}
      {game.status === "idle" && (
        <>
          <Text style={gameStyles.description}>Launch a new puzzle challenge.</Text>
          
          <Text style={gameStyles.label}>Guess Word / Phrase</Text>
          <TextInput
            value={guessWord}
            onChangeText={setGuessWord}
            placeholder="e.g., ILY"
            placeholderTextColor="#9ca3af"
            style={gameStyles.input}
          />

          <Text style={gameStyles.label}>Correct Answer</Text>
          <TextInput
            value={correctAnswer}
            onChangeText={setCorrectAnswer}
            placeholder="e.g., I love you"
            placeholderTextColor="#9ca3af"
            style={gameStyles.input}
            autoCapitalize="none"
          />

          <Text style={gameStyles.label}>Hint (Optional)</Text>
          <TextInput
            value={hintInput}
            onChangeText={setHintInput}
            placeholder="e.g., Three little words..."
            placeholderTextColor="#9ca3af"
            style={gameStyles.input}
          />

          <TouchableOpacity style={gameStyles.btn} onPress={startGame}>
            <Text style={gameStyles.btnText}>Launch New Game</Text>
          </TouchableOpacity>
        </>
      )}

      {/* GUESSING STATE */}
      {game.status === "guessing" && (
        <>
          {isCreator ? (
            <View style={gameStyles.waitingContainer}>
              <ActivityIndicator size="small" color="#6366f1" style={{ marginBottom: 12 }} />
              <Text style={gameStyles.waitingText}>Active word: <Text style={{ fontWeight: "700" }}>{`“${game.prompt}”`}</Text></Text>
              
              {game.wrongGuesses && game.wrongGuesses.length > 0 ? (
                <View style={styles.wrongGuessesBox}>
                  <Text style={styles.wrongGuessesTitle}>Partner&apos;s incorrect attempts:</Text>
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
                  Waiting for your partner to make their first guess... 💭
                </Text>
              )}

              <TouchableOpacity style={styles.abandonBtn} onPress={handleAbandonAndClear}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.abandonBtnText}>Clear & End Challenge</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={gameStyles.description}>Crack the hidden meaning of this prompt:</Text>
              <View style={gameStyles.promptContainer}>
                <Text style={gameStyles.promptText}>“{game.prompt}”</Text>
              </View>

              {game.hint && (
                <View style={styles.hintBox}>
                  <Ionicons name="bulb-outline" size={16} color="#b45309" />
                  <Text style={styles.hintText}><Text style={{ fontWeight: "700" }}>Hint:</Text> {game.hint}</Text>
                </View>
              )}

              <Text style={gameStyles.label}>Your Answer</Text>
              <TextInput
                value={playerGuess}
                onChangeText={setPlayerGuess}
                placeholder="What does it mean?..."
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
            {game.winner === uid ? "🎉 Point Scored!" : "🙌 Solved by partner!"}
          </Text>
          <Text style={gameStyles.revealText}>The answer was: <Text style={{ fontWeight: "700" }}>{game.answer}</Text></Text>
          
          <TouchableOpacity style={gameStyles.resetBtn} onPress={resetGame}>
            <Text style={gameStyles.resetText}>Start a new round</Text>
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
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    gap: 6,
  },
  hintText: { color: "#92400e", fontSize: 14, fontWeight: "500", flex: 1 },
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
