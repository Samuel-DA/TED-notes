import { useHeaderHeight } from "@react-navigation/elements";
import dayjs from "dayjs";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,useEffect,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useMessages } from "@/hooks/useMessages";
import { Message } from "@/types/chat";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageItem } from "@/components/chat/MessageItem";

type ChatItem = Message | { type: "date"; id: string; date: string };

export default function Chat() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatItem>>(null);

  const { pairId } = useApp();
  const { userId, loading } = useAuthUser();

  const safePairId = pairId ?? "";
  const safeUserId = userId ?? "";

  const { messages } = useMessages(safePairId, safeUserId);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionFor, setReactionFor] = useState<string | null>(null);

  const formatTime = (msg: Message) => {
    const ts =
      msg.createdAt?.toDate?.() ??
      (msg.localCreatedAt ? new Date(msg.localCreatedAt) : null);

    if (!ts) return "";

    return ts.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getSeenText = (msg: Message) => {
    if (msg.senderId !== safeUserId) return "";

    const otherReaders = msg.readBy?.filter((id) => id !== safeUserId) ?? [];

    return otherReaders.length > 0 ? "Seen" : "";
  };

  const sendMessage = useCallback(async () => {
    if (!text.trim() || sending) return;

    setSending(true);

    await addDoc(collection(db, "pairs", safePairId, "messages"), {
      text: text.trim(),
      type: "text",
      senderId: safeUserId,
      createdAt: serverTimestamp(),
      localCreatedAt: Date.now(),
      readBy: [safeUserId],
      ...(replyingTo && {
        replyTo: { id: replyingTo.id, text: replyingTo.text },
      }),
    });

    setText("");
    setReplyingTo(null);
    setSending(false);
  }, [text, sending, replyingTo, safePairId, safeUserId]);

  const messagesWithDates: ChatItem[] = useMemo(() => {
    if (!messages.length) return [];

    const result: ChatItem[] = [];
    let lastDate = "";

    messages.forEach((m) => {
      const ts =
        m.createdAt?.toDate?.() ??
        (m.localCreatedAt ? new Date(m.localCreatedAt) : null);

      if (!ts) return;

      const currentDate = dayjs(ts).format("YYYY-MM-DD");

      if (currentDate !== lastDate) {
        result.push({
          type: "date",
          id: `date-${currentDate}`,
          date: currentDate,
        });
        lastDate = currentDate;
      }

      result.push(m);
    });

    return result;
  }, [messages]);

  useEffect(() => {
  if (messagesWithDates.length > 0) {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 50);

    return () => clearTimeout(timeout);
  }
}, [messagesWithDates.length]);

  const renderItem = ({ item }: { item: ChatItem }) => {
    if ("type" in item && item.type === "date") {
      const label = dayjs(item.date).isSame(dayjs(), "day")
        ? "Today"
        : dayjs(item.date).isSame(dayjs().subtract(1, "day"), "day")
          ? "Yesterday"
          : dayjs(item.date).format("MMM D, YYYY");

      return (
        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <Text style={{ color: "#888", fontSize: 12 }}>{label}</Text>
        </View>
      );
    }

    

    return (
      <MessageItem
        message={item}
        isMe={item.senderId === safeUserId}
        onSwipeReply={() => setReplyingTo(item)}
        onLongPress={() => setReactionFor(item.id)}
        onReact={() => {}}
        formatTime={() => formatTime(item)}
        getSeenText={() => getSeenText(item)}
        isPickerVisible={reactionFor === item.id}
      />
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!safePairId || !safeUserId) return null;

  

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messagesWithDates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 100,
          }}
          onScrollBeginDrag={() => setReactionFor(null)}
        />

        <ChatInput
          text={text}
          setText={setText}
          sending={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSend={sendMessage}
          onPickImage={() => {}}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
