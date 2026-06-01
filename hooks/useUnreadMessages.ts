import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useApp } from "../context/AppContext";

export function useUnreadMessages() {
  const { pairId } = useApp();
  const uid = auth.currentUser?.uid;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!pairId || !uid) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, "pairs", pairId, "messages"),
      where("senderId", "!=", uid) // 👈 only partner messages
    );

    const unsub = onSnapshot(q, (snap) => {
      let unread = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        if (!data.readBy?.includes(uid)) {
          unread++;
        }
      });

      setCount(unread);
    });

    return unsub;
  }, [pairId, uid]);

  return count;
}