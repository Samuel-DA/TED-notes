import { ChatInput } from "@/components/chat/ChatInput";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { MessageItem } from "@/components/chat/MessageItem";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useMessages } from "@/hooks/useMessages";
import { notifyPartner } from "@/services/notifications";
import { Message } from "@/types/chat";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, LockKeyhole } from "lucide-react-native";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@/constants/design";

type ChatItem = Message | { type: "date"; id: string; date: string };

export default function Chat() {
  const router = useRouter();
  const listRef = useRef<FlatList<ChatItem>>(null);

  // 👑 FIXED: Sourcing partnerName and myName directly from global context
  const { pairId, partnerName, myName } = useApp();
  const { userId, loading } = useAuthUser();

  const safePairId = pairId ?? "";
  const safeUserId = userId ?? "";

  const { messages } = useMessages(safePairId, safeUserId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // 👑 EXTRA CREDIT: Automatically marks unread incoming messages as read
  useFocusEffect(useCallback(() => {
    if (!safePairId || !safeUserId || !messages.length) return;

    const unreadMessages = messages.filter(
      (msg) => msg.senderId !== safeUserId && !msg.readBy?.includes(safeUserId),
    );

    void Promise.all(
      unreadMessages.map(async (msg) => {
        try {
          const msgRef = doc(db, "pairs", safePairId, "messages", msg.id);
          await updateDoc(msgRef, {
            readBy: arrayUnion(safeUserId),
          });
        } catch (err) {
          console.error("Failed auto-marking message as read:", err);
        }
      }),
    );
  }, [messages, safePairId, safeUserId]));

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
      if (editingMessage) {
        await updateDoc(doc(db, "pairs", safePairId, "messages", editingMessage.id), {
          text: currentText,
          editedAt: serverTimestamp(),
        });
        setEditingMessage(null);
        return;
      }
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

      await notifyPartner({
        pairId: safePairId,
        currentUid: safeUserId,
        route: "chat",
        action: "message_received",
        title: `${myName || "New message"} 💬`,
        body: currentText,
      });
    } catch (e) {
      console.error("Error in sending sequence: ", e);
    } finally {
      setSending(false);
    }
  }, [text, sending, replyingTo, safePairId, safeUserId, myName, editingMessage]);

  const handleAddReaction = async (emoji: string) => {
    if (!selectedMessage || selectedMessage.deletedAt) return;
    try {
      const msgRef = doc(
        db,
        "pairs",
        safePairId,
        "messages",
        selectedMessage.id,
      );
      await updateDoc(msgRef, {
        [`reactions.${safeUserId}`]: emoji,
      });
      await notifyPartner({ pairId: safePairId, currentUid: safeUserId, route: "chat", action: "message_reaction", title: `${myName || "Your partner"} reacted ${emoji}`, body: "They reacted to a message in your chat." });
    } catch (e) {
      console.error("Failed adding reaction: ", e);
    } finally {
      setSelectedMessage(null);
    }
  };

  const beginEdit = () => {
    if (!selectedMessage || selectedMessage.senderId !== safeUserId || selectedMessage.deletedAt) return;
    setEditingMessage(selectedMessage);
    setReplyingTo(null);
    setText(selectedMessage.text);
    setSelectedMessage(null);
  };

  const confirmDelete = () => {
    if (!selectedMessage || selectedMessage.senderId !== safeUserId || selectedMessage.deletedAt) return;
    const message = selectedMessage;
    setSelectedMessage(null);
    Alert.alert("Delete message?", "It will show as deleted for both of you.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void updateDoc(doc(db, "pairs", safePairId, "messages", message.id), { text: "", deletedAt: serverTimestamp() }) },
    ]);
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
                backgroundColor: "rgba(255,255,255,0.76)",
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
          onSwipeReply={() => { if (!item.deletedAt) { setEditingMessage(null); setReplyingTo(item); } }}
          partnerName={partnerName || ""}
          onLongPress={() => { if (!item.deletedAt) setSelectedMessage(item); }}
          onReact={() => { if (!item.deletedAt) setSelectedMessage(item); }}
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
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(tabs)/Home")} hitSlop={12} style={styles.headerButton}>
          <ArrowLeft color="#fff" size={23} />
        </Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(partnerName || "P").slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerName}>{partnerName || "My person"}</Text>
          <View style={styles.privateRow}><LockKeyhole color="#B7DED7" size={11} /><Text style={styles.headerStatus}>your private conversation</Text></View>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        enabled
      >
        <View pointerEvents="none" style={styles.wallpaper}>
          <Text style={[styles.wallpaperMark, { top: 40, left: 22 }]}>♡</Text>
          <Text style={[styles.wallpaperMark, { top: 150, right: 35 }]}>•</Text>
          <Text style={[styles.wallpaperMark, { top: 310, left: 75 }]}>☾</Text>
          <Text style={[styles.wallpaperMark, { top: 500, right: 80 }]}>♡</Text>
        </View>
        <FlatList
          ref={listRef}
          inverted
          data={invertedMessagesWithDates}
          extraData={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={15}
          contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 14 }}
        />

        <ChatInput
          text={text}
          setText={setText}
          sending={sending}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCancelReply={() => setReplyingTo(null)}
          onCancelEdit={() => { setEditingMessage(null); setText(""); }}
          onSend={sendMessage}
          onPickImage={() => {}}
        />

      <Modal
        visible={selectedMessage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <EmojiPicker
          onSelect={handleAddReaction}
          onClose={() => setSelectedMessage(null)}
          canManage={selectedMessage?.senderId === safeUserId && !selectedMessage?.deletedAt}
          onEdit={beginEdit}
          onDelete={confirmDelete}
        />
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.whatsappDark },
  header: { minHeight: 66, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", backgroundColor: palette.whatsappDark, paddingBottom: 8 },
  headerButton: { width: 38, height: 44, alignItems: "center", justifyContent: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#D7EFEA", alignItems: "center", justifyContent: "center", marginRight: 11 },
  avatarText: { color: palette.whatsappDark, fontSize: 18, fontWeight: "800" },
  headerCopy: { flex: 1 },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "700" },
  privateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerStatus: { color: "#C4E1DC", fontSize: 11 },
  chatArea: { flex: 1, backgroundColor: "#EFEAE2" },
  wallpaper: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  wallpaperMark: { position: "absolute", color: "rgba(92,80,67,0.07)", fontSize: 38, fontWeight: "800" },
});
