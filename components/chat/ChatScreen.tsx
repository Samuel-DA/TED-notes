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
  deleteField,
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
  Text,
  View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenBackground } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type ChatItem = Message | { type: "date"; id: string; date: string };

export default function Chat() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
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

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void notifyPartner({
        pairId: safePairId,
        currentUid: safeUserId,
        route: "chat",
        action: "message_received",
        title: `${myName || "New message"} 💬`,
        body: currentText,
      });
    } catch (e) {
      console.error("Error in sending sequence: ", e);
      setText(currentText);
      Alert.alert("Message not sent", "Check your connection and try again.");
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
      const removing = selectedMessage.reactions?.[safeUserId] === emoji;
      await updateDoc(msgRef, {
        [`reactions.${safeUserId}`]: removing ? deleteField() : emoji,
      });
      if (removing || selectedMessage.senderId === safeUserId) return;
      void Haptics.selectionAsync();
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

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const continuedIds = useMemo(() => {
    const set = new Set<string>();
    let prev: Message | null = null;
    messages.forEach((m) => {
      const at = m.createdAt?.toDate?.()?.getTime?.() ?? m.localCreatedAt ?? 0;
      const prevAt = prev ? prev.createdAt?.toDate?.()?.getTime?.() ?? prev.localCreatedAt ?? 0 : 0;
      if (prev && prev.senderId === m.senderId && at - prevAt < 3 * 60_000 && dayjs(at).isSame(dayjs(prevAt), "day")) set.add(m.id);
      prev = m;
    });
    return set;
  }, [messages]);
  const nameFor = useCallback((senderId?: string) => (senderId === safeUserId ? "You" : partnerName || "Partner"), [partnerName, safeUserId]);

  const renderItem = useCallback(
    ({ item }: { item: ChatItem }) => {
      if ("type" in item && item.type === "date") {
        const label = dayjs(item.date).isSame(dayjs(), "day")
          ? "Today"
          : dayjs(item.date).isSame(dayjs().subtract(1, "day"), "day")
            ? "Yesterday"
            : dayjs(item.date).format("ddd D MMM YYYY");

        return (
          <View style={styles.dateRow}>
            <View style={styles.datePill}><Text style={styles.dateText}>{label}</Text></View>
          </View>
        );
      }

      return (
        <MessageItem
          message={item}
          isMe={item.senderId === safeUserId}
          onSwipeReply={() => { if (!item.deletedAt) { setEditingMessage(null); setReplyingTo(item); } }}
          partnerName={partnerName || ""}
          replySender={item.replyTo ? nameFor(byId.get(item.replyTo.id)?.senderId) : undefined}
          continued={continuedIds.has(item.id)}
          onLongPress={() => { if (!item.deletedAt) setSelectedMessage(item); }}
          onReact={() => { if (!item.deletedAt) setSelectedMessage(item); }}
          formatTime={() => formatTime(item)}
          getSeenText={() => getSeenText(item)}
          isPickerVisible={false}
        />
      );
    },
    [safeUserId, formatTime, getSeenText, partnerName, nameFor, byId, continuedIds, styles],
  );

  if (loading)
    return <ScreenBackground style={{ alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={t.accent} /></ScreenBackground>;
  if (!safePairId || !safeUserId) return null;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/Home"));

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" onPress={goBack} hitSlop={12} style={styles.headerButton}>
            <ArrowLeft color={t.text} size={22} />
          </Pressable>
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarText}>{(partnerName || "P").slice(0, 1).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.headerCopy}>
            <Text style={styles.headerName} numberOfLines={1}>{partnerName || "My person"}</Text>
            <View style={styles.privateRow}><LockKeyhole color={t.textMuted} size={11} /><Text style={styles.headerStatus}>Private to you two</Text></View>
          </View>
        </View>
        <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
          {invertedMessagesWithDates.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💌</Text>
              <Text style={styles.emptyTitle}>Say hello to {partnerName || "your person"}</Text>
              <Text style={styles.emptyBody}>Everything here stays between the two of you.</Text>
            </View>
          ) : (
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
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 14 }}
            />
          )}

          <ChatInput
            text={text}
            setText={setText}
            sending={sending}
            replyingTo={replyingTo}
            replyingToName={replyingTo ? nameFor(replyingTo.senderId) : undefined}
            editingMessage={editingMessage}
            onCancelReply={() => setReplyingTo(null)}
            onCancelEdit={() => { setEditingMessage(null); setText(""); }}
            onSend={sendMessage}
            onPickImage={() => {}}
          />

          <Modal visible={selectedMessage !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedMessage(null)}>
            <EmojiPicker
              preview={selectedMessage?.text}
              current={selectedMessage?.reactions?.[safeUserId]}
              onSelect={handleAddReaction}
              onClose={() => setSelectedMessage(null)}
              onReply={() => { if (selectedMessage) { setEditingMessage(null); setReplyingTo(selectedMessage); } setSelectedMessage(null); }}
              onCopy={() => { if (selectedMessage?.text) void Clipboard.setStringAsync(selectedMessage.text); void Haptics.selectionAsync(); setSelectedMessage(null); }}
              canManage={selectedMessage?.senderId === safeUserId && !selectedMessage?.deletedAt}
              onEdit={beginEdit}
              onDelete={confirmDelete}
            />
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 10, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: t.border },
  headerButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerCopy: { flex: 1 },
  headerName: { color: t.text, fontSize: 17, fontWeight: "800" },
  privateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerStatus: { color: t.textMuted, fontSize: 12 },
  chatArea: { flex: 1 },
  dateRow: { alignItems: "center", marginVertical: 14 },
  datePill: { backgroundColor: t.surfaceSunken, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  dateText: { color: t.textSecondary, fontSize: 11.5, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: t.text, fontSize: 19, fontWeight: "800", marginTop: 12, textAlign: "center" },
  emptyBody: { color: t.textSecondary, fontSize: 14, marginTop: 6, textAlign: "center" },
}));
