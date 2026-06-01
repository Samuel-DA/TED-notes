import * as Haptics from "expo-haptics";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { LayoutAnimation } from "react-native";
import { auth, db } from "../firebase";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
};

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const lastCompletedRef = useRef<string | null>(null);
  const pairIdRef = useRef<string | null>(null);

  /* 🔁 Load pairId + realtime sync */
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let unsubscribe: (() => void) | undefined;

    const loadAndListen = async () => {
      // 1️⃣ Load user's pairId
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;

      const pairId = userSnap.data().pairId;
      if (!pairId) return;

      pairIdRef.current = pairId;

      // 2️⃣ Listen to todos under the pair
      const todosRef = collection(db, "pairs", pairId, "todos");
      const q = query(todosRef, orderBy("order", "asc"));

      unsubscribe = onSnapshot(q, (snapshot) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTodos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Todo));
      });
    };

    loadAndListen();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /* ➕ Add */
  const addTodo = async (text: string) => {
    if (!text.trim() || !pairIdRef.current) return;

    await addDoc(collection(db, "pairs", pairIdRef.current, "todos"), {
      text: text.trim(),
      completed: false,
      order: todos.length,
      createdAt: serverTimestamp(),
    });
  };

  /* ❌ Delete */
  const deleteTodo = async (id: string) => {
    if (!pairIdRef.current) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    await deleteDoc(doc(db, "pairs", pairIdRef.current, "todos", id));
  };

  /* ✅ Toggle complete */
 const toggleComplete = async (id: string, completed: boolean) => {
  if (!pairIdRef.current) return;

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
  updateDoc(doc(db, "pairs", pairIdRef.current, "todos", id), {
    completed: !completed,
  }).catch(console.error);
};

  /* ✏️ Edit */
  const updateTodoText = async (id: string, text: string) => {
    if (!text.trim() || !pairIdRef.current) return;

    await updateDoc(doc(db, "pairs", pairIdRef.current, "todos", id), { text });
  };

  /* 🔀 Reorder */
  const reorderTodos = async (data: Todo[]) => {
    if (!pairIdRef.current) return;

    setTodos(data);
    const batch = writeBatch(db);

    data.forEach((todo, index) => {
      batch.update(doc(db, "pairs", pairIdRef.current!, "todos", todo.id), {
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
  };
}
