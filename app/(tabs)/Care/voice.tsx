import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { fetch as expoFetch } from "expo/fetch";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { deleteObject, getBytes, ref } from "firebase/storage";
import { File, Paths } from "expo-file-system";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CarePage } from "@/components/care/CareUI";
import { Card, EmptyState, SectionHeader } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { auth, db, storage } from "@/firebase";
import { notifyPartner } from "@/services/notifications";

const MAX_RECORDING_MS = 60_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const RETENTION_DAYS = 90;

type Capsule = { id: string; storagePath: string; senderId: string; senderName: string; durationMs: number; expiresAt?: Timestamp };
const WAVE = [7, 14, 9, 19, 12, 17, 8, 14, 10, 18, 7, 13, 16, 9, 12, 6, 15, 11];

function CapsuleItem({ item, uid, pairId, index }: { item: Capsule; uid: string; pairId: string; index: number }) {
  const t = useTheme();
  const styles = useStyles();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const player = useAudioPlayer(localUri);
  const status = useAudioPlayerStatus(player);
  useEffect(() => {
    let active = true;
    getBytes(ref(storage, item.storagePath), 10 * 1024 * 1024).then((buffer) => {
      const file = new File(Paths.cache, `ted-capsule-${item.id}.m4a`);
      if (!file.exists) file.create();
      file.write(new Uint8Array(buffer));
      if (active) setLocalUri(file.uri);
    }).catch(console.warn);
    return () => { active = false; };
  }, [item.id, item.storagePath]);

  const mine = item.senderId === uid;
  const progress = status.duration ? Math.min(1, status.currentTime / status.duration) : 0;
  const toggle = () => {
    if (status.playing) { player.pause(); return; }
    if (status.duration && status.currentTime >= status.duration - 0.05) player.seekTo(0);
    player.play();
  };
  const remove = () => Alert.alert("Delete voice note?", "This permanently removes the recording for both of you.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => { await deleteObject(ref(storage, item.storagePath)).catch(() => undefined); await deleteDoc(doc(db, "pairs", pairId, "voiceCapsules", item.id)); } },
  ]);

  return (
    <View style={[styles.item, index > 0 && styles.itemBorder]}>
      <Pressable accessibilityLabel={status.playing ? "Pause" : "Play"} disabled={!localUri} onPress={toggle} style={[styles.play, !localUri && { opacity: 0.5 }]}>
        <LinearGradient colors={mine ? [t.violet, t.plum] : t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {!localUri ? <ActivityIndicator color="#fff" size="small" /> : status.playing ? <Pause color="#fff" fill="#fff" size={16} /> : <Play color="#fff" fill="#fff" size={16} />}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{mine ? "You" : item.senderName}</Text>
        <View style={styles.wave}>
          {WAVE.map((height, i) => <View key={i} style={[styles.bar, { height }, i / WAVE.length < progress && { backgroundColor: mine ? t.violet : t.accent }]} />)}
        </View>
        <Text style={styles.meta}>{Math.max(1, Math.round(item.durationMs / 1000))}s</Text>
      </View>
      {mine && <Pressable accessibilityLabel="Delete recording" hitSlop={8} onPress={remove} style={styles.delete}><Trash2 color={t.textMuted} size={15} /></Pressable>}
    </View>
  );
}

export default function VoicePage() {
  const t = useTheme();
  const styles = useStyles();
  const pulse = useRef(new Animated.Value(0)).current;
  const { pairId, uid, myName, partnerName } = useApp(); const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY); const state = useAudioRecorderState(recorder); const [capsules, setCapsules] = useState<Capsule[]>([]); const [busy, setBusy] = useState(false); const stoppingRef = useRef(false);
  useEffect(() => {
    if (!pairId) return;
    return onSnapshot(query(collection(db, "pairs", pairId, "voiceCapsules"), orderBy("createdAt", "desc"), limit(40)), (snap) => {
      const now = Date.now();
      const all = snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Capsule);
      setCapsules(all.filter((item) => !item.expiresAt || item.expiresAt.toMillis() > now).slice(0, 20));

      // Remove this user's expired files when the library opens. A bucket-level
      // lifecycle policy will provide the final backstop once Storage is enabled.
      all.filter((item) => item.senderId === uid && item.expiresAt && item.expiresAt.toMillis() <= now).forEach((item) => {
        deleteObject(ref(storage, item.storagePath))
          .catch(() => undefined)
          .finally(() => deleteDoc(doc(db, "pairs", pairId, "voiceCapsules", item.id)).catch(console.warn));
      });
    });
  }, [pairId, uid]);

  const stopAndSend = useCallback(async () => {
    if (!pairId || !uid || busy || stoppingRef.current || !state.isRecording) return;
    stoppingRef.current = true;
    const durationMs = Math.max(1, Math.min(state.durationMillis, MAX_RECORDING_MS)); setBusy(true);
    try {
      await recorder.stop(); await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); const uri = recorder.uri; if (!uri) throw new Error("The recording was not saved.");
      const capsuleRef = doc(collection(db, "pairs", pairId, "voiceCapsules")); const storagePath = `pairs/${pairId}/voiceCapsules/${uid}/${capsuleRef.id}.m4a`; const recordedFile = new File(uri);
      if (recordedFile.size > MAX_FILE_BYTES) throw new Error("This recording is larger than 10 MB. Please record a shorter message.");
      const audioBytes = await recordedFile.bytes();
      const currentUser = auth.currentUser;
      const bucket = storage.app.options.storageBucket;
      if (!currentUser) throw new Error("Your session has expired. Sign in again and retry.");
      if (!bucket) throw new Error("The Firebase Storage bucket is not configured.");

      // Firebase's web uploader uses React Native's legacy XMLHttpRequest Blob
      // implementation, which loses the server response on Expo. Build the same
      // Firebase multipart request with Expo Blob and send it through Expo Fetch.
      const boundary = `ted-space-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const metadata = JSON.stringify({ name: storagePath, contentType: "audio/mp4" });
      const encoder = new TextEncoder();
      const head = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: audio/mp4\r\n\r\n`);
      const tail = encoder.encode(`\r\n--${boundary}--`);
      const uploadBody = new Uint8Array(head.length + audioBytes.length + tail.length);
      uploadBody.set(head, 0);
      uploadBody.set(audioBytes, head.length);
      uploadBody.set(tail, head.length + audioBytes.length);
      const token = await currentUser.getIdToken();
      const uploadResponse = await expoFetch(
        `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent(storagePath)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Firebase ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "X-Firebase-GMPID": storage.app.options.appId || "",
            "X-Goog-Upload-Protocol": "multipart",
          },
          body: uploadBody as unknown as BodyInit,
        },
      );
      const uploadPayload = await uploadResponse.text();
      if (!uploadResponse.ok) throw new Error(`Firebase Storage rejected the upload (${uploadResponse.status}): ${uploadPayload || "No response body"}`);
      await setDoc(capsuleRef, { storagePath, senderId: uid, senderName: myName || "Partner", durationMs, createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000) }); await notifyPartner({ pairId, currentUid: uid, route: "care_voice", action: "voice_capsule", title: "A voice comfort capsule is waiting 🎙️", body: `${myName || "Your partner"} recorded something for you.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      Alert.alert("Couldn’t send recording", code ? `${message}\n\nError: ${code}` : message);
    }
    finally { setBusy(false); stoppingRef.current = false; }
  }, [busy, myName, pairId, recorder, state.durationMillis, state.isRecording, uid]);

  useEffect(() => {
    if (state.isRecording && state.durationMillis >= MAX_RECORDING_MS) void stopAndSend();
  }, [state.durationMillis, state.isRecording, stopAndSend]);

  const toggle = async () => {
    if (!pairId || !uid || busy) return;
    if (state.isRecording) {
      await stopAndSend();
      return;
    }
    const permission = await requestRecordingPermissionsAsync(); if (!permission.granted) return Alert.alert("Microphone permission needed", "Allow microphone access to record a comfort capsule."); await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); await recorder.prepareToRecordAsync(); recorder.record();
  };
  useEffect(() => {
    if (!state.isRecording) { pulse.stopAnimation(); pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse, state.isRecording]);

  const seconds = Math.floor(state.durationMillis / 1000);
  const remaining = Math.max(0, 60 - seconds);

  return (
    <CarePage eyebrow="VOICE COMFORT" title="A message they can keep" subtitle={`Leave ${partnerName || "them"} a reassuring voice note for harder moments.`} icon={<Mic color="#fff" size={23} />}>
      <Card variant="hero" style={styles.recorder}>
        <View style={styles.rings}>
          <Animated.View pointerEvents="none" style={[styles.pulse, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }] }]} />
          <Pressable accessibilityRole="button" accessibilityLabel={state.isRecording ? "Stop and send" : "Start recording"} onPress={toggle} disabled={busy} style={({ pressed }) => [styles.recordCircle, pressed && { transform: [{ scale: 0.94 }] }]}>
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {busy ? <ActivityIndicator color="#fff" /> : state.isRecording ? <Square color="#fff" fill="#fff" size={26} /> : <Mic color="#fff" size={34} />}
          </Pressable>
        </View>
        <Text style={styles.timer}>{state.isRecording ? `0:${String(seconds).padStart(2, "0")}` : busy ? "Sending…" : "Tap to record"}</Text>
        <Text style={styles.hint}>{state.isRecording ? `Tap again to send · ${remaining}s left` : "Up to 60 seconds. They can replay it whenever they need you."}</Text>
        {state.isRecording && <View style={styles.limitTrack}><View style={[styles.limitFill, { width: `${(seconds / 60) * 100}%` }]} /></View>}
      </Card>

      <SectionHeader title={capsules.length ? `Comfort library · ${capsules.length}` : "Comfort library"} />
      {capsules.length ? (
        <Card padded={false} style={{ borderRadius: 22 }}>
          {capsules.map((item, index) => <CapsuleItem key={item.id} item={item} uid={uid || ""} pairId={pairId || ""} index={index} />)}
        </Card>
      ) : (
        <EmptyState icon={Mic} title="No voice notes yet" body="A few sincere words can mean a lot on a difficult day." />
      )}
      <Text style={styles.privacy}>Only you two can hear these · max 10 MB · removed after 90 days</Text>
    </CarePage>
  );
}

const useStyles = makeStyles((t) => ({
  recorder: { padding: 24, alignItems: "center", borderRadius: 28 },
  rings: { width: 132, height: 132, alignItems: "center", justifyContent: "center" },
  pulse: { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: t.accent },
  recordCircle: { width: 96, height: 96, borderRadius: 48, overflow: "hidden", alignItems: "center", justifyContent: "center", ...t.shadowLg },
  timer: { color: t.text, fontSize: 26, fontWeight: "800", marginTop: 10, letterSpacing: -0.5, fontVariant: ["tabular-nums"] },
  hint: { color: t.textSecondary, fontSize: 13.5, lineHeight: 19, textAlign: "center", maxWidth: 290, marginTop: 4 },
  limitTrack: { alignSelf: "stretch", height: 4, borderRadius: 2, backgroundColor: t.surfaceSunken, marginTop: 16, overflow: "hidden" },
  limitFill: { height: 4, borderRadius: 2, backgroundColor: t.accent },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  itemBorder: { borderTopWidth: 1, borderTopColor: t.border },
  play: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  name: { color: t.text, fontSize: 14.5, fontWeight: "700" },
  wave: { height: 22, flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  bar: { width: 3, borderRadius: 2, backgroundColor: t.borderStrong },
  meta: { color: t.textMuted, fontSize: 11.5, marginTop: 2 },
  delete: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  privacy: { color: t.textMuted, fontSize: 11.5, textAlign: "center", marginTop: 14 },
}));
