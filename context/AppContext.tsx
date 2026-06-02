// context/AppContext.tsx
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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

  // App Lock State Variables - Defaults to false on iOS to prevent cold start freezes
  const [isLocked, setIsLocked] = useState<boolean>(Platform.OS !== 'ios');
  const isLockedRef = useRef<boolean>(Platform.OS !== 'ios');
  const isAuthenticating = useRef<boolean>(false);
  
  // Debounce Trackers
  const lastBackgroundTime = useRef<number>(0);
  const stateChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  const authenticateBiometrics = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') return true;
    if (isAuthenticating.current) return false;

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        isLockedRef.current = false;
        return true;
      }

      isAuthenticating.current = true;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock TED Space Vault",
        fallbackLabel: "Use Device Passcode",
        disableDeviceFallback: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      isAuthenticating.current = false;

      if (result.success) {
        setIsLocked(false);
        isLockedRef.current = false;
        return true;
      }
      return false;
    } catch (error) {
      isAuthenticating.current = false;
      console.error("Biometric security error:", error);
      return false;
    }
  };

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
    if (uid) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          updateDoc(doc(db, "users", uid), {
            expoPushToken: token,
          }).catch((err) => {
            console.error("Error saving push token:", err);
          });
        }
      });
    }
  }, [uid]);

  // 3. Debounced Single-Instance AppState Lifecycle Handler
  useEffect(() => {
    if (Platform.OS === 'ios') {
      setIsLocked(false);
      isLockedRef.current = false;
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (stateChangeTimeout.current) {
        clearTimeout(stateChangeTimeout.current);
      }

      if (isAuthenticating.current) {
        return;
      }

      const now = Date.now();

      if (nextAppState === "background" || nextAppState === "inactive") {
        lastBackgroundTime.current = now;
        
        stateChangeTimeout.current = setTimeout(() => {
          setIsLocked(true);
          isLockedRef.current = true;
        }, 1000);
      }

      if (nextAppState === "active") {
        const dynamicBailout = now - lastBackgroundTime.current < 1500;
        
        if (dynamicBailout && isLockedRef.current === false) {
          return;
        }

        authenticateBiometrics();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      if (stateChangeTimeout.current) clearTimeout(stateChangeTimeout.current);
    };
  }, []);

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