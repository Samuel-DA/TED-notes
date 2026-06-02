import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
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

    // ✅ Clean, index-free query: Pull the latest messages chronologically
    const q = query(
      collection(db, "pairs", pairId, "messages"),
      orderBy("localCreatedAt", "desc"),
      limit(40) // Capped at 40 to keep performance ultra-fast and light on reads
    );

    const unsub = onSnapshot(q, (snap) => {
      let unread = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        const readByArray = data.readBy || [];
        const senderId = data.senderId;

        // ✅ Efficient client-side validation
        // Increment ONLY if it's from your partner AND you haven't read it yet
        if (senderId !== uid && !readByArray.includes(uid)) {
          unread++;
        }
      });

      setCount(unread);
    }, (error) => {
      console.error("Error streaming unread message count:", error);
    });

    return unsub;
  }, [pairId, uid]);

  return count;
}