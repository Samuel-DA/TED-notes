// context/AppContext.tsx
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";

interface AppContextType {
  uid: string | null;
  myName: string | null;
  partnerName: string | null;
  pairId: string | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [uid, setUid] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [pairId, setPairId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

          const partnerUid = Object.keys(names).find(
            (id) => id !== user.uid,
          );

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

  return (
    <AppContext.Provider
      value={{ uid, myName, partnerName, pairId, loading }}
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