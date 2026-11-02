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
  category?: string | null;
  dueDate?: string | null;
  createdBy?: string;
};

export type TodoMeta = { category?: string | null; dueDate?: string | null };

export function useTodos() {
  const { pairId, uid, myName } = useApp();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const lastCompletedRef = useRef<string | null>(null);

  /* 🔁 Realtime sync */
  useEffect(() => {
    if (!pairId) return;
    const q = query(collection(db, "pairs", pairId, "todos"), orderBy("order", "asc"));
    return onSnapshot(q, (snapshot) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTodos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Todo));
      setLoaded(true);
      setError(null);
    }, (e) => { setError(e.message); setLoaded(true); });
  }, [pairId]);

  /* ➕ Add */
  const addTodo = async (text: string, meta: TodoMeta = {}) => {
    if (!text.trim() || !pairId || !uid) return false;
    try {
      await addDoc(collection(db, "pairs", pairId, "todos"), {
        text: text.trim(),
        completed: false,
        // A timestamp avoids duplicate positions when both partners add at once.
        order: Date.now(),
        createdAt: serverTimestamp(),
        createdBy: uid,
        ...(meta.category ? { category: meta.category } : {}),
        ...(meta.dueDate ? { dueDate: meta.dueDate } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that plan.");
      return false;
    }
    void notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plan_added", title: "New shared plan 📌", body: `${myName || "Your partner"} added “${text.trim()}”.` });
    return true;
  };

  /* ❌ Delete */
  const deleteTodo = async (id: string) => {
    if (!pairId || !uid) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const item = todos.find((todo) => todo.id === id);
    await deleteDoc(doc(db, "pairs", pairId, "todos", id));
    void notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plan_deleted", title: "Shared plan removed", body: `${myName || "Your partner"} removed “${item?.text || "a plan"}”.` });
  };

  /* 🧹 Clear all completed */
  const clearCompleted = async () => {
    if (!pairId || !uid) return;
    const done = todos.filter((todo) => todo.completed);
    if (!done.length) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const batch = writeBatch(db);
    done.forEach((todo) => batch.delete(doc(db, "pairs", pairId, "todos", todo.id)));
    await batch.commit();
    void notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plans_cleared", title: "Completed plans cleared 🧹", body: `${myName || "Your partner"} cleared ${done.length} completed plan${done.length === 1 ? "" : "s"}.` });
  };

  /* ✅ Toggle complete */
  const toggleComplete = async (id: string, completed: boolean) => {
    if (!pairId || !uid) return;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !completed } : todo)));
    if (!completed && lastCompletedRef.current !== id) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      lastCompletedRef.current = id;
    }
    const item = todos.find((todo) => todo.id === id);
    updateDoc(doc(db, "pairs", pairId, "todos", id), { completed: !completed })
      .then(() => notifyPartner({ pairId, currentUid: uid, route: "plans", action: completed ? "plan_reopened" : "plan_completed", title: completed ? "Plan reopened" : "Plan completed ✅", body: `${myName || "Your partner"} ${completed ? "reopened" : "completed"} “${item?.text || "a shared plan"}”.` }))
      .catch(console.error);
  };

  /* ✏️ Edit text / category / due date */
  const updateTodo = async (id: string, patch: { text?: string } & TodoMeta) => {
    if (!pairId || !uid) return;
    const item = todos.find((todo) => todo.id === id);
    const update: Record<string, unknown> = {};
    if (patch.text !== undefined && patch.text.trim() && patch.text.trim() !== item?.text) update.text = patch.text.trim();
    if (patch.category !== undefined && patch.category !== (item?.category ?? null)) update.category = patch.category;
    if (patch.dueDate !== undefined && patch.dueDate !== (item?.dueDate ?? null)) update.dueDate = patch.dueDate;
    if (!Object.keys(update).length) return;
    await updateDoc(doc(db, "pairs", pairId, "todos", id), update);
    if (update.text) void notifyPartner({ pairId, currentUid: uid, route: "plans", action: "plan_edited", title: "Shared plan updated ✏️", body: `${myName || "Your partner"} changed a plan to “${update.text}”.` });
  };

  const updateTodoText = (id: string, text: string) => updateTodo(id, { text });

  /* 🔀 Reorder */
  const reorderTodos = async (data: Todo[]) => {
    if (!pairId) return;
    setTodos(data);
    const batch = writeBatch(db);
    data.forEach((todo, index) => batch.update(doc(db, "pairs", pairId, "todos", todo.id), { order: index }));
    await batch.commit();
  };

  return {
    todos,
    addTodo,
    deleteTodo,
    clearCompleted,
    toggleComplete,
    updateTodo,
    updateTodoText,
    reorderTodos,
    ready: Boolean(pairId) && loaded,
    error,
  };
}
