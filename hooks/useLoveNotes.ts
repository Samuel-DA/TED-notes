import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";

export type LoveNote = {
  id: string;
  title: string;
  text: string;
};

export function useLoveNotes(pairId: string) {
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔁 realtime sync */
  useEffect(() => {
    if (!pairId) return;

    const q = query(collection(db, "pairs", pairId, "loveNotes"));

    const unsub = onSnapshot(q, (snap) => {
      setNotes(
        snap.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
            } as LoveNote)
        )
      );
      setLoading(false);
    });

    return unsub;
  }, [pairId]);

  /* 💾 save / update note */
  const saveNote = async (noteId: string, title: string, text: string) => {
    if (!pairId) return;

    await setDoc(
      doc(db, "pairs", pairId, "loveNotes", noteId),
      {
        title,
        text,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  /* 📖 get note by id */
  const getNote = (id: string) =>
    notes.find((n) => n.id === id)?.text ?? "";

  return {
    notes,
    loading,
    saveNote,
    getNote,
  };
}