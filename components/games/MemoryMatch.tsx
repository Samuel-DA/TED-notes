import { palette } from "@/constants/design";
import { db } from "@/firebase";
import * as Haptics from "expo-haptics";
import { doc, increment, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Brain, Clock3, Play, RotateCcw, Trophy } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { gameStyles } from "./theme";
import { notifyGamePartner } from "./notify";

const SYMBOLS = ["🌙", "🫶", "✈️", "🎧", "🌹", "☕"];
type Card = { id: string; symbol: string };
type MemoryRace = { roundId: string; seed: number; results?: Record<string, number>; awardedUid?: string | null; winnerMs?: number; outcome?: "awarded" | "tie" | null };

function seededDeck(seed: number): Card[] {
  let state = seed || 1;
  const random = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
  const cards = [...SYMBOLS, ...SYMBOLS].map((symbol, index) => ({ id: `${symbol}-${index}`, symbol }));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}

type Props = { pairId: string | null; uid: string | null; myName: string; partnerName: string };

export default function MemoryMatch({ pairId, uid, myName, partnerName }: Props) {
  const [race, setRace] = useState<MemoryRace | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const submittedRound = useRef<string | null>(null);
  const raceRef = useMemo(() => pairId ? doc(db, "pairs", pairId, "games", "memory-race") : null, [pairId]);

  useEffect(() => {
    if (!raceRef) return;
    return onSnapshot(raceRef, (snapshot) => setRace(snapshot.exists() ? snapshot.data() as MemoryRace : null));
  }, [raceRef]);

  useEffect(() => {
    if (!race?.roundId) return;
    setDeck(seededDeck(race.seed)); setOpen([]); setMatched([]); setMoves(0); setPlaying(false); setElapsed(0); submittedRound.current = null;
  }, [race?.roundId, race?.seed]);

  useEffect(() => {
    if (!playing) return;
    const ticker = setInterval(() => setElapsed(Date.now() - startedAt.current), 100);
    return () => clearInterval(ticker);
  }, [playing]);

  useEffect(() => {
    if (!playing || !raceRef || !race || !uid || matched.length !== deck.length || submittedRound.current === race.roundId) return;
    const milliseconds = Math.max(1, Date.now() - startedAt.current);
    submittedRound.current = race.roundId;
    setElapsed(milliseconds); setPlaying(false);
    void updateDoc(raceRef, { [`results.${uid}`]: milliseconds, updatedAt: serverTimestamp() });
  }, [deck.length, matched.length, playing, race, raceRef, uid]);

  useEffect(() => {
    if (!raceRef || !pairId || !uid || !race?.results || race.outcome || Object.keys(race.results).length < 2) return;
    void runTransaction(db, async (transaction) => {
      const current = await transaction.get(raceRef);
      const data = current.data() as MemoryRace | undefined;
      if (!data || data.roundId !== race.roundId || data.outcome || !data.results || Object.keys(data.results).length < 2) return null;
      const finalOrder = Object.entries(data.results).sort(([, left], [, right]) => left - right);
      if (finalOrder[0][1] === finalOrder[1][1]) {
        transaction.update(raceRef, { outcome: "tie", awardedUid: null, winnerMs: finalOrder[0][1], updatedAt: serverTimestamp() });
        return null;
      }
      const [winnerUid, winnerMs] = finalOrder[0];
      transaction.update(raceRef, { outcome: "awarded", awardedUid: winnerUid, winnerMs, updatedAt: serverTimestamp() });
      transaction.set(doc(db, "pairs", pairId, "scoreboard", "global"), { [winnerUid]: increment(1), updatedAt: Date.now() }, { merge: true });
      return { winnerUid, winnerMs };
    }).then((result) => result && result.winnerUid === uid
      ? notifyGamePartner(pairId, uid, "Memory round won 🏆", `${myName} finished the shared board in ${(result.winnerMs / 1000).toFixed(1)} seconds.`)
      : undefined).catch(console.warn);
  }, [myName, pairId, race, raceRef, uid]);

  useEffect(() => {
    if (open.length !== 2) return;
    const [first, second] = open;
    if (deck[first]?.symbol === deck[second]?.symbol) {
      setMatched((current) => [...current, first, second]); setOpen([]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const timer = setTimeout(() => setOpen([]), 650);
    return () => clearTimeout(timer);
  }, [deck, open]);

  const revealed = useMemo(() => new Set([...open, ...matched]), [matched, open]);
  const results = race?.results || {};
  const myResult = uid ? results[uid] : undefined;
  const partnerResult = uid ? Object.entries(results).find(([player]) => player !== uid)?.[1] : undefined;

  const createRound = async () => {
    if (!raceRef || !uid) return;
    await setDoc(raceRef, { roundId: `${Date.now()}-${uid.slice(0, 6)}`, seed: Math.floor(Math.random() * 2_000_000_000), results: {}, createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    if (pairId) await notifyGamePartner(pairId, uid, "New memory round 🧩", `${myName} started a shared memory race. Fastest time wins the point.`);
  };

  const startAttempt = () => {
    if (!race || !uid || results[uid]) return;
    setDeck(seededDeck(race.seed)); setOpen([]); setMatched([]); setMoves(0); setElapsed(0);
    startedAt.current = Date.now(); setPlaying(true);
  };

  const select = (index: number) => {
    if (!playing || open.length === 2 || revealed.has(index)) return;
    void Haptics.selectionAsync(); setOpen((current) => [...current, index]);
    if (open.length === 1) setMoves((value) => value + 1);
  };

  const bothFinished = myResult !== undefined && partnerResult !== undefined;
  const winnerLabel = race?.outcome === "tie"
    ? `A tie at ${(race.winnerMs ?? 0) / 1000}s`
    : race?.awardedUid
      ? (race.awardedUid === uid ? "You won this round!" : `${partnerName} won this round`)
      : bothFinished ? "Both finished · working out the winner…"
        : myResult !== undefined ? `${partnerName} is still playing`
          : partnerResult !== undefined ? `${partnerName} has finished · your turn`
            : "Ready when you are both";

  return <View style={gameStyles.card}>
    <View style={gameStyles.titleRow}><View style={styles.icon}><Brain color={palette.violet} size={20} /></View><View style={{ flex: 1 }}><Text style={gameStyles.title}>Memory Race</Text><Text style={styles.caption}>Same board. Fastest completion wins the round and one point.</Text></View><View style={styles.timer}><Clock3 color={palette.plum} size={14} /><Text style={styles.timerText}>{(elapsed / 1000).toFixed(1)}s · {moves}</Text></View></View>
    {!race ? <Pressable onPress={createRound} style={styles.startButton}><Play color="#fff" size={18} /><Text style={styles.startText}>Create first round</Text></Pressable> : <>
      {!playing && !myResult && <Pressable onPress={startAttempt} style={styles.startButton}><Play color="#fff" size={18} /><Text style={styles.startText}>Start my timed attempt</Text></Pressable>}
      <View style={[styles.grid, !playing && styles.gridPaused]}>{deck.map((card, index) => { const visible = revealed.has(index); return <Pressable disabled={!playing} key={card.id} onPress={() => select(index)} style={({ pressed }) => [styles.card, visible && styles.cardOpen, pressed && styles.pressed]}><Text style={styles.symbol}>{visible ? card.symbol : "?"}</Text></Pressable>; })}</View>
      <View style={styles.results}><View><Text style={styles.resultLabel}>YOU</Text><Text style={styles.resultValue}>{myResult ? `${(myResult / 1000).toFixed(1)}s` : playing ? "Racing…" : "—"}</Text></View><View><Text style={styles.resultLabel}>{partnerName.toUpperCase()}</Text><Text style={styles.resultValue}>{partnerResult ? `${(partnerResult / 1000).toFixed(1)}s` : "—"}</Text></View></View>
      {(myResult !== undefined || partnerResult !== undefined) && <View style={styles.complete}><Trophy color="#B45309" size={20} /><Text style={styles.completeText}>{winnerLabel}</Text></View>}
      {race.outcome && <Pressable onPress={createRound} style={gameStyles.resetBtn}><RotateCcw color={palette.violet} size={17} /><Text style={gameStyles.resetText}>Start a new shared round</Text></Pressable>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#F0EAFF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  caption: { color: palette.muted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  timer: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F5EFF8", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  timerText: { color: palette.plum, fontSize: 11, fontWeight: "900" },
  startButton: { minHeight: 50, marginTop: 16, borderRadius: 16, backgroundColor: palette.rose, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  startText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 16 },
  gridPaused: { opacity: 0.52 },
  card: { width: "22.7%", aspectRatio: 0.86, borderRadius: 16, backgroundColor: palette.inkSoft, alignItems: "center", justifyContent: "center" },
  cardOpen: { backgroundColor: "#FFF4E8", borderWidth: 1, borderColor: "#F9D9B6" },
  pressed: { transform: [{ scale: 0.96 }] },
  symbol: { fontSize: 27, color: "#D9C9E3" },
  results: { flexDirection: "row", justifyContent: "space-around", marginTop: 15, padding: 12, backgroundColor: "#F7F3F8", borderRadius: 16 },
  resultLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, textAlign: "center" },
  resultValue: { color: palette.text, fontSize: 17, fontWeight: "900", marginTop: 3, textAlign: "center" },
  complete: { marginTop: 12, borderRadius: 15, padding: 13, backgroundColor: "#FFF7E8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  completeText: { color: "#92400E", fontSize: 13, fontWeight: "900" },
});
