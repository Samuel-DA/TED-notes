// components/calls/IncomingCallWatcher.tsx — full-screen ring when the partner calls.
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View, Vibration } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { LockKeyhole, Phone, PhoneOff, Video } from "lucide-react-native";
import { db } from "@/firebase";
import { useApp } from "@/context/AppContext";
import { RING_TIMEOUT_MS, callsAvailable, type CallRecord } from "@/services/calls";
import { makeStyles, useTheme } from "@/hooks/useTheme";

const isFresh = (c: CallRecord) => {
  const at = c.createdAt?.toMillis?.();
  return at == null || Date.now() - at < RING_TIMEOUT_MS + 15_000;
};

export default function IncomingCallWatcher() {
  const { uid, pairId, partnerName, isLocked } = useApp();
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const [incoming, setIncoming] = useState<CallRecord | null>(null);

  useEffect(() => {
    if (!uid || !pairId || !callsAvailable) return;
    const q = query(
      collection(db, "pairs", pairId, "calls"),
      where("calleeId", "==", uid),
      where("status", "==", "ringing"),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    return onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CallRecord, "id">) })).find(isFresh) ?? null;
      setIncoming(next);
    }, () => setIncoming(null));
  }, [uid, pairId]);

  useEffect(() => {
    if (!incoming) return;
    Vibration.vibrate([0, 700, 900], true);
    return () => Vibration.cancel();
  }, [incoming]);

  if (!incoming || !pairId) return null;
  const name = partnerName || "Your partner";
  const ref = doc(db, "pairs", pairId, "calls", incoming.id);

  const decline = () => {
    setIncoming(null);
    void updateDoc(ref, { status: "declined", endedAt: serverTimestamp() }).catch(() => undefined);
  };
  const accept = () => {
    const call = incoming;
    setIncoming(null);
    router.push({ pathname: "/call/[id]", params: { id: call.id, kind: call.kind, role: "callee" } });
  };

  return (
    <Modal visible={!isLocked} animationType="fade" transparent={false} onRequestClose={decline}>
      <LinearGradient colors={[t.bgSolid, t.bgSolid]} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.top}>
            <View style={styles.lockRow}><LockKeyhole color={t.successText} size={12} /><Text style={styles.lockText}>End-to-end encrypted</Text></View>
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
            </LinearGradient>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.kind}>Incoming {incoming.kind === "video" ? "video" : "voice"} call…</Text>
          </View>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Pressable accessibilityLabel="Decline" onPress={decline} style={({ pressed }) => [styles.round, { backgroundColor: "#E5484D" }, pressed && styles.pressed]}>
                <PhoneOff color="#fff" size={28} />
              </Pressable>
              <Text style={styles.actionText}>Decline</Text>
            </View>
            <View style={styles.action}>
              <Pressable accessibilityLabel="Accept" onPress={accept} style={({ pressed }) => [styles.round, { backgroundColor: "#30A46C" }, pressed && styles.pressed]}>
                {incoming.kind === "video" ? <Video color="#fff" size={28} /> : <Phone color="#fff" size={28} />}
              </Pressable>
              <Text style={styles.actionText}>Accept</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  safe: { flex: 1, justifyContent: "space-between", paddingVertical: 40 },
  top: { alignItems: "center", paddingTop: 40 },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 36 },
  lockText: { color: t.successText, fontSize: 12.5, fontWeight: "700" },
  avatar: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", ...t.shadowLg },
  avatarText: { color: "#fff", fontSize: 46, fontWeight: "800" },
  name: { color: t.text, fontSize: 30, fontWeight: "800", marginTop: 24, letterSpacing: -0.7 },
  kind: { color: t.textSecondary, fontSize: 15, marginTop: 6 },
  actions: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 40 },
  action: { alignItems: "center", gap: 10 },
  round: { width: 74, height: 74, borderRadius: 37, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: 0.94 }] },
  actionText: { color: t.text, fontSize: 14, fontWeight: "700" },
}));
