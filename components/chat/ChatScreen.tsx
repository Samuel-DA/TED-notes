import { ChatInput } from "@/components/chat/ChatInput";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { MessageItem } from "@/components/chat/MessageItem";
import { useApp } from "@/context/AppContext";
import { db, storage } from "@/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useE2EE } from "@/context/E2EEContext";
import PrivateChatSheet from "@/components/chat/PrivateChatSheet";
import { callsAvailable, startCall, type CallKind } from "@/services/calls";
import { notifyPartner } from "@/services/notifications";
import { ChatMedia, Message } from "@/types/chat";
import dayjs from "dayjs";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Camera, ImageIcon, LockKeyhole, Phone, Video } from "lucide-react-native";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import MediaViewer from "@/components/chat/MediaViewer";
import { pickMedia, primeCache, uploadFile } from "@/services/media";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ScreenBackground, Sheet } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type ChatItem = Message | { type: "date"; id: string; date: string };

export default function Chat() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const listRef = useRef<FlatList<ChatItem>>(null);

  // 👑 FIXED: Sourcing partnerName and myName directly from global context
  const { pairId, partnerName, partnerUid, myName } = useApp();
  const { userId, loading } = useAuthUser();

  const safePairId = pairId ?? "";
  const safeUserId = userId ?? "";

  const { messages: rawMessages, loadEarlier, hasEarlier, loadingEarlier } = useMessages(safePairId, safeUserId);
  const e2ee = useE2EE();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // Decrypt end-to-end encrypted messages for display.
  const messages = useMemo(() => rawMessages.map((m) => {
    if (!m.e2ee || m.deletedAt) return m;
    const payload = e2ee.openJson<{ t?: string; r?: string }>(m.e2ee);
    if (!payload) return { ...m, text: "🔒 Encrypted message. Restore your private chat key to read it.", locked: true };
    return { ...m, text: payload.t ?? "", ...(m.replyTo ? { replyTo: { ...m.replyTo, text: payload.r ?? m.replyTo.text } } : {}) };
  }), [rawMessages, e2ee]);
  const { partnerTyping, onType, stop: stopTyping } = useTyping(safePairId, safeUserId, partnerUid);
  const handleTextChange = useCallback((value: string) => { setText(value); onType(value); }, [onType]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Message | null>(null);
  const params = useLocalSearchParams<{ draft?: string }>();
  const draftApplied = useRef(false);

  // "Continue in chat" from Today's question pre-fills the composer once.
  useEffect(() => {
    if (draftApplied.current || typeof params.draft !== "string" || !params.draft) return;
    draftApplied.current = true;
    setText(params.draft);
  }, [params.draft]);

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

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);

    const currentText = text.trim();
    setText("");
    stopTyping();
    setReplyingTo(null);

    try {
      if (editingMessage) {
        const wasEncrypted = !!rawMessages.find((m) => m.id === editingMessage.id)?.e2ee;
        const sealedEdit = wasEncrypted ? e2ee.sealJson({ t: currentText }) : null;
        if (wasEncrypted && !sealedEdit) throw new Error("Private chat key isn't ready on this phone.");
        await updateDoc(doc(db, "pairs", safePairId, "messages", editingMessage.id), sealedEdit
          ? { text: "", e2ee: sealedEdit, editedAt: serverTimestamp() }
          : { text: currentText, editedAt: serverTimestamp() });
        setEditingMessage(null);
        return;
      }
      const replySnippet = replyingTo ? replyingTo.text || (replyingTo.media?.kind === "video" ? "🎥 Video" : "📷 Photo") : undefined;
      // Private chat: when both of you have keys, the text and reply snippet are sealed on this phone.
      const sealed = e2ee.active ? e2ee.sealJson({ t: currentText, ...(replySnippet ? { r: replySnippet } : {}) }) : null;
      await addDoc(collection(db, "pairs", safePairId, "messages"), {
        text: sealed ? "" : currentText,
        type: "text",
        senderId: safeUserId,
        createdAt: serverTimestamp(),
        localCreatedAt: Date.now(),
        readBy: [safeUserId],
        ...(sealed ? { e2ee: sealed } : {}),
        ...(replyingTo && { replyTo: { id: replyingTo.id, text: sealed ? "" : replySnippet } }),
      });

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void notifyPartner({
        pairId: safePairId,
        currentUid: safeUserId,
        route: "chat",
        action: "message_received",
        title: `${myName || "New message"} 💬`,
        body: e2ee.active ? "🔒 New private message" : currentText,
      });
    } catch (e) {
      console.error("Error in sending sequence: ", e);
      setText(currentText);
      Alert.alert("Message not sent", "Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

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

  const sendMedia = async (source: "camera" | "library") => {
    setAttachOpen(false);
    if (!safePairId || !safeUserId) return;
    try {
      // Give the sheet time to close before the system picker opens.
      await new Promise((resolve) => setTimeout(resolve, 350));
      const picked = await pickMedia(source, { allowVideo: true });
      if (!picked) return;
      const caption = text.trim();
      const replyTarget = replyingTo;
      const encrypt = e2ee.active;
      setUploadingLabel(`${encrypt ? "Encrypting and sending" : "Sending"} ${picked.kind === "video" ? "video" : "photo"}…`);
      const messageRef = doc(collection(db, "pairs", safePairId, "messages"));
      const path = `pairs/${safePairId}/chatMedia/${safeUserId}/${messageRef.id}.${picked.ext}`;
      // Private chat: the file is sealed on this phone before upload; Storage only ever holds ciphertext.
      let fileSeal: ChatMedia["e2ee"];
      await uploadFile(path, picked.uri, encrypt ? "application/octet-stream" : picked.mimeType, encrypt ? (bytes) => {
        const sealedFile = e2ee.sealBytes(bytes);
        if (!sealedFile) throw new Error("Private chat key isn't ready on this phone.");
        fileSeal = sealedFile.meta;
        return sealedFile.cipher;
      } : undefined);
      primeCache(path, picked.uri);
      const media: ChatMedia = { path, kind: picked.kind, mimeType: picked.mimeType, width: picked.width, height: picked.height, ...(picked.duration ? { duration: picked.duration } : {}), ...(fileSeal ? { e2ee: fileSeal } : {}) };
      const replySnippet = replyTarget ? replyTarget.text || (replyTarget.media?.kind === "video" ? "🎥 Video" : "📷 Photo") : undefined;
      const sealedCaption = encrypt ? e2ee.sealJson({ t: caption, ...(replySnippet ? { r: replySnippet } : {}) }) : null;
      await setDoc(messageRef, {
        text: sealedCaption ? "" : caption,
        type: picked.kind,
        media,
        senderId: safeUserId,
        createdAt: serverTimestamp(),
        localCreatedAt: Date.now(),
        readBy: [safeUserId],
        ...(sealedCaption ? { e2ee: sealedCaption } : {}),
        ...(replyTarget && { replyTo: { id: replyTarget.id, text: sealedCaption ? "" : replySnippet } }),
      });
      setText("");
      setReplyingTo(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void notifyPartner({ pairId: safePairId, currentUid: safeUserId, route: "chat", action: "message_received", title: `${myName || "New message"} 💬`, body: picked.kind === "video" ? "🎥 Sent a video" : "📷 Sent a photo" });
    } catch (error) {
      Alert.alert("Couldn't send that", error instanceof Error ? error.message : "Check your connection and try again.");
    } finally {
      setUploadingLabel(null);
    }
  };

  const confirmDelete = () => {
    if (!selectedMessage || selectedMessage.senderId !== safeUserId || selectedMessage.deletedAt) return;
    const message = selectedMessage;
    setSelectedMessage(null);
    Alert.alert("Delete message?", "It will show as deleted for both of you.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        void updateDoc(doc(db, "pairs", safePairId, "messages", message.id), { text: "", deletedAt: serverTimestamp(), ...(message.e2ee ? { e2ee: deleteField() } : {}) });
        if (message.media?.path) void deleteObject(storageRef(storage, message.media.path)).catch(() => undefined);
      } },
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
          onOpenMedia={() => setViewing(item)}
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

  const call = async (kind: CallKind) => {
    if (!callsAvailable) {
      Alert.alert("Calls need the new app build", "Voice and video calls aren't available in Expo Go. Install the latest EAS build to call.");
      return;
    }
    if (!e2ee.active) {
      // Calls reuse the private-chat keys, so both of you need it on first.
      setPrivacyOpen(true);
      return;
    }
    if (!partnerUid) return;
    try {
      const id = await startCall({ pairId: safePairId, uid: safeUserId, partnerUid, myName: myName || "Your partner", kind });
      router.push({ pathname: "/call/[id]", params: { id, kind, role: "caller" } });
    } catch {
      Alert.alert("Couldn't start the call", "Check your connection and try again.");
    }
  };

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
          <Pressable accessibilityRole="button" accessibilityLabel="Private chat settings" onPress={() => setPrivacyOpen(true)} style={styles.headerCopy}>
            <Text style={styles.headerName} numberOfLines={1}>{partnerName || "My person"}</Text>
            <View style={styles.privateRow}><LockKeyhole color={t.textMuted} size={11} /><Text style={[styles.headerStatus, partnerTyping && { color: t.accentText, fontWeight: "700" }, !partnerTyping && e2ee.active && { color: t.successText }]}>{partnerTyping ? "typing…" : e2ee.active ? "End-to-end encrypted" : "Private to you two"}</Text></View>
          </Pressable>
          <Pressable accessibilityLabel="Voice call" onPress={() => void call("audio")} hitSlop={8} style={styles.headerButton}>
            <Phone color={e2ee.active ? t.text : t.textMuted} size={20} />
          </Pressable>
          <Pressable accessibilityLabel="Video call" onPress={() => void call("video")} hitSlop={8} style={styles.headerButton}>
            <Video color={e2ee.active ? t.text : t.textMuted} size={21} />
          </Pressable>
        </View>
        <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
          {e2ee.status !== "loading" && !e2ee.active && (
            <Pressable onPress={() => setPrivacyOpen(true)} style={({ pressed }) => [styles.privacyBanner, pressed && { opacity: 0.8 }]}>
              <LockKeyhole color={t.accentText} size={16} />
              <Text style={styles.privacyBannerText}>
                {e2ee.status === "setup" ? "Turn on private chat: end-to-end encrypt your messages and photos" : e2ee.status === "restore" ? "Restore your private chat key to read encrypted messages" : `Private chat turns on once ${partnerName || "your partner"} sets it up too`}
              </Text>
            </Pressable>
          )}
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
              onEndReached={loadEarlier}
              onEndReachedThreshold={0.3}
              ListFooterComponent={hasEarlier ? (
                <View style={styles.earlier}>
                  {loadingEarlier ? <ActivityIndicator color={t.accent} /> : <Pressable onPress={loadEarlier} hitSlop={8}><Text style={styles.earlierText}>Load earlier messages</Text></Pressable>}
                </View>
              ) : invertedMessagesWithDates.length > 0 ? <Text style={styles.beginning}>The beginning of your story 💞</Text> : undefined}
              ListHeaderComponent={partnerTyping ? <View style={styles.typingBubble}><Text style={styles.typingDots}>• • •</Text></View> : undefined}
            />
          )}

          <ChatInput
            text={text}
            setText={handleTextChange}
            sending={sending}
            replyingTo={replyingTo}
            replyingToName={replyingTo ? nameFor(replyingTo.senderId) : undefined}
            editingMessage={editingMessage}
            onCancelReply={() => setReplyingTo(null)}
            onCancelEdit={() => { setEditingMessage(null); setText(""); }}
            onSend={sendMessage}
            onPickImage={() => {}}
            onAttach={() => setAttachOpen(true)}
            uploadingLabel={uploadingLabel}
          />

          <Modal visible={selectedMessage !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedMessage(null)}>
            <EmojiPicker
              preview={selectedMessage?.text || (selectedMessage?.media ? (selectedMessage.media.kind === "video" ? "🎥 Video" : "📷 Photo") : undefined)}
              current={selectedMessage?.reactions?.[safeUserId]}
              onSelect={handleAddReaction}
              onClose={() => setSelectedMessage(null)}
              onReply={() => { if (selectedMessage) { setEditingMessage(null); setReplyingTo(selectedMessage); } setSelectedMessage(null); }}
              onCopy={!selectedMessage?.text ? undefined : () => { if (selectedMessage?.text) void Clipboard.setStringAsync(selectedMessage.text); void Haptics.selectionAsync(); setSelectedMessage(null); }}
              canManage={selectedMessage?.senderId === safeUserId && !selectedMessage?.deletedAt}
              onEdit={beginEdit}
              onDelete={confirmDelete}
            />
          </Modal>
          <Sheet visible={attachOpen} onClose={() => setAttachOpen(false)} eyebrow="SHARE" title="Send a photo or video">
            <Pressable onPress={() => void sendMedia("camera")} style={({ pressed }) => [styles.attachRow, pressed && { opacity: 0.7 }]}>
              <View style={[styles.attachIcon, { backgroundColor: t.accentSoft }]}><Camera color={t.accentText} size={20} /></View>
              <View style={{ flex: 1 }}><Text style={styles.attachTitle}>Camera</Text><Text style={styles.attachBody}>Take a photo or record a video</Text></View>
            </Pressable>
            <Pressable onPress={() => void sendMedia("library")} style={({ pressed }) => [styles.attachRow, pressed && { opacity: 0.7 }]}>
              <View style={[styles.attachIcon, { backgroundColor: t.violetSoft }]}><ImageIcon color={t.violetText} size={20} /></View>
              <View style={{ flex: 1 }}><Text style={styles.attachTitle}>Photo library</Text><Text style={styles.attachBody}>Up to 15 MB photos · videos up to 2 minutes</Text></View>
            </Pressable>
            {!!text.trim() && <Text style={styles.attachHint}>Your typed message will be sent as the caption.</Text>}
          </Sheet>

          <PrivateChatSheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} partnerName={partnerName || "your partner"} />
          <MediaViewer media={viewing?.media ?? null} caption={viewing?.text} onClose={() => setViewing(null)} />
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
  attachRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  attachIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  attachTitle: { color: t.text, fontSize: 16, fontWeight: "700" },
  attachBody: { color: t.textSecondary, fontSize: 13, marginTop: 2 },
  attachHint: { color: t.textMuted, fontSize: 12.5, marginTop: 8, marginBottom: 4 },
  earlier: { alignItems: "center", paddingVertical: 14 },
  earlierText: { color: t.accentText, fontSize: 13.5, fontWeight: "700" },
  beginning: { color: t.textMuted, fontSize: 12.5, textAlign: "center", paddingVertical: 16 },
  typingBubble: { alignSelf: "flex-start", marginTop: 6, marginLeft: 2, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderBottomLeftRadius: 6, backgroundColor: t.surfaceRaised, borderWidth: t.mode === "dark" ? 0 : 1, borderColor: t.border },
  typingDots: { color: t.textMuted, fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  privacyBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 12, marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: t.accentSoft },
  privacyBannerText: { flex: 1, color: t.accentText, fontSize: 13.5, fontWeight: "700", lineHeight: 18 },
  emptyBody: { color: t.textSecondary, fontSize: 14, marginTop: 6, textAlign: "center" },
}));
