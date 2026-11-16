// context/E2EEContext.tsx — this phone's private-chat keys and the partner's public key.
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import {
  callKey, createBackup, fromB64, generateKeys, KeyBackup, KeyPair, loadLocalKeys, openBackup, openBytes, openJson,
  safetyCode, saveLocalKeys, sealBytes, sealJson, Sealed, toB64,
} from "@/services/e2ee";

export type E2EEStatus = "loading" | "setup" | "restore" | "ready";

type E2EEValue = {
  status: E2EEStatus;
  /** True when both of you have keys, so new messages are sent encrypted. */
  active: boolean;
  partnerReady: boolean;
  safety: string | null;
  setUp: (passphrase: string) => Promise<void>;
  restore: (passphrase: string) => Promise<boolean>;
  /** Start over with a new key (older encrypted messages won't be readable on this phone). */
  reset: (passphrase: string) => Promise<void>;
  changePassphrase: (passphrase: string) => Promise<void>;
  sealJson: (value: unknown) => Sealed | null;
  openJson: <T>(sealed: Sealed) => T | null;
  sealBytes: (bytes: Uint8Array) => { cipher: Uint8Array; meta: Omit<Sealed, "c"> } | null;
  openBytes: (cipher: Uint8Array, meta: Omit<Sealed, "c">) => Uint8Array | null;
  callKey: (callId: string) => ArrayBuffer | null;
};

const E2EEContext = createContext<E2EEValue | null>(null);

export function E2EEProvider({ children }: { children: React.ReactNode }) {
  const { uid, partnerUid } = useApp();
  const [keys, setKeys] = useState<KeyPair | null>(null);
  const [backup, setBackup] = useState<KeyBackup | null>(null);
  const [publishedKey, setPublishedKey] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [partnerKey, setPartnerKey] = useState<Uint8Array | null>(null);

  // This phone's secret key.
  useEffect(() => {
    setKeys(null); setLocalLoaded(false);
    if (!uid) return;
    let active = true;
    loadLocalKeys(uid).then((k) => { if (active) { setKeys(k); setLocalLoaded(true); } }).catch(() => active && setLocalLoaded(true));
    return () => { active = false; };
  }, [uid]);

  // My published public key and backup.
  useEffect(() => {
    setProfileLoaded(false);
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snap) => {
      const data = snap.data() || {};
      setPublishedKey(typeof data.e2eePublicKey === "string" ? data.e2eePublicKey : null);
      setBackup(data.e2eeBackup ?? null);
      setProfileLoaded(true);
    }, () => setProfileLoaded(true));
  }, [uid]);

  // Partner's public key.
  useEffect(() => {
    setPartnerKey(null);
    if (!partnerUid) return;
    return onSnapshot(doc(db, "users", partnerUid), (snap) => {
      const key = snap.data()?.e2eePublicKey;
      setPartnerKey(typeof key === "string" ? fromB64(key) : null);
    }, () => setPartnerKey(null));
  }, [partnerUid]);

  // Keep the published key in sync with this phone's key (e.g. after a restore).
  useEffect(() => {
    if (!uid || !keys || !profileLoaded) return;
    const mine = toB64(keys.publicKey);
    if (publishedKey !== mine) void updateDoc(doc(db, "users", uid), { e2eePublicKey: mine }).catch(console.warn);
  }, [keys, profileLoaded, publishedKey, uid]);

  const status: E2EEStatus = !uid || !localLoaded || !profileLoaded ? "loading" : keys ? "ready" : backup ? "restore" : "setup";

  const setUp = useCallback(async (passphrase: string) => {
    if (!uid) return;
    const fresh = generateKeys();
    const sealed = await createBackup(fresh, passphrase);
    await saveLocalKeys(uid, fresh);
    await updateDoc(doc(db, "users", uid), { e2eePublicKey: toB64(fresh.publicKey), e2eeBackup: sealed });
    setKeys(fresh);
  }, [uid]);

  const restore = useCallback(async (passphrase: string) => {
    if (!uid || !backup) return false;
    const restored = await openBackup(backup, passphrase);
    if (!restored) return false;
    await saveLocalKeys(uid, restored);
    setKeys(restored);
    return true;
  }, [backup, uid]);

  const changePassphrase = useCallback(async (passphrase: string) => {
    if (!uid || !keys) return;
    await updateDoc(doc(db, "users", uid), { e2eeBackup: await createBackup(keys, passphrase) });
  }, [keys, uid]);

  const value = useMemo<E2EEValue>(() => ({
    status,
    active: !!keys && !!partnerKey,
    partnerReady: !!partnerKey,
    safety: keys && partnerKey ? safetyCode(keys.publicKey, partnerKey) : null,
    setUp,
    restore,
    reset: setUp,
    changePassphrase,
    sealJson: (v) => (keys && partnerKey ? sealJson(v, keys, partnerKey) : null),
    openJson: <T,>(sealed: Sealed) => (keys ? openJson<T>(sealed, keys) : null),
    sealBytes: (bytes) => (keys && partnerKey ? sealBytes(bytes, keys, partnerKey) : null),
    openBytes: (cipher, meta) => (keys ? openBytes(cipher, meta, keys) : null),
    callKey: (callId) => (keys && partnerKey ? callKey(keys, partnerKey, callId) : null),
  }), [changePassphrase, keys, partnerKey, restore, setUp, status]);

  return <E2EEContext.Provider value={value}>{children}</E2EEContext.Provider>;
}

export function useE2EE() {
  const ctx = useContext(E2EEContext);
  if (!ctx) throw new Error("useE2EE must be used inside E2EEProvider");
  return ctx;
}
