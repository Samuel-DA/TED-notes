import { db } from "@/firebase";
import {
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

export type InAppNotification = {
  id: string;
  actorUid: string;
  title: string;
  body: string;
  route: string;
  action: string;
  createdAt?: Timestamp;
  readBy?: string[];
  clearedBy?: string[];
};

export function useNotificationCenter(pairId: string | null, uid: string | null) {
  const [items, setItems] = useState<InAppNotification[]>([]);

  useEffect(() => {
    if (!pairId || !uid) {
      setItems([]);
      return;
    }
    const events = query(
      collection(db, "pairs", pairId, "notificationEvents"),
      orderBy("createdAt", "desc"),
      limit(60),
    );
    return onSnapshot(events, (snapshot) => {
      setItems(snapshot.docs
        .map((event) => ({ id: event.id, ...event.data() }) as InAppNotification)
        .filter((event) => event.actorUid !== uid && !event.clearedBy?.includes(uid)));
    }, (error) => console.warn("Notification centre listener failed:", error));
  }, [pairId, uid]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readBy?.includes(uid || "")).length,
    [items, uid],
  );

  const markRead = useCallback(async (eventId: string) => {
    if (!pairId || !uid) return;
    await updateDoc(doc(db, "pairs", pairId, "notificationEvents", eventId), {
      readBy: arrayUnion(uid),
    });
  }, [pairId, uid]);

  const markAllRead = useCallback(async () => {
    await Promise.all(items
      .filter((item) => !item.readBy?.includes(uid || ""))
      .map((item) => markRead(item.id)));
  }, [items, markRead, uid]);

  const clearOne = useCallback(async (eventId: string) => {
    if (!pairId || !uid) return;
    await updateDoc(doc(db, "pairs", pairId, "notificationEvents", eventId), {
      clearedBy: arrayUnion(uid),
    });
  }, [pairId, uid]);

  const clearAll = useCallback(async () => {
    await Promise.all(items.map((item) => clearOne(item.id)));
  }, [clearOne, items]);

  return { items, unreadCount, markRead, markAllRead, clearOne, clearAll };
}
