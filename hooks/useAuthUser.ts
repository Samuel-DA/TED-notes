import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";

export function useAuthUser() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? undefined); // 🔑 normalize null → undefined
      setLoading(false);
    });

    return unsub;
  }, []);

  return {
    user,
    userId: user?.uid, // always string | undefined
    loading,
    isAuthed: !!user,
  };
}