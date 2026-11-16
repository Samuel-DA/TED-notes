// components/calls/CallView.tsx — an end-to-end encrypted audio/video call between the pair.
// Loaded lazily by app/call/[id].tsx so Stream's native code is only touched in real builds.
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { LockKeyhole, PhoneOff } from "lucide-react-native";
import {
  CallContent, CallingState, EncryptionManager, StreamCall, StreamVideo, callManager,
  useCallStateHooks, type Call, type StreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { db } from "@/firebase";
import { useApp } from "@/context/AppContext";
import { useE2EE } from "@/context/E2EEContext";
import { CALL_TYPE, RING_TIMEOUT_MS, getVideoClient, type CallKind, type CallRecord } from "@/services/calls";
import { ScreenBackground } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Phase = "connecting" | "ringing" | "live" | "ended" | "error";

export default function CallView() {
  const { id, kind: kindParam, role } = useLocalSearchParams<{ id: string; kind?: CallKind; role?: "caller" | "callee" }>();
  const router = useRouter();
  const { uid, pairId, partnerName } = useApp();
  const e2ee = useE2EE();
  const t = useTheme();
  const styles = useStyles();
  const kind: CallKind = kindParam === "video" ? "video" : "audio";
  const isCaller = role === "caller";
  const ref = pairId && id ? doc(db, "pairs", pairId, "calls", id) : null;

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [error, setError] = useState("");
  const finished = useRef(false);
  const answeredAt = useRef<number | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/chat"));

  // Join the Stream call with our own end-to-end key before any media is published.
  useEffect(() => {
    if (!uid || !id || !ref) return;
    let cancelled = false;
    let manager: EncryptionManager | null = null;
    let joined: Call | null = null;
    (async () => {
      try {
        const key = e2ee.callKey(id);
        if (!key) throw new Error("Private chat must be on for both of you before you can call.");
        if (!EncryptionManager.isSupported()) throw new Error("This device can't do encrypted calls. Update the app and try again.");
        const c = await getVideoClient(uid);
        if (cancelled) return;
        manager = await EncryptionManager.create(uid);
        manager.setSharedKey(0, key);
        const next = c.call(CALL_TYPE, id);
        next.setE2EEManager(manager);
        callManager.start({ audioRole: "communicator", deviceEndpointType: kind === "video" ? "speaker" : "earpiece" });
        if (kind === "audio") await next.camera.disable().catch(() => undefined);
        await next.join({ create: true });
        if (cancelled) { await next.leave().catch(() => undefined); return; }
        joined = next;
        setClient(c);
        setCall(next);
        if (!isCaller) {
          answeredAt.current = Date.now();
          await updateDoc(ref, { status: "accepted", answeredAt: serverTimestamp() }).catch(() => undefined);
        }
        setPhase(isCaller ? "ringing" : "live");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Couldn't start the call.");
        setPhase("error");
        if (isCaller) await updateDoc(ref, { status: "cancelled", endedAt: serverTimestamp() }).catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
      void joined?.leave().catch(() => undefined);
      manager?.dispose();
      callManager.stop();
    };
    // Run once per call id; the key and client are derived inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, id]);

  // Follow the shared record: partner accepted, declined or hung up.
  useEffect(() => {
    if (!ref) return;
    return onSnapshot(ref, (snap) => {
      const data = snap.data() as CallRecord | undefined;
      if (!data) return;
      if (data.status === "accepted") {
        if (!answeredAt.current) answeredAt.current = Date.now();
        setPhase((p) => (p === "ringing" ? "live" : p));
      }
      if (["declined", "missed", "ended", "cancelled"].includes(data.status) && !finished.current) {
        finished.current = true;
        setPhase("ended");
        setTimeout(close, data.status === "declined" ? 1400 : 600);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairId, id]);

  // Nobody answered.
  useEffect(() => {
    if (!isCaller || phase !== "ringing" || !ref) return;
    const timer = setTimeout(() => {
      void getDoc(ref).then((snap) => {
        if (snap.data()?.status === "ringing") void updateDoc(ref, { status: "missed", endedAt: serverTimestamp() });
      });
    }, RING_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isCaller]);

  const hangUp = async () => {
    if (ref && !finished.current) {
      finished.current = true;
      const wasLive = !!answeredAt.current;
      const durationSec = wasLive ? Math.round((Date.now() - (answeredAt.current ?? Date.now())) / 1000) : 0;
      await updateDoc(ref, { status: wasLive ? "ended" : "cancelled", endedAt: serverTimestamp(), durationSec }).catch(() => undefined);
    }
    await call?.leave().catch(() => undefined);
    close();
  };

  const name = partnerName || "your partner";

  if (phase === "error" || phase === "ended" || !client || !call) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.center}>
          <Avatar name={name} />
          <Text style={styles.title}>{phase === "error" ? "Call didn't connect" : phase === "ended" ? "Call ended" : `Calling ${name}…`}</Text>
          <Text style={styles.sub}>{phase === "error" ? error : "Setting up an end-to-end encrypted line"}</Text>
          {phase === "connecting" && <ActivityIndicator color={t.accent} style={{ marginTop: 18 }} />}
          <Pressable accessibilityLabel={phase === "error" ? "Close" : "Cancel call"} onPress={phase === "error" ? close : hangUp} style={styles.hangup}>
            <PhoneOff color="#fff" size={26} />
          </Pressable>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <View style={styles.live}>
          <LiveCall kind={kind} name={name} ringing={phase === "ringing"} onHangUp={hangUp} />
        </View>
      </StreamCall>
    </StreamVideo>
  );
}

function LiveCall({ kind, name, ringing, onHangUp }: { kind: CallKind; name: string; ringing: boolean; onHangUp: () => void }) {
  const { useCallCallingState, useRemoteParticipants } = useCallStateHooks();
  const state = useCallCallingState();
  const remote = useRemoteParticipants();
  const styles = useStyles();
  const [seconds, setSeconds] = useState(0);
  const connected = remote.length > 0 && !ringing;

  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [connected]);

  const status = state === CallingState.RECONNECTING ? "Reconnecting…" : ringing ? "Ringing…" : connected ? formatDuration(seconds) : `Waiting for ${name}…`;

  return (
    <>
      <CallContent onHangupCallHandler={onHangUp} layout={kind === "video" ? "spotlight" : "grid"} />
      <SafeAreaView edges={["top"]} style={styles.topBar} pointerEvents="none">
        <Text style={styles.topName}>{name}</Text>
        <View style={styles.lockRow}>
          <LockKeyhole color="#B7F5C8" size={11} />
          <Text style={styles.topStatus}>End-to-end encrypted · {status}</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

function Avatar({ name }: { name: string }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
      <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
    </LinearGradient>
  );
}

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const useStyles = makeStyles((t) => ({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  avatar: { width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center", ...t.shadowLg },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "800" },
  title: { color: t.text, fontSize: 24, fontWeight: "800", marginTop: 22, letterSpacing: -0.5, textAlign: "center" },
  sub: { color: t.textSecondary, fontSize: 14.5, marginTop: 8, textAlign: "center", lineHeight: 21 },
  hangup: { marginTop: 48, width: 68, height: 68, borderRadius: 34, backgroundColor: "#E5484D", alignItems: "center", justifyContent: "center" },
  live: { flex: 1, backgroundColor: "#0B0B10" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", paddingTop: 8 },
  topName: { color: "#fff", fontSize: 18, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  topStatus: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: "600" },
}));

