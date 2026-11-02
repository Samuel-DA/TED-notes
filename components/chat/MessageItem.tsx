import { LinearGradient } from "expo-linear-gradient";
import { Reply } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { Message } from "@/types/chat";

type Props = {
  message: Message;
  isMe: boolean;
  partnerName: string;
  /** Display name of the person whose message is being quoted. */
  replySender?: string;
  /** True when the previous message is from the same sender a moment earlier. */
  continued?: boolean;
  onSwipeReply: () => void;
  onLongPress: () => void;
  onReact: () => void;
  formatTime: () => string;
  getSeenText: () => string;
  isPickerVisible: boolean;
};

const SWIPE_THRESHOLD = 60;

export function MessageItem({ message, isMe, partnerName, replySender, continued, onSwipeReply, onLongPress, formatTime, getSeenText }: Props) {
  const t = useTheme();
  const s = useStyles();
  const reactions = message.reactions ? Object.entries(message.reactions) : [];
  const deleted = !!message.deletedAt;
  const seen = isMe && getSeenText() !== "";
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => { if (event.translationX > 0) translateX.value = Math.min(event.translationX, 90); })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) runOnJS(onSwipeReply)();
      translateX.value = withSpring(0, { damping: 15 });
    });

  const bubbleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 20 ? withSpring(1) : withSpring(0),
    transform: [{ scale: translateX.value > SWIPE_THRESHOLD ? withSpring(1.15) : withSpring(1) }],
  }));

  const mineGradient = isMe && !deleted;
  const textColor = mineGradient ? "#fff" : deleted ? t.textMuted : t.text;
  const metaColor = mineGradient ? "rgba(255,255,255,0.75)" : t.textMuted;

  return (
    <View style={[s.row, continued ? { marginTop: 2 } : { marginTop: 8 }, reactions.length > 0 && { marginBottom: 12 }]}>
      <Animated.View style={[s.swipeHint, iconStyle]}>
        <View style={s.swipeCircle}><Reply size={16} color={t.accentText} /></View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.wrap, isMe ? s.right : s.left, bubbleStyle]}>
          <Pressable onLongPress={onLongPress} delayLongPress={280} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
            <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem, isMe && !continued && s.tailMe, !isMe && !continued && s.tailThem, deleted && s.bubbleDeleted]}>
              {mineGradient && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
              {message.replyTo && !deleted && (
                <View style={[s.quote, mineGradient ? s.quoteMine : s.quoteThem]}>
                  <Text style={[s.quoteName, { color: mineGradient ? "#fff" : t.accentText }]}>{replySender || partnerName}</Text>
                  <Text style={[s.quoteText, { color: mineGradient ? "rgba(255,255,255,0.85)" : t.textSecondary }]} numberOfLines={2}>{message.replyTo.text || "Message"}</Text>
                </View>
              )}
              <Text style={[s.text, { color: textColor }, deleted && s.textDeleted]}>{deleted ? "This message was deleted" : message.text}</Text>
              <View style={s.meta}>
                {!!message.editedAt && !deleted && <Text style={[s.metaText, { color: metaColor }]}>edited · </Text>}
                <Text style={[s.metaText, { color: metaColor }]}>{formatTime()}</Text>
                {isMe && !deleted && <Text style={[s.ticks, { color: seen ? "#9FE7FF" : metaColor }]}>{seen ? " ✓✓" : " ✓"}</Text>}
              </View>
            </View>
          </Pressable>
          {reactions.length > 0 && (
            <View style={[s.reactions, isMe ? { right: 10 } : { left: 10 }]}>
              {reactions.map(([userId, emoji]) => <Text key={userId} style={s.reactionEmoji}>{emoji}</Text>)}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { width: "100%", justifyContent: "center" },
  swipeHint: { position: "absolute", left: 12, alignSelf: "center" },
  swipeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" },
  wrap: { maxWidth: "82%" },
  right: { alignSelf: "flex-end" },
  left: { alignSelf: "flex-start" },
  bubble: { borderRadius: 20, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 6, minWidth: 74, overflow: "hidden" },
  bubbleMe: { backgroundColor: t.accent },
  bubbleThem: { backgroundColor: t.surfaceRaised, borderWidth: t.mode === "dark" ? 0 : 1, borderColor: t.border, ...t.shadow },
  tailMe: { borderBottomRightRadius: 6 },
  tailThem: { borderBottomLeftRadius: 6 },
  bubbleDeleted: { backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, borderStyle: "dashed" },
  quote: { borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 6 },
  quoteMine: { backgroundColor: "rgba(255,255,255,0.16)", borderLeftColor: "#fff" },
  quoteThem: { backgroundColor: t.accentSoft, borderLeftColor: t.accent },
  quoteName: { fontSize: 12, fontWeight: "800", marginBottom: 1 },
  quoteText: { fontSize: 13 },
  text: { fontSize: 16, lineHeight: 22 },
  textDeleted: { fontStyle: "italic", fontSize: 14.5 },
  meta: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", marginTop: 2 },
  metaText: { fontSize: 10.5, fontWeight: "500" },
  ticks: { fontSize: 11, fontWeight: "800" },
  reactions: { position: "absolute", bottom: -13, flexDirection: "row", backgroundColor: t.surfaceRaised, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: t.border, ...t.shadow },
  reactionEmoji: { fontSize: 13 },
}));
