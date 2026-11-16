// hooks/useTyping.ts — "is typing…" presence for the pair chat.
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/firebase";

const IDLE_MS = 3500;
const REFRESH_MS = 4000;
const STALE_MS = 9000;

export function useTyping(pairId?: string | null, uid?: string | null, partnerUid?: string | null) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const lastSent = useRef(0);
  const typingNow = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Partner's typing state (ignored if stale, e.g. their app was killed mid-sentence).
  useEffect(() => {
    if (!pairId || !partnerUid) return;
    let staleTimer: ReturnType<typeof setTimeout> | undefined;
    const unsub = onSnapshot(doc(db, "pairs", pairId, "typing", partnerUid), (snap) => {
      if (staleTimer) clearTimeout(staleTimer);
      const data = snap.data() as { typing?: boolean; updatedAt?: Timestamp } | undefined;
      const fresh = !!data?.typing && (!data.updatedAt || Date.now() - data.updatedAt.toMillis() < STALE_MS);
      setPartnerTyping(fresh);
      if (fresh) staleTimer = setTimeout(() => setPartnerTyping(false), STALE_MS);
    }, () => setPartnerTyping(false));
    return () => { unsub(); if (staleTimer) clearTimeout(staleTimer); };
  }, [pairId, partnerUid]);

  const write = useCallback((typing: boolean) => {
    if (!pairId || !uid) return;
    typingNow.current = typing;
    lastSent.current = Date.now();
    void setDoc(doc(db, "pairs", pairId, "typing", uid), { typing, updatedAt: serverTimestamp() }).catch(() => undefined);
  }, [pairId, uid]);

  /** Call on every keystroke. Writes are throttled. */
  const onType = useCallback((text: string) => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!text.trim()) { if (typingNow.current) write(false); return; }
    if (!typingNow.current || Date.now() - lastSent.current > REFRESH_MS) write(true);
    idleTimer.current = setTimeout(() => write(false), IDLE_MS);
  }, [write]);

  const stop = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (typingNow.current) write(false);
  }, [write]);

  // Clear our flag when leaving the chat.
  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (pairId && uid && typingNow.current) void deleteDoc(doc(db, "pairs", pairId, "typing", uid)).catch(() => undefined);
  }, [pairId, uid]);

  return { partnerTyping, onType, stop };
}
