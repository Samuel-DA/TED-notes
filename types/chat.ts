export type ReplyTo = {
  id: string;
  text?: string;
  imageUrl?: string;
};

export type Reactions = {
  [emoji: string]: string[];
};

export type ChatMedia = {
  path: string;
  kind: "image" | "video";
  mimeType: string;
  width: number;
  height: number;
  /** Seconds, for video. */
  duration?: number;
  /** Present when the file bytes are end-to-end encrypted (nonce + both public keys). */
  e2ee?: { v: 1; n: string; sk: string; rk: string };
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  type: "text" | "image" | "video";
  /** Present for photo/video messages. `text` is then an optional caption. */
  media?: ChatMedia;
  createdAt?: any;
  localCreatedAt?: number;
  readBy?: string[];
  reactions?: Record<string, string>;
  replyTo?: { id: string; text?: string };
  imageUrl?: string;
  editedAt?: any;
  deletedAt?: any;
  /** End-to-end encrypted payload: { t: text, r?: reply snippet }. */
  e2ee?: { v: 1; n: string; c: string; sk: string; rk: string };
  /** Client-side only: set when an encrypted message can't be opened on this phone. */
  locked?: boolean;

};
