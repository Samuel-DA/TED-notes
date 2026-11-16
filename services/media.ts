// services/media.ts — pick, upload and cache photos/videos stored in Firebase Storage.
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { fetch as expoFetch } from "expo/fetch";
import { getBytes, ref } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { auth, storage } from "@/firebase";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 120;

export type PickedMedia = {
  uri: string;
  kind: "image" | "video";
  mimeType: string;
  ext: string;
  width: number;
  height: number;
  /** Seconds, for video. */
  duration?: number;
  size: number;
};

/** Open the camera or the photo library. Returns null if cancelled or permission denied. */
export async function pickMedia(source: "camera" | "library", options: { allowVideo?: boolean } = {}): Promise<PickedMedia | null> {
  const mediaTypes: ImagePicker.MediaType[] = options.allowVideo ? ["images", "videos"] : ["images"];
  const common: ImagePicker.ImagePickerOptions = { mediaTypes, quality: 0.75, videoMaxDuration: MAX_VIDEO_SECONDS, allowsEditing: false, exif: false };
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Allow camera access in Settings to take photos.");
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error("Allow photo access in Settings to choose from your library.");
  }
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(common) : await ImagePicker.launchImageLibraryAsync(common);
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const kind = asset.type === "video" ? "video" : "image";
  const mimeType = asset.mimeType || (kind === "video" ? "video/mp4" : "image/jpeg");
  const ext = kind === "video" ? (mimeType.includes("quicktime") ? "mov" : "mp4") : mimeType.includes("png") ? "png" : mimeType.includes("heic") ? "heic" : "jpg";
  const file = new File(asset.uri);
  const size = asset.fileSize ?? file.size ?? 0;
  if (kind === "image" && size > MAX_IMAGE_BYTES) throw new Error("That photo is larger than 15 MB.");
  if (kind === "video" && size > MAX_VIDEO_BYTES) throw new Error("That video is larger than 50 MB. Try a shorter clip.");
  return { uri: asset.uri, kind, mimeType, ext, width: asset.width, height: asset.height, duration: asset.duration ? asset.duration / 1000 : undefined, size };
}

/**
 * Upload a local file to Firebase Storage.
 * Firebase's web uploader relies on React Native's XMLHttpRequest Blob support, which loses
 * the server response on Expo, so we send the same multipart request through Expo Fetch.
 */
export async function uploadFile(storagePath: string, uri: string, contentType: string, transform?: (bytes: Uint8Array) => Uint8Array): Promise<void> {
  const raw = await new File(uri).bytes();
  const bytes = transform ? transform(raw) : raw;
  const currentUser = auth.currentUser;
  const bucket = storage.app.options.storageBucket;
  if (!currentUser) throw new Error("Your session has expired. Sign in again and retry.");
  if (!bucket) throw new Error("Firebase Storage isn't configured.");
  const boundary = `ted-space-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const metadata = JSON.stringify({ name: storagePath, contentType });
  const encoder = new TextEncoder();
  const head = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`);
  const tail = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);
  const token = await currentUser.getIdToken();
  const response = await expoFetch(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=${encodeURIComponent(storagePath)}`, {
    method: "POST",
    headers: {
      Authorization: `Firebase ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "X-Firebase-GMPID": storage.app.options.appId || "",
      "X-Goog-Upload-Protocol": "multipart",
    },
    body: body as unknown as BodyInit,
  });
  const payload = await response.text();
  if (!response.ok) throw new Error(`Upload failed (${response.status}). ${payload.slice(0, 160)}`);
}

const cacheNameFor = (path: string) => `ted-media-${path.replace(/[^A-Za-z0-9._-]/g, "_")}`;
const inFlight = new Map<string, Promise<string>>();

/** Download a Storage object once and keep it in the app cache. Resolves to a local file URI. */
export function cachedFileUri(storagePath: string, maxBytes = MAX_VIDEO_BYTES + 1024, decrypt?: (bytes: Uint8Array) => Uint8Array | null): Promise<string> {
  const file = new File(Paths.cache, cacheNameFor(storagePath));
  if (file.exists && file.size > 0) return Promise.resolve(file.uri);
  const existing = inFlight.get(storagePath);
  if (existing) return existing;
  const task = getBytes(ref(storage, storagePath), maxBytes)
    .then((buffer) => {
      const downloaded = new Uint8Array(buffer);
      const bytes = decrypt ? decrypt(downloaded) : downloaded;
      if (!bytes) throw new Error("This file is encrypted for a key this phone doesn't have.");
      if (!file.exists) file.create();
      file.write(bytes);
      return file.uri;
    })
    .finally(() => inFlight.delete(storagePath));
  inFlight.set(storagePath, task);
  return task;
}

/** Seed the cache with a file we just uploaded, so the sender doesn't download it again. */
export function primeCache(storagePath: string, localUri: string) {
  try {
    const target = new File(Paths.cache, cacheNameFor(storagePath));
    if (!target.exists) new File(localUri).copy(target);
  } catch {
    // Non-fatal: the file will be downloaded on first view instead.
  }
}

/** React hook: the local URI for a Storage path (null while loading). Pass `decrypt` for end-to-end encrypted files. */
export function useStorageFile(storagePath?: string | null, decrypt?: (bytes: Uint8Array) => Uint8Array | null) {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const decryptRef = useRef(decrypt);
  decryptRef.current = decrypt;
  useEffect(() => {
    let active = true;
    setUri(null);
    setError(false);
    if (!storagePath) return;
    cachedFileUri(storagePath, undefined, decryptRef.current ? (b) => decryptRef.current!(b) : undefined).then((value) => { if (active) setUri(value); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [storagePath]);
  return { uri, error };
}
