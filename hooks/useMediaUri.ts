import { useE2EE } from "@/context/E2EEContext";
import { useStorageFile } from "@/services/media";
import type { ChatMedia } from "@/types/chat";

/** Local file for a chat/outfit media item, decrypting end-to-end encrypted files on the fly. */
export function useMediaUri(media?: Pick<ChatMedia, "path" | "e2ee"> | null, enabled = true) {
  const { openBytes } = useE2EE();
  const sealed = media?.e2ee;
  return useStorageFile(enabled ? media?.path : null, sealed ? (bytes) => openBytes(bytes, sealed) : undefined);
}
