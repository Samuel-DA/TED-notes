import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { Shuffle } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../../firebase";
import { notifyGamePartner } from "./notify";

const GAME_ID = "this-or-that";

const PROMPTS = [
  ["Sunrise date", "Sunset date"],
  ["Cook together", "Order our favourite meal"],
  ["Beach escape", "Cosy cabin"],
  ["Plan everything", "Be spontaneous"],
  ["Movie night", "Game night"],
  ["Long voice note", "Surprise phone call"],
  ["Dance together", "Sing together"],
  ["Explore somewhere new", "Return to our favourite place"],
  ["Give a thoughtful gift", "Plan a thoughtful experience"],
  ["Stay up talking", "Wake up early together"],
  ["Take lots of photos", "Keep the moment phone-free"],
  ["Big celebration", "Quiet celebration for two"],
] as const;

type GameData = {
  options: [string, string];
  choices: Record<string, number>;
  round: number;
  createdAt: number;
};

type Props = {
  pairId: string | null;
  uid: string | null;
  myName: string;
  partnerName: string;
};

export default function ThisOrThatGame({ pairId, uid, myName, partnerName }: Props) {
  const [game, setGame] = useState<GameData | null>(null);
  const gameRef = useMemo(
    () => (pairId ? doc(db, "pairs", pairId, "games", GAME_ID) : null),
    [pairId],
  );

  useEffect(() => {
    if (!gameRef) return;
    return onSnapshot(gameRef, (snapshot) => {
      setGame(snapshot.exists() ? (snapshot.data() as GameData) : null);
    });
  }, [gameRef]);

  if (!gameRef || !uid) return null;

  const startRound = async () => {
    const nextRound = (game?.round || 0) + 1;
    const options = PROMPTS[(nextRound - 1) % PROMPTS.length];
    await setDoc(gameRef, {
      options: [...options],
      choices: {},
      round: nextRound,
      createdAt: Date.now(),
    });
    if (pairId) await notifyGamePartner(pairId, uid, "This or That", `${myName} started a new round. Make your pick!`);
  };

  const choose = async (choice: number) => {
    if (!game || game.choices?.[uid] !== undefined) return;
    await updateDoc(gameRef, { [`choices.${uid}`]: choice });
    if (pairId) await notifyGamePartner(pairId, uid, "Your turn to choose", `${myName} made a private pick in This or That.`);
  };

  if (!game) {
    return (
      <View style={styles.card}>
        <Shuffle color="#7c3aed" size={28} />
        <Text style={styles.title}>This or That</Text>
        <Text style={styles.description}>
          Choose privately, then reveal whether you matched.
        </Text>
        <Pressable style={styles.primaryButton} onPress={startRound}>
          <Text style={styles.primaryButtonText}>Start a round</Text>
        </Pressable>
      </View>
    );
  }

  const myChoice = game.choices?.[uid];
  const choiceEntries = Object.entries(game.choices || {});
  const partnerChoice = choiceEntries.find(([playerId]) => playerId !== uid)?.[1];
  const bothAnswered = myChoice !== undefined && partnerChoice !== undefined;
  const matched = bothAnswered && myChoice === partnerChoice;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Shuffle color="#7c3aed" size={24} />
        <Text style={styles.title}>This or That</Text>
        <Text style={styles.round}>Round {game.round}</Text>
      </View>

      <Text style={styles.description}>
        Pick the one you would rather do together.
      </Text>

      <View style={styles.options}>
        {game.options.map((option, index) => {
          const selected = myChoice === index;
          const partnerSelected = bothAnswered && partnerChoice === index;
          return (
            <Pressable
              key={option}
              disabled={myChoice !== undefined}
              onPress={() => choose(index)}
              style={[
                styles.option,
                selected && styles.selectedOption,
                partnerSelected && styles.partnerOption,
              ]}
            >
              <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                {option}
              </Text>
              {bothAnswered && partnerSelected && (
                <Text style={styles.partnerBadge}>{partnerName} chose this</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {myChoice === undefined ? (
        <Text style={styles.status}>Choose one—your answer stays hidden until you both pick.</Text>
      ) : !bothAnswered ? (
        <View style={styles.waitingRow}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={styles.status}>Waiting for {partnerName}…</Text>
        </View>
      ) : (
        <>
          <Text style={styles.result}>
            {matched ? "Perfect match! 💜" : "Different picks—great conversation starter 💬"}
          </Text>
          <Pressable style={styles.primaryButton} onPress={startRound}>
            <Text style={styles.primaryButtonText}>Next round</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#312e81", fontSize: 22, fontWeight: "900", flex: 1 },
  round: { color: "#7c3aed", fontSize: 12, fontWeight: "800" },
  description: { color: "#64748b", lineHeight: 20, marginTop: 8, marginBottom: 16 },
  options: { gap: 10 },
  option: {
    borderWidth: 2,
    borderColor: "#ede9fe",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    minHeight: 66,
    padding: 15,
    justifyContent: "center",
  },
  selectedOption: { borderColor: "#7c3aed", backgroundColor: "#7c3aed" },
  partnerOption: { borderColor: "#f472b6" },
  optionText: { color: "#4c1d95", textAlign: "center", fontWeight: "800", fontSize: 16 },
  selectedOptionText: { color: "#fff" },
  partnerBadge: { color: "#be185d", textAlign: "center", fontSize: 11, marginTop: 5 },
  status: { color: "#64748b", textAlign: "center", marginTop: 16, fontSize: 12 },
  waitingRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  result: { color: "#4c1d95", textAlign: "center", fontWeight: "900", marginTop: 18 },
  primaryButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 15,
    paddingVertical: 14,
    marginTop: 16,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", textAlign: "center" },
});
