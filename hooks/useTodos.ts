import * as Haptics from "expo-haptics";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { LayoutAnimation } from "react-native";
import { db } from "../firebase";
import { useApp } from "../context/AppContext";
import { notifyPartner } from "../services/notifications";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
};

export function useTodos() {
  const { pairId, uid, myName } = useApp();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastCompletedRef = useRef<string | null>(null);

  /* 🔁 Load pairId + realtime sync */
  useEffect(() => {
    if (!pairId) return;
      const todosRef = collection(db, "pairs", pairId, "todos");
      const q = query(todosRef, orderBy("order", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTodos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Todo));
        setError(null);
      }, (e) => setError(e.message));
    return unsubscribe;
  }, [pairId]);

  /* ➕ Add */
  const addTodo = async (text: string) => {
    if (!text.trim() || !pairId || !uid) return false;

    await addDoc(collection(db, "pairs", pairId, "todos"), {
      text: text.trim(),
      completed: false,
      // A timestamp avoids duplicate positions when both partners add at once.
      // Explicit drag reordering still normalizes existing items to 0..n.
      order: Date.now(),
      createdAt: serverTimestamp(),
    });
    await notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plan_added", title: "New shared plan 📌", body: `${myName || "Your partner"} added “${text.trim()}”.` });
    return true;
  };

  /* ❌ Delete */
  const deleteTodo = async (id: string) => {
    if (!pairId || !uid) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const item = todos.find((todo) => todo.id === id);
    await deleteDoc(doc(db, "pairs", pairId, "todos", id));
    await notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plan_deleted", title: "Shared plan removed", body: `${myName || "Your partner"} removed “${item?.text || "a plan"}”.` });
  };

  /* ✅ Toggle complete */
 const toggleComplete = async (id: string, completed: boolean) => {
  if (!pairId || !uid) return;

  // 🚀 Optimistic update (instant UI)
  setTodos((prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !completed } : todo
    )
  );

  if (!completed && lastCompletedRef.current !== id) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lastCompletedRef.current = id;
  }

  // Firestore update in background
  const item = todos.find((todo) => todo.id === id);
  updateDoc(doc(db, "pairs", pairId, "todos", id), {
    completed: !completed,
  }).then(() => notifyPartner({ pairId, currentUid: uid, route: "plans", action: completed ? "plan_reopened" : "plan_completed", title: completed ? "Plan reopened" : "Plan completed ✅", body: `${myName || "Your partner"} ${completed ? "reopened" : "completed"} “${item?.text || "a shared plan"}”.` })).catch(console.error);
};

  /* ✏️ Edit */
  const updateTodoText = async (id: string, text: string) => {
    if (!text.trim() || !pairId || !uid) return;

    await updateDoc(doc(db, "pairs", pairId, "todos", id), { text: text.trim() });
    await notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plan_edited", title: "Shared plan updated ✏️", body: `${myName || "Your partner"} changed a plan to “${text.trim()}”.` });
  };

  /* 🔀 Reorder */
  const reorderTodos = async (data: Todo[]) => {
    if (!pairId) return;

    setTodos(data);
    const batch = writeBatch(db);

    data.forEach((todo, index) => {
      batch.update(doc(db, "pairs", pairId, "todos", todo.id), {
        order: index,
      });
    });

    await batch.commit();
  };

  return {
    todos,
    addTodo,
    deleteTodo,
    toggleComplete,
    updateTodoText,
    reorderTodos,
    ready: Boolean(pairId),
    error,
  };
}
