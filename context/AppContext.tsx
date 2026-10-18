// context/AppContext.tsx
import { registerForPushNotificationsAsync, removePushTokenForUser, savePushTokenForUser } from "@/services/notifications";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native"; 
import * as LocalAuthentication from "expo-local-authentication";
import { auth, db } from "../firebase";

interface AppContextType {
  uid: string | null;
  myName: string | null;
  partnerName: string | null;
  pairId: string | null;
  loading: boolean;
  isLocked: boolean;
  authenticateBiometrics: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid, setUid] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [pairId, setPairId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Start locked on native platforms. Web has no local biometric capability.
  const [isLocked, setIsLocked] = useState<boolean>(Platform.OS !== "web");
  const isLockedRef = useRef<boolean>(Platform.OS !== "web");
  const isAuthenticating = useRef<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  
  // App-lock lifecycle tracking. Short system transitions (biometrics,
  // permission sheets and Android activity recreation) must not re-lock.
  const lastBackgroundTime = useRef<number>(0);

  const authenticateBiometrics = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      setIsLocked(false);
      isLockedRef.current = false;
      return true;
    }
    if (isAuthenticating.current) return false;

    isAuthenticating.current = true;

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        isLockedRef.current = false;
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock TED Space Vault",
        fallbackLabel: "Use Device Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        isLockedRef.current = false;
        lastBackgroundTime.current = 0;
        appState.current = "active";
        return true;
      }
      return false;
    } catch (error) {
      console.error("Biometric security error:", error);
      return false;
    } finally {
      isAuthenticating.current = false;
      appState.current = AppState.currentState;
    }
  }, []);

  // 1. Firebase Data & Auth Listener
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribePair: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      unsubscribeUser?.();
      unsubscribePair?.();

      if (!user) {
        setUid(null);
        setMyName(null);
        setPartnerName(null);
        setPairId(null);
        setLoading(false);
        return;
      }

      setUid(user.uid);
      setLoading(true);

      const userRef = doc(db, "users", user.uid);

      unsubscribeUser = onSnapshot(userRef, (userSnap) => {
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        setMyName(userData.name ?? null);

        const newPairId = userData.pairId ?? null;
        setPairId(newPairId);
        setPartnerName(null);

        unsubscribePair?.();
        unsubscribePair = undefined;

        if (!newPairId) {
          setLoading(false);
          return;
        }

        const pairRef = doc(db, "pairs", newPairId);

        unsubscribePair = onSnapshot(pairRef, (pairSnap) => {
          if (!pairSnap.exists()) {
            setPartnerName(null);
            setLoading(false);
            return;
          }

          const data = pairSnap.data();
          const names: Record<string, string> = data.names || {};

          const partnerUid = Object.keys(names).find((id) => id !== user.uid);

          setPartnerName(partnerUid ? names[partnerUid] : null);
          setLoading(false);
        });
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser?.();
      unsubscribePair?.();
    };
  }, []);

  // 2. Push Notifications Setup
  useEffect(() => {
    let active = true;
    let registeredToken: string | null = null;
    if (uid && myName) {
      registerForPushNotificationsAsync()
        .then(async (token) => {
          if (!active || !token) return;
          registeredToken = token;
          await savePushTokenForUser(uid, token);
        })
        .catch((err) => console.error("Error registering push notifications:", err));
    }
    return () => {
      active = false;
      if (uid && registeredToken) void removePushTokenForUser(uid, registeredToken).catch(console.warn);
    };
  }, [myName, uid]);

  // 3. Debounced Single-Instance AppState Lifecycle Handler
  useEffect(() => {
    if (Platform.OS === "web") {
      setIsLocked(false);
      isLockedRef.current = false;
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;

      // Face ID, Android biometrics and permission sheets briefly move the
      // activity through inactive/background. Do not turn them into a second
      // lock prompt.
      if (isAuthenticating.current) {
        appState.current = nextAppState;
        return;
      }

      appState.current = nextAppState;

      const now = Date.now();

      if (nextAppState === "background" && previousAppState !== "background") {
        lastBackgroundTime.current = now;
      }

      if (
        nextAppState === "active" &&
        previousAppState === "background" &&
        lastBackgroundTime.current > 0 &&
        now - lastBackgroundTime.current >= 5000
      ) {
        setIsLocked(true);
        isLockedRef.current = true;
      }

      if (nextAppState === "active") lastBackgroundTime.current = 0;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [authenticateBiometrics]);

  return (
    <AppContext.Provider 
      value={{ uid, myName, partnerName, pairId, loading, isLocked, authenticateBiometrics }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
