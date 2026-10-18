import { palette } from "@/constants/design";
import { db } from "@/firebase";
import * as Haptics from "expo-haptics";
import { doc, increment, setDoc } from "firebase/firestore";
import { Brain, RotateCcw, Trophy } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { gameStyles } from "./theme";

const SYMBOLS = ["🌙", "🫶", "✈️", "🎧", "🌹", "☕"];
type Card = { id: string; symbol: string };

const makeDeck = (): Card[] =>
  [...SYMBOLS, ...SYMBOLS]
    .map((symbol, index) => ({ id: `${symbol}-${index}`, symbol }))
    .sort(() => Math.random() - 0.5);

export default function MemoryMatch({ pairId, uid }: { pairId: string | null; uid: string | null }) {
  const [deck, setDeck] = useState(makeDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const awardedRef = useRef(false);
  const complete = matched.length === deck.length;

  useEffect(() => {
    if (!complete || awardedRef.current || !pairId || !uid) return;
    awardedRef.current = true;
    void setDoc(doc(db, "pairs", pairId, "scoreboard", "global"), {
      [uid]: increment(1),
      updatedAt: Date.now(),
    }, { merge: true });
  }, [complete, pairId, uid]);

  useEffect(() => {
    if (open.length !== 2) return;
    const [first, second] = open;
    if (deck[first].symbol === deck[second].symbol) {
      setMatched((current) => [...current, first, second]);
      setOpen([]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const timer = setTimeout(() => setOpen([]), 650);
    return () => clearTimeout(timer);
  }, [deck, open]);

  const revealed = useMemo(() => new Set([...open, ...matched]), [matched, open]);

  const select = (index: number) => {
    if (open.length === 2 || revealed.has(index)) return;
    void Haptics.selectionAsync();
    setOpen((current) => [...current, index]);
    if (open.length === 1) setMoves((value) => value + 1);
  };

  const reset = () => {
    awardedRef.current = false;
    setDeck(makeDeck());
    setOpen([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <View style={gameStyles.card}>
      <View style={gameStyles.titleRow}>
        <View style={styles.icon}><Brain color={palette.violet} size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={gameStyles.title}>Memory Match</Text>
          <Text style={styles.caption}>Find all six couples in the fewest moves.</Text>
        </View>
        <Text style={styles.moves}>{moves} moves</Text>
      </View>
      <View style={styles.grid}>
        {deck.map((card, index) => {
          const isVisible = revealed.has(index);
          return (
            <Pressable
              key={card.id}
              onPress={() => select(index)}
              style={({ pressed }) => [styles.card, isVisible && styles.cardOpen, pressed && styles.pressed]}
            >
              <Text style={styles.symbol}>{isVisible ? card.symbol : "?"}</Text>
            </Pressable>
          );
        })}
      </View>
      {complete && (
        <View style={styles.complete}>
          <Trophy color="#B45309" size={20} />
          <Text style={styles.completeText}>Perfect match in {moves} moves!</Text>
        </View>
      )}
      <Pressable onPress={reset} style={gameStyles.resetBtn}>
        <RotateCcw color={palette.violet} size={17} />
        <Text style={gameStyles.resetText}>Shuffle again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#F0EAFF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  caption: { color: palette.muted, fontSize: 12, marginTop: 2 },
  moves: { color: palette.plum, fontSize: 12, fontWeight: "900", backgroundColor: "#F5EFF8", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 16 },
  card: { width: "22.7%", aspectRatio: 0.86, borderRadius: 16, backgroundColor: palette.inkSoft, alignItems: "center", justifyContent: "center" },
  cardOpen: { backgroundColor: "#FFF4E8", borderWidth: 1, borderColor: "#F9D9B6" },
  pressed: { transform: [{ scale: 0.96 }] },
  symbol: { fontSize: 27, color: "#D9C9E3" },
  complete: { marginTop: 16, borderRadius: 15, padding: 13, backgroundColor: "#FFF7E8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  completeText: { color: "#92400E", fontSize: 14, fontWeight: "800" },
});
