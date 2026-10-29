import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";
import { palette } from "@/constants/design";

const SCOREBOARD_ID = "global";

interface ScoreboardData {
  [uid: string]: number | undefined;
  updatedAt?: number;
}

export default function Scoreboard({ pairId }: { pairId: string | null }) {
  const { uid, myName, partnerName } = useApp();

  const [scoreboard, setScoreboard] = useState<ScoreboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const scoreboardRef = pairId
    ? doc(db, "pairs", pairId, "scoreboard", SCOREBOARD_ID)
    : null;

  /* ---------------- Ensure scoreboard exists ---------------- */
  useEffect(() => {
    if (!scoreboardRef || !uid) return;

    (async () => {
      const snap = await getDoc(scoreboardRef);
      if (!snap.exists()) {
        await setDoc(scoreboardRef, {
          [uid]: 0,
          updatedAt: Date.now(),
        });
      }
    })();
  }, [scoreboardRef, uid]);

  /* ---------------- Listen to scoreboard ---------------- */
  useEffect(() => {
    if (!scoreboardRef || !uid) return;

    const unsub = onSnapshot(scoreboardRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data() as ScoreboardData;

      // Ensure current user always exists
      if (data[uid] === undefined) {
        await setDoc(
          scoreboardRef,
          { [uid]: 0, updatedAt: Date.now() },
          { merge: true },
        );
      }

      setScoreboard(data);
      setLoading(false);
    });

    return unsub;
  }, [scoreboardRef, uid]);

  /* ---------------- Derived players ---------------- */
  const players = useMemo(() => {
    if (!scoreboard || !uid) return [];

    const uids = Object.keys(scoreboard).filter(
      (k) => k !== "updatedAt",
    );

    // Ensure exactly two players max
    const uniqueUids = Array.from(new Set(uids)).slice(0, 2);

    return uniqueUids.map((playerUid) => ({
      uid: playerUid,
      score:
        typeof scoreboard[playerUid] === "number"
          ? scoreboard[playerUid]!
          : 0,
      isMe: playerUid === uid,
    }));
  }, [scoreboard, uid]);

  const maxScore =
    players.length > 0
      ? Math.max(...players.map((p) => p.score))
      : 0;

  const leaders = players.filter(
    (p) => p.score === maxScore && maxScore > 0,
  );

  const leaderMessage =
    maxScore === 0
      ? "No one is leading yet"
      : leaders.length > 1
        ? "🤝 It's a tie!"
        : leaders[0].isMe
          ? `🎉 You (${myName || "You"}) are leading`
          : `🏅 ${partnerName} is leading`;

  /* ---------------- Reset ---------------- */
  const resetScores = async () => {
    if (!scoreboardRef || !players.length || !uid) return;
    const currentUid = uid;

    Alert.alert(
      "Reset My Score",
      `Are you sure you want to reset your score? ${partnerName}'s score will stay unchanged.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await setDoc(
              scoreboardRef,
              { [currentUid]: 0, updatedAt: Date.now() },
              { merge: true },
            );
          },
        },
      ],
    );
  };

  /* ---------------- Loading ---------------- */
  if (!pairId || !uid || loading || !scoreboard) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={palette.rose} />
        <Text style={styles.loadingText}>Loading scoreboard…</Text>
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>COUPLE LEAGUE</Text>
      <Text style={styles.title}>🏆 Scoreboard</Text>

      <View style={styles.card}>
        {players.map((p) => (
          <View key={p.uid} style={styles.row}>
            <Text style={styles.player}>
              {p.isMe
                ? `You (${myName || "You"})`
                : partnerName}
            </Text>
            <Text style={styles.score}>{p.score}</Text>
          </View>
        ))}
      </View>

      <Text
        style={[
          styles.leader,
          maxScore === 0 && { color: "#6b7280" },
        ]}
      >
        {leaderMessage}
      </Text>

      <TouchableOpacity style={styles.resetBtn} onPress={resetScores}>
        <Text style={styles.resetText}>Reset My Score</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 14,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  player: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.text,
  },
  score: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.rose,
  },
  leader: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
  },
  resetBtn: {
    marginTop: 28,
    backgroundColor: palette.rose,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  resetText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#D8C9DF",
    fontWeight: "600",
  },
  kicker: { color: "#F9A8D4", fontSize: 10, fontWeight: "900", letterSpacing: 1.6, textAlign: "center", marginBottom: 4 },
});
