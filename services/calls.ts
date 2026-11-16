// services/calls.ts — Stream Video client, call records and helpers.
import type { StreamVideoClient } from "@stream-io/video-react-native-sdk";
import { NativeModules } from "react-native";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebase";
import { notifyPartner } from "@/services/notifications";

/** Stream call type configured with encryption mode "auto-on" in the Stream dashboard. */
export const CALL_TYPE = "e2ee";
export const RING_TIMEOUT_MS = 45_000;

/**
 * Calls need native WebRTC, which only exists in a real build (EAS / dev client), not Expo Go.
 * Stream is loaded lazily so the rest of the app still runs without it.
 */
export const callsAvailable = NativeModules.WebRTCModule != null;

export type CallKind = "audio" | "video";
export type CallStatus = "ringing" | "accepted" | "declined" | "missed" | "ended" | "cancelled";
export type CallRecord = { id: string; callerId: string; calleeId: string; kind: CallKind; status: CallStatus; createdAt?: { toMillis: () => number }; durationSec?: number };

type TokenResponse = { apiKey: string; token: string; userId: string; name: string };
const fetchToken = () => httpsCallable<void, TokenResponse>(functions, "streamToken")().then((r) => r.data);

let current: { uid: string; client: Promise<StreamVideoClient> } | null = null;

/** One Stream client per signed-in user; tokens come from the `streamToken` Cloud Function. */
export function getVideoClient(uid: string): Promise<StreamVideoClient> {
  if (current?.uid === uid) return current.client;
  const client = fetchToken().then(({ apiKey, token, name }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { StreamVideoClient: Client } = require("@stream-io/video-react-native-sdk") as typeof import("@stream-io/video-react-native-sdk");
    return Client.getOrCreateInstance({
      apiKey,
      user: { id: uid, name },
      token,
      tokenProvider: async () => (await fetchToken()).token,
    });
  });
  client.catch(() => { if (current?.uid === uid) current = null; });
  current = { uid, client };
  return client;
}

export async function disconnectVideoClient() {
  const existing = current;
  current = null;
  if (existing) await (await existing.client.catch(() => null))?.disconnectUser().catch(() => undefined);
}

/** Create the ringing record and notify the partner. Returns the call id. */
export async function startCall({ pairId, uid, partnerUid, myName, kind }: { pairId: string; uid: string; partnerUid: string; myName: string; kind: CallKind }) {
  const ref = doc(collection(db, "pairs", pairId, "calls"));
  await setDoc(ref, { callerId: uid, calleeId: partnerUid, kind, status: "ringing", createdAt: serverTimestamp() });
  void notifyPartner({ pairId, currentUid: uid, route: "chat", action: "incoming_call", title: `${myName} is calling ${kind === "video" ? "📹" : "📞"}`, body: "Open TED Space to answer." });
  return ref.id;
}
