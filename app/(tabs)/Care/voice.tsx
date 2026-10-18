import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { fetch as expoFetch } from "expo/fetch";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { deleteObject, getBytes, ref } from "firebase/storage";
import { File, Paths } from "expo-file-system";
import { Blob as ExpoBlob } from "expo-blob";
import { Mic, Pause, Play, Square, Trash2, Waves } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { CareCard, CarePage } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { auth, db, storage } from "@/firebase";
import { notifyPartner } from "@/services/notifications";

const MAX_RECORDING_MS = 60_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const RETENTION_DAYS = 90;

type Capsule = { id: string; storagePath: string; senderId: string; senderName: string; durationMs: number; expiresAt?: Timestamp };
function CapsuleItem({ item, uid, pairId }: { item: Capsule; uid: string; pairId: string }) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const player = useAudioPlayer(localUri); const status = useAudioPlayerStatus(player);
  useEffect(() => { let active = true; getBytes(ref(storage, item.storagePath), 10 * 1024 * 1024).then((buffer) => { const file = new File(Paths.cache, `ted-capsule-${item.id}.m4a`); if (!file.exists) file.create(); file.write(new Uint8Array(buffer)); if (active) setLocalUri(file.uri); }).catch(console.warn); return () => { active = false; }; }, [item.id, item.storagePath]);
  const remove = () => Alert.alert("Delete voice capsule?", "This permanently removes the recording for both of you.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { await deleteObject(ref(storage, item.storagePath)); await deleteDoc(doc(db, "pairs", pairId, "voiceCapsules", item.id)); } }]);
  return <View style={styles.item}><Pressable disabled={!localUri} onPress={() => status.playing ? player.pause() : player.play()} style={[styles.play, !localUri && { opacity: 0.45 }]}>{!localUri ? <ActivityIndicator color="#fff" size="small" /> : status.playing ? <Pause color="#fff" size={17} /> : <Play color="#fff" fill="#fff" size={17} />}</Pressable><View style={{ flex: 1 }}><Text style={styles.name}>{item.senderName}</Text><View style={styles.wave}>{[7, 14, 9, 19, 12, 17, 8, 14, 10, 18, 7, 13].map((height, index) => <View key={index} style={[styles.bar, { height }]} />)}</View><Text style={styles.meta}>{Math.max(1, Math.round(item.durationMs / 1000))} seconds</Text></View>{item.senderId === uid && <Pressable accessibilityLabel="Delete recording" onPress={remove} style={styles.delete}><Trash2 color="#B97A8C" size={16} /></Pressable>}</View>;
}

export default function VoicePage() {
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
      const uploadBody = new ExpoBlob([
        `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: audio/mp4\r\n\r\n`,
        audioBytes,
        `\r\n--${boundary}--`,
      ], { type: `multipart/related; boundary=${boundary}` });
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
  return <CarePage eyebrow="VOICE COMFORT" title="A message they can keep" subtitle={`Leave ${partnerName || "your partner"} a reassuring voice note for difficult moments.`} icon={<Mic color="#fff" size={23} />}>
    <View style={styles.recorder}><View style={styles.rings}><View style={[styles.recordCircle, state.isRecording && styles.recording]}>{state.isRecording ? <Waves color="#fff" size={31} /> : <Mic color="#fff" size={31} />}</View></View><Text style={styles.timer}>{state.isRecording ? `${Math.floor(state.durationMillis / 60000)}:${String(Math.floor(state.durationMillis / 1000) % 60).padStart(2, "0")}` : "Ready when you are"}</Text><Text style={styles.hint}>{state.isRecording ? "Recording sends automatically at 60 seconds." : "Record a short message they can replay whenever they need you."}</Text><Pressable onPress={toggle} disabled={busy} style={[styles.recordButton, state.isRecording && styles.stopButton]}>{busy ? <ActivityIndicator color="#fff" /> : state.isRecording ? <Square color="#fff" fill="#fff" size={18} /> : <Mic color="#fff" size={20} />}<Text style={styles.recordText}>{busy ? "Securing & sending…" : state.isRecording ? "Stop and send" : "Start recording"}</Text></Pressable><Text style={styles.privacy}>Pair-only storage · Maximum 60 seconds and 10 MB · Removed after 90 days</Text></View>
    <CareCard title="Your comfort library" subtitle={capsules.length ? `${capsules.length} private recording${capsules.length === 1 ? "" : "s"}` : "Your recordings will appear here"}>{capsules.length ? capsules.map((item) => <CapsuleItem key={item.id} item={item} uid={uid || ""} pairId={pairId || ""} />) : <Text style={styles.empty}>No voice capsules yet. A few sincere words can mean a lot on a difficult day.</Text>}</CareCard>
  </CarePage>;
}

const styles = StyleSheet.create({ recorder: { backgroundColor: "rgba(33,23,42,0.72)", borderRadius: 28, padding: 22, alignItems: "center", marginBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }, rings: { width: 116, height: 116, borderRadius: 58, backgroundColor: "rgba(232,93,117,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 10, borderColor: "rgba(232,93,117,0.08)" }, recordCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }, recording: { backgroundColor: "#C23D58" }, timer: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 15 }, hint: { color: "#CDBFD3", fontSize: 11.5, lineHeight: 17, textAlign: "center", maxWidth: 280, marginTop: 5 }, recordButton: { minHeight: 50, minWidth: 210, paddingHorizontal: 20, borderRadius: 17, backgroundColor: palette.rose, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 17 }, stopButton: { backgroundColor: "#A92F49" }, recordText: { color: "#fff", fontWeight: "900", fontSize: 13 }, privacy: { color: "#CDBFD3", fontSize: 9.5, textAlign: "center", marginTop: 12 }, item: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#F0EAF1" }, play: { width: 43, height: 43, borderRadius: 22, backgroundColor: palette.plum, alignItems: "center", justifyContent: "center" }, name: { color: palette.text, fontSize: 13, fontWeight: "900" }, wave: { height: 20, flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 }, bar: { width: 3, borderRadius: 2, backgroundColor: "#CDA8C8" }, meta: { color: palette.muted, fontSize: 9.5 }, delete: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#FBF2F5", alignItems: "center", justifyContent: "center" }, empty: { color: palette.muted, fontSize: 12, lineHeight: 19, textAlign: "center", paddingVertical: 20 }, });
