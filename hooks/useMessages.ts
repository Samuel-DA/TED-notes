import { db } from "@/firebase";
import { Message } from "@/types/chat";
import {
  collection,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useMessages(pairId?: string, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!pairId) return;

    const ref = collection(db, "pairs", pairId, "messages");
    const q = query(ref, orderBy("createdAt", "asc"), limitToLast(100));

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Message, "id">),
      }));

      setMessages(msgs);

      if (userId) {
        const unread = msgs.filter(
          (m) =>
            m.senderId !== userId &&
            !(m.readBy?.includes(userId) ?? false)
        ).length;

        setUnreadCount(unread);
      }
    });

    return unsub;
  }, [pairId, userId]);

  return { messages, unreadCount };
}
