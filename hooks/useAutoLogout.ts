// hooks/useAutoLogout.ts
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useRef } from "react";
import {
    AppState,
    AppStateStatus
} from "react-native";
import { auth } from "../firebase";

// Inactivity timeout in milliseconds
const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function useAutoLogout() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      signOut(auth).then(() => router.replace("/login" as any));
    }, TIMEOUT) as unknown as NodeJS.Timeout; // type fix
  };

  useEffect(() => {
    resetTimeout();

    // Listen for app going active
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") resetTimeout();
      },
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.remove();
    };
  }, []);

  // Return a handler to attach to touch events
  return { onUserInteraction: resetTimeout };
}
