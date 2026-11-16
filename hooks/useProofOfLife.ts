// hooks/useProofOfLife.ts — today's "outfit of the day" posts for both partners.
import { deleteDoc, deleteField, doc, onSnapshot, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { db, storage } from "@/firebase";
import { pickMedia, primeCache, uploadFile } from "@/services/media";
import { notifyPartner } from "@/services/notifications";

export type ProofPost = {
  id: string;
  ownerUid: string;
  date: string;
  storagePath: string;
  caption: string;
  width: number;
  height: number;
  createdAt?: Timestamp;
  reaction?: string;
};

export function useProofOfLife(partnerUid: string | null) {
  const { pairId, uid, myName, today, resumeKey } = useApp();
  const [mine, setMine] = useState<ProofPost | null>(null);
  const [theirs, setTheirs] = useState<ProofPost | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pairId || !uid) return;
    const listen = (owner: string, set: (p: ProofPost | null) => void) =>
      onSnapshot(doc(db, "pairs", pairId, "proofOfLife", `${today}_${owner}`), (snap) => set(snap.exists() ? ({ id: snap.id, ...snap.data() } as ProofPost) : null), () => set(null));
    const unsubs = [listen(uid, setMine), ...(partnerUid ? [listen(partnerUid, setTheirs)] : [])];
    return () => unsubs.forEach((u) => u());
  }, [pairId, uid, partnerUid, today, resumeKey]);

  /** Take or choose today's photo. Replaces an existing post for today. */
  const post = async (source: "camera" | "library", caption = "") => {
    if (!pairId || !uid) return false;
    const picked = await pickMedia(source, { allowVideo: false });
    if (!picked) return false;
    setBusy(true);
    try {
      const path = `pairs/${pairId}/proofOfLife/${uid}/${today}-${Date.now().toString(36)}.${picked.ext}`;
      await uploadFile(path, picked.uri, picked.mimeType);
      primeCache(path, picked.uri);
      const postRef = doc(db, "pairs", pairId, "proofOfLife", `${today}_${uid}`);
      const previous = mine?.storagePath;
      const data = { storagePath: path, caption: caption.trim().slice(0, 140), width: picked.width, height: picked.height, createdAt: serverTimestamp() };
      if (mine) await updateDoc(postRef, data);
      else await setDoc(postRef, { ownerUid: uid, date: today, ...data });
      if (previous && previous !== path) void deleteObject(ref(storage, previous)).catch(() => undefined);
      if (!mine) void notifyPartner({ pairId, currentUid: uid, route: "home", action: "outfit_posted", title: `${myName || "Your partner"} posted today's outfit 📸`, body: "Open TED Space to see it and react." });
      return true;
    } finally { setBusy(false); }
  };

  const updateCaption = async (caption: string) => {
    if (!pairId || !uid || !mine) return;
    await updateDoc(doc(db, "pairs", pairId, "proofOfLife", mine.id), { caption: caption.trim().slice(0, 140) });
  };

  const react = async (emoji: string) => {
    if (!pairId || !uid || !theirs) return;
    const removing = theirs.reaction === emoji;
    await updateDoc(doc(db, "pairs", pairId, "proofOfLife", theirs.id), { reaction: removing ? deleteField() : emoji });
    if (!removing) void notifyPartner({ pairId, currentUid: uid, route: "home", action: "outfit_reaction", title: `${myName || "Your partner"} reacted ${emoji} to your outfit`, body: "They saw today's photo." });
  };

  const remove = async () => {
    if (!pairId || !mine) return;
    await deleteDoc(doc(db, "pairs", pairId, "proofOfLife", mine.id));
    void deleteObject(ref(storage, mine.storagePath)).catch(() => undefined);
  };

  return { mine, theirs, busy, post, updateCaption, react, remove };
}
