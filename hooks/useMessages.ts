import { db } from "@/firebase";
import { Message } from "@/types/chat";
import { collection, limitToLast, onSnapshot, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";

const PAGE = 60;

/** Live chat messages, newest last. Call `loadEarlier` to extend the window further back. */
export function useMessages(pairId?: string, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [windowSize, setWindowSize] = useState(PAGE);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(false);
  const { resumeKey } = useApp();

  useEffect(() => {
    if (!pairId) return;
    const q = query(collection(db, "pairs", pairId, "messages"), orderBy("createdAt", "asc"), limitToLast(windowSize));
    return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      const msgs: Message[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }));
      setMessages(msgs);
      setHasEarlier(snap.size >= windowSize);
      setLoadingEarlier(false);
      if (userId) setUnreadCount(msgs.filter((m) => m.senderId !== userId && !(m.readBy?.includes(userId) ?? false)).length);
    }, (error) => { console.error("Live chat listener failed:", error); setLoadingEarlier(false); });
  }, [pairId, userId, resumeKey, windowSize]);

  const loadEarlier = useCallback(() => {
    if (!hasEarlier || loadingEarlier) return;
    setLoadingEarlier(true);
    setWindowSize((n) => n + PAGE);
  }, [hasEarlier, loadingEarlier]);

  return { messages, unreadCount, loadEarlier, hasEarlier, loadingEarlier };
}
