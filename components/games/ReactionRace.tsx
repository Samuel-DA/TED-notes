import { palette } from "@/constants/design";
import { db } from "@/firebase";
import * as Haptics from "expo-haptics";
import { doc, increment, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Gauge, RotateCcw, Zap } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { gameStyles } from "./theme";
import { notifyGamePartner } from "./notify";

type Phase = "idle" | "waiting" | "go" | "result" | "early";
type Props = { pairId: string | null; uid: string | null; myName: string; partnerName: string };

export default function ReactionRace({ pairId, uid, myName, partnerName }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<number | null>(null);
  const [bests, setBests] = useState<Record<string, number>>({});
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(doc(db, "pairs", pairId, "games", "reaction-race"), (snapshot) => {
      setBests(snapshot.data()?.bests ?? {});
    });
  }, [pairId]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const begin = () => {
    if (timer.current) clearTimeout(timer.current);
    setResult(null);
    setPhase("waiting");
    timer.current = setTimeout(() => {
      goAt.current = Date.now();
      setPhase("go");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1400 + Math.random() * 2200);
  };

  const tap = async () => {
    if (phase === "idle" || phase === "result" || phase === "early") {
      begin();
      return;
    }
    if (phase === "waiting") {
      if (timer.current) clearTimeout(timer.current);
      setPhase("early");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (phase !== "go") return;
    const milliseconds = Date.now() - goAt.current;
    setResult(milliseconds);
    setPhase("result");
    if (pairId && uid && (!bests[uid] || milliseconds < bests[uid])) {
      await Promise.all([
        setDoc(doc(db, "pairs", pairId, "games", "reaction-race"), {
          bests: { ...bests, [uid]: milliseconds },
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(db, "pairs", pairId, "scoreboard", "global"), {
          [uid]: increment(1),
          updatedAt: Date.now(),
        }, { merge: true }),
      ]);
      await notifyGamePartner(pairId, uid, "New reflex record ⚡", `${myName} set a ${milliseconds} ms reaction time. Can you beat it?`);
    }
  };

  const myBest = uid ? bests[uid] : undefined;
  const partnerBest = uid ? Object.entries(bests).find(([id]) => id !== uid)?.[1] : undefined;
  const label = phase === "idle" ? "Tap to begin" : phase === "waiting" ? "Wait for it…" : phase === "go" ? "TAP!" : phase === "early" ? "Too soon" : `${result} ms`;

  return (
    <View style={gameStyles.card}>
      <View style={gameStyles.titleRow}>
        <View style={styles.icon}><Zap color="#F59E0B" fill="#FBBF24" size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={gameStyles.title}>Reaction Race</Text>
          <Text style={styles.caption}>Wait for green, then beat each other’s reflexes.</Text>
        </View>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [styles.arena, phase === "go" && styles.arenaGo, phase === "early" && styles.arenaEarly, pressed && styles.pressed]}>
        <Gauge color={phase === "go" ? "#fff" : "#CABFD0"} size={38} />
        <Text style={[styles.arenaText, phase === "go" && styles.arenaTextGo]}>{label}</Text>
        <Text style={[styles.hint, phase === "go" && styles.arenaTextGo]}>{phase === "waiting" ? "Don’t tap yet" : phase === "result" || phase === "early" ? "Tap to try again" : "One tap starts the round"}</Text>
      </Pressable>
      <View style={styles.bestRow}>
        <View style={styles.best}><Text style={styles.bestLabel}>YOUR BEST</Text><Text style={styles.bestValue}>{myBest ? `${myBest} ms` : "—"}</Text></View>
        <View style={styles.best}><Text style={styles.bestLabel}>{partnerName.toUpperCase()}</Text><Text style={styles.bestValue}>{partnerBest ? `${partnerBest} ms` : "—"}</Text></View>
      </View>
      {(phase === "result" || phase === "early") && <Pressable onPress={begin} style={gameStyles.resetBtn}><RotateCcw color={palette.violet} size={17} /><Text style={gameStyles.resetText}>Another round</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FFF7DF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  caption: { color: palette.muted, fontSize: 12, marginTop: 2 },
  arena: { height: 210, borderRadius: 24, backgroundColor: palette.inkSoft, alignItems: "center", justifyContent: "center", marginTop: 16 },
  arenaGo: { backgroundColor: palette.success },
  arenaEarly: { backgroundColor: "#7F1D2D" },
  pressed: { transform: [{ scale: 0.99 }] },
  arenaText: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 12 },
  arenaTextGo: { color: "#fff" },
  hint: { color: "#AFA4B6", fontSize: 12, marginTop: 7 },
  bestRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  best: { flex: 1, backgroundColor: "#F7F3F8", borderRadius: 15, padding: 12 },
  bestLabel: { color: palette.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  bestValue: { color: palette.text, fontSize: 18, fontWeight: "900", marginTop: 4 },
});
