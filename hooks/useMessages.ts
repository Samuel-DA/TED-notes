import { db } from "@/firebase";
import { Message } from "@/types/chat";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useMessages(pairId?: string, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!pairId) return;

    const ref = collection(db, "pairs", pairId, "messages");
    const q = query(ref, orderBy("createdAt", "asc"));

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

  // Mark unread messages as read (only partner messages)
  useEffect(() => {
    if (!pairId || !userId) return;

    messages.forEach((m) => {
      if (
        m.senderId !== userId &&
        !m.readBy?.includes(userId)
      ) {
        updateDoc(
          doc(db, "pairs", pairId, "messages", m.id),
          {
            readBy: arrayUnion(userId),
          }
        );
      }
    });
  }, [messages, pairId, userId]);

  return { messages, unreadCount };
}