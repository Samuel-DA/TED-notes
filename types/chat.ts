export type ReplyTo = {
  id: string;
  text?: string;
  imageUrl?: string;
};

export type Reactions = {
  [emoji: string]: string[];
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  type: "text";
  createdAt?: any;
  localCreatedAt?: number;
  readBy?: string[];
  reactions?: Record<string, string[]>;
  replyTo?: { id: string; text?: string };
  imageUrl?: string;

};
