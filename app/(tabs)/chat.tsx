import { ChatInput } from "@/components/chat/ChatInput";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { MessageItem } from "@/components/chat/MessageItem";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useMessages } from "@/hooks/useMessages";
import { sendPushNotification } from "@/services/notifications";
import { Message } from "@/types/chat";
import { useHeaderHeight } from "@react-navigation/elements";
import { useIsFocused } from "@react-navigation/native";
import dayjs from "dayjs";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ChatItem = Message | { type: "date"; id: string; date: string };

export default function Chat() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatItem>>(null);

  // 👑 FIXED: Sourcing partnerName and myName directly from global context
  const { pairId, partnerName, myName } = useApp();
  const { userId, loading } = useAuthUser();

  const safePairId = pairId ?? "";
  const safeUserId = userId ?? "";

  const { messages } = useMessages(safePairId, safeUserId);
const isFocused = useIsFocused();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionTargetMsgId, setReactionTargetMsgId] = useState<string | null>(
    null,
  );

  // 👑 EXTRA CREDIT: Automatically marks unread incoming messages as read
  useEffect(() => {
    if (!isFocused || !safePairId || !safeUserId || !messages.length) return;

    messages.forEach(async (msg) => {
      if (!msg.readBy?.includes(safeUserId)) {
        try {
          const msgRef = doc(db, "pairs", safePairId, "messages", msg.id);
          await updateDoc(msgRef, {
            readBy: [...(msg.readBy || []), safeUserId],
          });
        } catch (err) {
          console.error("Failed auto-marking message as read:", err);
        }
      }
    });
  }, [messages, safePairId, safeUserId, isFocused]);

  const formatTime = useCallback((msg: Message) => {
    const ts =
      msg.createdAt?.toDate?.() ??
      (msg.localCreatedAt ? new Date(msg.localCreatedAt) : null);
    if (!ts) return "";
    return ts.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const getSeenText = useCallback(
    (msg: Message) => {
      if (msg.senderId !== safeUserId) return "";
      const otherReaders = msg.readBy?.filter((id) => id !== safeUserId) ?? [];
      return otherReaders.length > 0 ? "Seen" : "";
    },
    [safeUserId],
  );

  const sendMessage = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);

    const currentText = text.trim();
    setText("");
    setReplyingTo(null);

    try {
      // 1. Write the message to Firestore
      await addDoc(collection(db, "pairs", safePairId, "messages"), {
        text: currentText,
        type: "text",
        senderId: safeUserId,
        createdAt: serverTimestamp(),
        localCreatedAt: Date.now(),
        readBy: [safeUserId],
        ...(replyingTo && {
          replyTo: { id: replyingTo.id, text: replyingTo.text },
        }),
      });

      // 2. Fetch pair details simply to extract the partner's UID
      const pairRef = doc(db, "pairs", safePairId);
      const pairSnap = await getDoc(pairRef);

      if (pairSnap.exists()) {
        const pairData = pairSnap.data();
        const members: string[] = pairData.members || [];
        const partnerUid = members.find((id) => id !== safeUserId);

        if (partnerUid) {
          // 3. Look up partner's push token
          const partnerUserRef = doc(db, "users", partnerUid);
          const partnerUserSnap = await getDoc(partnerUserRef);

          if (partnerUserSnap.exists()) {
            const partnerData = partnerUserSnap.data();
            const partnerPushToken = partnerData.expoPushToken;

            if (partnerPushToken) {
              await sendPushNotification(
                partnerPushToken,
                `${myName || "New message"} 💬`, // Dynamic sender label
                currentText,
              );
            }
          }
        }
      }
    } catch (e) {
      console.error("Error in sending sequence: ", e);
    } finally {
      setSending(false);
    }
  }, [text, sending, replyingTo, safePairId, safeUserId, myName]);

  const handleAddReaction = async (emoji: string) => {
    if (!reactionTargetMsgId) return;
    try {
      const msgRef = doc(
        db,
        "pairs",
        safePairId,
        "messages",
        reactionTargetMsgId,
      );
      await updateDoc(msgRef, {
        [`reactions.${safeUserId}`]: emoji,
      });
    } catch (e) {
      console.error("Failed adding reaction: ", e);
    } finally {
      setReactionTargetMsgId(null);
    }
  };

  const invertedMessagesWithDates: ChatItem[] = useMemo(() => {
    if (!messages.length) return [];
    const chronoList: ChatItem[] = [];
    let lastDate = "";

    messages.forEach((m) => {
      const ts =
        m.createdAt?.toDate?.() ??
        (m.localCreatedAt ? new Date(m.localCreatedAt) : null);
      if (!ts) return;

      const currentDate = dayjs(ts).format("YYYY-MM-DD");
      if (currentDate !== lastDate) {
        chronoList.push({
          type: "date",
          id: `date-${currentDate}`,
          date: currentDate,
        });
        lastDate = currentDate;
      }
      chronoList.push(m);
    });

    return chronoList.reverse();
  }, [messages]);

  const renderItem = useCallback(
    ({ item }: { item: ChatItem }) => {
      if ("type" in item && item.type === "date") {
        const label = dayjs(item.date).isSame(dayjs(), "day")
          ? "Today"
          : dayjs(item.date).isSame(dayjs().subtract(1, "day"), "day")
            ? "Yesterday"
            : dayjs(item.date).format("MMM D, YYYY");

        return (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <View
              style={{
                backgroundColor: "#e2e8f0",
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{ color: "#475569", fontSize: 11, fontWeight: "600" }}
              >
                {label}
              </Text>
            </View>
          </View>
        );
      }

      return (
        <MessageItem
          message={item}
          isMe={item.senderId === safeUserId}
          onSwipeReply={() => setReplyingTo(item)}
          partnerName={partnerName || "Partner"} // 👑 Handled smoothly from App Context
          onLongPress={() => setReactionTargetMsgId(item.id)}
          onReact={() => setReactionTargetMsgId(item.id)}
          formatTime={() => formatTime(item)}
          getSeenText={() => getSeenText(item)}
          isPickerVisible={false}
        />
      );
    },
    [safeUserId, formatTime, getSeenText, partnerName],
  );

  if (loading)
    return <ActivityIndicator style={{ flex: 1, backgroundColor: "#fff" }} />;
  if (!safePairId || !safeUserId) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#efeae2" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={
        Platform.OS === "ios" ? headerHeight : headerHeight + 20
      }
    >
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          inverted
          data={invertedMessagesWithDates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={15}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
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

        <View
          style={{
            height: Platform.OS === "ios" ? Math.max(insets.bottom, 4) : 6,
            backgroundColor: "#fff",
          }}
        />
      </View>

      <Modal
        visible={reactionTargetMsgId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReactionTargetMsgId(null)}
      >
        <EmojiPicker
          onSelect={handleAddReaction}
          onClose={() => setReactionTargetMsgId(null)}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}