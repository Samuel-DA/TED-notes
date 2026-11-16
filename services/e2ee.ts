// services/e2ee.ts — end-to-end encryption primitives for TED Space private chat and calls.
//
// Each phone has its own X25519 key pair. The secret key lives only in the phone's secure
// storage (Keychain / Keystore). Public keys are published on the user's Firestore profile.
// Both partners derive the same shared key (Diffie–Hellman), and every message/photo is
// sealed with XSalsa20-Poly1305 using a fresh random nonce. A passphrase-encrypted copy of
// the secret key is stored on the profile so a new phone can restore it.
import { scryptAsync } from "@noble/hashes/scrypt";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import nacl from "tweetnacl";

// tweetnacl needs a CSPRNG; use the platform's secure random generator.
nacl.setPRNG((target: Uint8Array, length: number) => {
  const bytes = Crypto.getRandomBytes(length);
  for (let i = 0; i < length; i += 1) target[i] = bytes[i];
});

/* ---------- encoding ---------- */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function toB64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    out += B64[a >> 2] + B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? "=" : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? "=" : B64[c & 63];
  }
  return out;
}
export function fromB64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0, bits = 0, index = 0;
  for (const ch of clean) {
    buffer = (buffer << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) { bits -= 8; out[index++] = (buffer >> bits) & 0xff; }
  }
  return out;
}
const utf8 = new TextEncoder();
const utf8d = new TextDecoder();

/* ---------- key storage ---------- */

const secretKeyName = (uid: string) => `ted-e2ee-secret-${uid}`;

export type KeyPair = { publicKey: Uint8Array; secretKey: Uint8Array };

export async function loadLocalKeys(uid: string): Promise<KeyPair | null> {
  const stored = await SecureStore.getItemAsync(secretKeyName(uid));
  if (!stored) return null;
  return nacl.box.keyPair.fromSecretKey(fromB64(stored));
}

export async function saveLocalKeys(uid: string, keys: KeyPair) {
  await SecureStore.setItemAsync(secretKeyName(uid), toB64(keys.secretKey), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
}

export const generateKeys = (): KeyPair => nacl.box.keyPair();

/* ---------- passphrase backup ---------- */

export type KeyBackup = { v: 1; kdf: "scrypt"; N: number; salt: string; nonce: string; box: string };
const KDF_N = 2 ** 14;

async function passphraseKey(passphrase: string, salt: Uint8Array, N: number) {
  return scryptAsync(utf8.encode(passphrase.normalize("NFKC")), salt, { N, r: 8, p: 1, dkLen: 32 });
}

export async function createBackup(keys: KeyPair, passphrase: string): Promise<KeyBackup> {
  const salt = nacl.randomBytes(16);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const key = await passphraseKey(passphrase, salt, KDF_N);
  const box = nacl.secretbox(keys.secretKey, nonce, key);
  return { v: 1, kdf: "scrypt", N: KDF_N, salt: toB64(salt), nonce: toB64(nonce), box: toB64(box) };
}

/** Returns the key pair, or null if the passphrase is wrong. */
export async function openBackup(backup: KeyBackup, passphrase: string): Promise<KeyPair | null> {
  const key = await passphraseKey(passphrase, fromB64(backup.salt), backup.N || KDF_N);
  const secret = nacl.secretbox.open(fromB64(backup.box), fromB64(backup.nonce), key);
  return secret ? nacl.box.keyPair.fromSecretKey(secret) : null;
}

/* ---------- sealing ---------- */

/** Ciphertext envelope stored on a message. `sk`/`rk` are the sender's/recipient's public keys. */
export type Sealed = { v: 1; n: string; c: string; sk: string; rk: string };

const sharedCache = new Map<string, Uint8Array>();
export function sharedKey(mySecret: Uint8Array, theirPublic: Uint8Array) {
  const id = `${toB64(mySecret).slice(0, 12)}|${toB64(theirPublic)}`;
  let key = sharedCache.get(id);
  if (!key) { key = nacl.box.before(theirPublic, mySecret); sharedCache.set(id, key); }
  return key;
}

export function sealBytes(bytes: Uint8Array, mine: KeyPair, theirPublic: Uint8Array) {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const cipher = nacl.secretbox(bytes, nonce, sharedKey(mine.secretKey, theirPublic));
  return { cipher, meta: { v: 1 as const, n: toB64(nonce), sk: toB64(mine.publicKey), rk: toB64(theirPublic) } };
}

/** Find the other party's public key for an envelope, from my perspective. */
function counterpart(meta: { sk: string; rk: string }, mine: KeyPair): Uint8Array | null {
  const me = toB64(mine.publicKey);
  if (meta.sk === me) return fromB64(meta.rk);
  if (meta.rk === me) return fromB64(meta.sk);
  return null; // sealed for a key this phone doesn't have
}

export function openBytes(cipher: Uint8Array, meta: { n: string; sk: string; rk: string }, mine: KeyPair): Uint8Array | null {
  const other = counterpart(meta, mine);
  if (!other) return null;
  return nacl.secretbox.open(cipher, fromB64(meta.n), sharedKey(mine.secretKey, other));
}

export function sealJson(value: unknown, mine: KeyPair, theirPublic: Uint8Array): Sealed {
  const { cipher, meta } = sealBytes(utf8.encode(JSON.stringify(value)), mine, theirPublic);
  return { ...meta, c: toB64(cipher) };
}

export function openJson<T>(sealed: Sealed, mine: KeyPair): T | null {
  const plain = openBytes(fromB64(sealed.c), sealed, mine);
  if (!plain) return null;
  try { return JSON.parse(utf8d.decode(plain)) as T; } catch { return null; }
}

/** A per-call media key both partners can derive independently (16 bytes, AES-128-GCM). */
export function callKey(mine: KeyPair, theirPublic: Uint8Array, callId: string): ArrayBuffer {
  const shared = sharedKey(mine.secretKey, theirPublic);
  const label = utf8.encode(`ted-space-call:${callId}`);
  const input = new Uint8Array(shared.length + label.length);
  input.set(shared, 0);
  input.set(label, shared.length);
  return nacl.hash(input).slice(0, 16).buffer;
}

/** Short, human-checkable fingerprint of a pair of keys (same on both phones). */
export function safetyCode(a: Uint8Array, b: Uint8Array) {
  const [x, y] = [toB64(a), toB64(b)].sort();
  const digest = nacl.hash(utf8.encode(`${x}|${y}`));
  return Array.from(digest.slice(0, 6)).map((n) => String(n % 100).padStart(2, "0")).join(" ");
}
