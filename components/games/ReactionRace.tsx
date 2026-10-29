import { palette } from "@/constants/design";
import { db } from "@/firebase";
import * as Haptics from "expo-haptics";
import { doc, increment, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { Gauge, RotateCcw, Trophy, Zap } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { notifyGamePartner } from "./notify";
import { gameStyles } from "./theme";

type Phase = "idle" | "waiting" | "go" | "result" | "early";
type Props = { pairId: string | null; uid: string | null; myName: string; partnerName: string };
type RaceGame = {
  roundId?: string;
  results?: Record<string, number>;
  bests?: Record<string, number>;
  outcome?: "awarded" | "tie" | null;
  awardedUid?: string | null;
  winnerMs?: number | null;
};

export default function ReactionRace({ pairId, uid, myName, partnerName }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [race, setRace] = useState<RaceGame | null>(null);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRound = useRef<string | undefined>(undefined);

  const raceRef = pairId ? doc(db, "pairs", pairId, "games", "reaction-race") : null;
  const scoreboardRef = pairId ? doc(db, "pairs", pairId, "scoreboard", "global") : null;

  useEffect(() => {
    if (!raceRef) return;
    return onSnapshot(raceRef, (snapshot) => {
      const next = snapshot.exists() ? snapshot.data() as RaceGame : null;
      if (next?.roundId !== previousRound.current) {
        previousRound.current = next?.roundId;
        setPhase("idle");
      }
      setRace(next);
    });
  }, [raceRef]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!raceRef || !scoreboardRef || !race?.roundId || race.outcome || Object.keys(race.results ?? {}).length < 2) return;

    let active = true;
    void (async () => {
      const resolution = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(raceRef);
        if (!snapshot.exists()) return null;
        const current = snapshot.data() as RaceGame;
        if (current.roundId !== race.roundId || current.outcome) return null;

        const entries = Object.entries(current.results ?? {}).filter((entry): entry is [string, number] => typeof entry[1] === "number");
        if (entries.length < 2) return null;
        entries.sort((a, b) => a[1] - b[1]);

        if (entries[0][1] === entries[1][1]) {
          transaction.update(raceRef, { outcome: "tie", awardedUid: null, winnerMs: entries[0][1], updatedAt: serverTimestamp() });
          return { winnerUid: null, winningTime: entries[0][1] };
        }

        const [winnerUid, winningTime] = entries[0];
        transaction.update(raceRef, { outcome: "awarded", awardedUid: winnerUid, winnerMs: winningTime, updatedAt: serverTimestamp() });
        transaction.set(scoreboardRef, { [winnerUid]: increment(1), updatedAt: Date.now() }, { merge: true });
        return { winnerUid, winningTime };
      });

      if (!active || !resolution || !pairId || !uid) return;
      const winnerName = resolution.winnerUid === uid ? myName : partnerName;
      const body = resolution.winnerUid
        ? `${winnerName} won the reflex round in ${resolution.winningTime} ms and earned one point.`
        : `You both landed on ${resolution.winningTime} ms — the round is a tie.`;
      await notifyGamePartner(pairId, uid, "Reflex round complete ⚡", body);
    })();

    return () => { active = false; };
  }, [myName, pairId, partnerName, race, raceRef, scoreboardRef, uid]);

  const startNewRound = async () => {
    if (!raceRef || !uid || !pairId) return;
    if (timer.current) clearTimeout(timer.current);
    await setDoc(raceRef, {
      roundId: `${Date.now()}-${uid}`,
      results: {},
      bests: race?.bests ?? {},
      outcome: null,
      awardedUid: null,
      winnerMs: null,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await notifyGamePartner(pairId, uid, "New reflex round ⚡", `${myName} started a reflex race. Fastest time wins the point.`);
  };

  const begin = () => {
    if (!race?.roundId || !uid || race.results?.[uid] !== undefined || race.outcome) return;
    if (timer.current) clearTimeout(timer.current);
    setPhase("waiting");
    timer.current = setTimeout(() => {
      goAt.current = Date.now();
      setPhase("go");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1400 + Math.random() * 2200);
  };

  const tap = async () => {
    if (!race?.roundId || !uid || race.results?.[uid] !== undefined || race.outcome) return;
    if (phase === "idle" || phase === "early") {
      begin();
      return;
    }
    if (phase === "waiting") {
      if (timer.current) clearTimeout(timer.current);
      setPhase("early");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (phase !== "go" || !raceRef) return;

    const milliseconds = Date.now() - goAt.current;
    setPhase("result");
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(raceRef);
      if (!snapshot.exists()) return;
      const current = snapshot.data() as RaceGame;
      if (current.roundId !== race.roundId || current.outcome || current.results?.[uid] !== undefined) return;
      const currentBest = current.bests?.[uid];
      const updates: Record<string, unknown> = {
        [`results.${uid}`]: milliseconds,
        updatedAt: serverTimestamp(),
      };
      if (currentBest === undefined || milliseconds < currentBest) updates[`bests.${uid}`] = milliseconds;
      transaction.update(raceRef, updates);
    });
  };

  const myTime = uid ? race?.results?.[uid] : undefined;
  const partnerEntry = uid ? Object.entries(race?.results ?? {}).find(([id]) => id !== uid) : undefined;
  const partnerTime = partnerEntry?.[1];
  const myBest = uid ? race?.bests?.[uid] : undefined;
  const partnerBest = uid ? Object.entries(race?.bests ?? {}).find(([id]) => id !== uid)?.[1] : undefined;
  const roundComplete = Boolean(race?.outcome);
  const label = phase === "waiting" ? "Wait for it…" : phase === "go" ? "TAP!" : phase === "early" ? "Too soon" : myTime !== undefined ? `${myTime} ms` : "Tap to begin";
  const hint = !race?.roundId
    ? "Create a shared round first"
    : roundComplete
      ? "Round complete"
      : myTime !== undefined
        ? partnerTime !== undefined ? "Comparing both times…" : `Waiting for ${partnerName}`
        : phase === "waiting" ? "Don’t tap yet" : phase === "early" ? "Tap to retry" : "Your first valid tap is final";

  return (
    <View style={gameStyles.card}>
      <View style={gameStyles.titleRow}>
        <View style={styles.icon}><Zap color="#F59E0B" fill="#FBBF24" size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={gameStyles.title}>Reaction Race</Text>
          <Text style={styles.caption}>One attempt each. The fastest time wins the point.</Text>
        </View>
      </View>

      {race?.roundId ? (
        <Pressable disabled={roundComplete || myTime !== undefined} onPress={tap} style={({ pressed }) => [styles.arena, phase === "go" && styles.arenaGo, phase === "early" && styles.arenaEarly, (roundComplete || myTime !== undefined) && styles.arenaDone, pressed && styles.pressed]}>
          <Gauge color={phase === "go" ? "#fff" : "#CABFD0"} size={38} />
          <Text style={[styles.arenaText, phase === "go" && styles.arenaTextGo]}>{label}</Text>
          <Text style={[styles.hint, phase === "go" && styles.arenaTextGo]}>{hint}</Text>
        </Pressable>
      ) : (
        <View style={styles.emptyRound}><Zap color="#F59E0B" size={34} /><Text style={styles.emptyTitle}>Ready for a speed test?</Text><Text style={styles.emptyText}>Start a round, then you and {partnerName} each get one valid attempt.</Text></View>
      )}

      {!!race?.roundId && <View style={styles.resultsRow}>
        <View style={styles.resultBox}><Text style={styles.bestLabel}>YOUR ROUND</Text><Text style={styles.bestValue}>{myTime !== undefined ? `${myTime} ms` : "—"}</Text><Text style={styles.personalBest}>Best {myBest !== undefined ? `${myBest} ms` : "—"}</Text></View>
        <View style={styles.resultBox}><Text numberOfLines={1} style={styles.bestLabel}>{partnerName.toUpperCase()}</Text><Text style={styles.bestValue}>{partnerTime !== undefined ? `${partnerTime} ms` : "—"}</Text><Text style={styles.personalBest}>Best {partnerBest !== undefined ? `${partnerBest} ms` : "—"}</Text></View>
      </View>}

      {roundComplete && <View style={styles.winnerBanner}><Trophy color="#B7791F" size={21} /><Text style={styles.winnerText}>{race?.outcome === "tie" ? `A perfect tie at ${race.winnerMs} ms` : race?.awardedUid === uid ? "You won this round and earned 1 point" : `${partnerName} won this round and earned 1 point`}</Text></View>}

      {(!race?.roundId || roundComplete) && <Pressable onPress={startNewRound} style={gameStyles.resetBtn}><RotateCcw color={palette.violet} size={17} /><Text style={gameStyles.resetText}>{race?.roundId ? "Start a new shared round" : "Start shared round"}</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFF7DF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  caption: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  arena: { height: 210, borderRadius: 16, backgroundColor: palette.inkSoft, alignItems: "center", justifyContent: "center", marginTop: 16 },
  arenaGo: { backgroundColor: palette.success },
  arenaEarly: { backgroundColor: "#7F1D2D" },
  arenaDone: { opacity: 0.92 },
  pressed: { transform: [{ scale: 0.99 }] },
  arenaText: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 12 },
  arenaTextGo: { color: "#fff" },
  hint: { color: "#C6BBCB", fontSize: 13, marginTop: 7 },
  emptyRound: { minHeight: 190, marginTop: 16, borderRadius: 16, backgroundColor: "#F8F4F9", alignItems: "center", justifyContent: "center", padding: 22 },
  emptyTitle: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 10 },
  emptyText: { color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  resultsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  resultBox: { flex: 1, backgroundColor: "#F7F3F8", borderRadius: 14, padding: 12 },
  bestLabel: { color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  bestValue: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
  personalBest: { color: palette.muted, fontSize: 11, marginTop: 3 },
  winnerBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, backgroundColor: "#FFF7DF", padding: 12, marginTop: 12 },
  winnerText: { flex: 1, color: "#7C5310", fontSize: 13, lineHeight: 18, fontWeight: "800" },
});
