import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Reply } from "lucide-react-native";
import { Message } from "@/types/chat";

type Props = {
  message: Message;
  isMe: boolean;
  partnerName: string;
  onSwipeReply: () => void;
  onLongPress: () => void;
  onReact: () => void;
  formatTime: () => string;
  getSeenText: () => string;
  isPickerVisible: boolean;
};

const SWIPE_THRESHOLD = 60;

export function MessageItem({
  message,
  isMe,
  partnerName,
  onSwipeReply,
  onLongPress,
  formatTime,
  getSeenText,
}: Props) {
  const reactionEntries = message.reactions ? Object.entries(message.reactions) : [];
  const translateX = useSharedValue(0);

  // v3 Pan Configuration 
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) 
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(onSwipeReply)();
      }
      translateX.value = withSpring(0, { damping: 15 });
    });

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => {
    const opacity = translateX.value > 20 ? withSpring(1) : withSpring(0);
    const scale = translateX.value > SWIPE_THRESHOLD ? withSpring(1.2) : withSpring(1);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.rowOuterBounds}>
      {/* Hidden Action Indicator */}
      <Animated.View style={[styles.hiddenSwipeIndicator, animatedIconStyle]}>
        <View style={styles.replyIconCircle}>
          <Reply size={16} color="#4f46e5" />
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.messageWrapperRow,
            isMe ? styles.alignRight : styles.alignLeft,
            animatedBubbleStyle,
          ]}
        >
          {/* Dynamic Modern Speech Tails via CSS Layout Triangles */}
          {!isMe && <View style={[styles.tail, styles.tailPartner, message.deletedAt && styles.tailDeletedPartner]} />}

          <View style={styles.bubbleContainerZone}>
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePartner, message.deletedAt && styles.bubbleDeleted]}>
              {message.replyTo && (
                <View style={styles.nestedReplyBox}>
                  <Text style={styles.replyHeaderName}>{isMe ? "You" : partnerName}</Text>
                  <Text style={styles.replyBodySnippet} numberOfLines={2}>
                    {message.replyTo.text}
                  </Text>
                </View>
              )}

              {/* Long press listener attached natively inside text block wrappers */}
              <Text
                onLongPress={onLongPress}
                style={[styles.messageText, isMe ? styles.textMe : styles.textPartner, message.deletedAt && styles.textDeleted]}
              >
                {message.deletedAt ? "This message was deleted" : message.text}
              </Text>

              <View style={styles.metaDataFooterRow}>
                <Text style={[styles.timeText, isMe && styles.metaMe, message.deletedAt && styles.deletedMeta]}>{formatTime()}</Text>
                {!!message.editedAt && !message.deletedAt && <Text style={[styles.editedText, isMe && styles.metaMe]}> · edited</Text>}
                {isMe && getSeenText() !== "" && (
                  <Text style={styles.seenReceiptText}> ✓✓</Text>
                )}
              </View>
            </View>

            {/* Reactions Layer */}
            {reactionEntries.length > 0 && (
              <View style={[styles.reactionsBadgeWrapper, isMe ? styles.reactionRight : styles.reactionLeft]}>
                {reactionEntries.map(([userId, emoji]) => (
                  <Text key={userId} style={styles.singleReactionEmoji}>
                    {emoji}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {isMe && <View style={[styles.tail, styles.tailMe, message.deletedAt && styles.tailDeletedMe]} />}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  rowOuterBounds: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
  },
  hiddenSwipeIndicator: {
    position: "absolute",
    left: 16,
    alignSelf: "center",
  },
  replyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(79, 70, 229, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  messageWrapperRow: {
    flexDirection: "row",
    marginVertical: 4,
    maxWidth: "85%",
    alignItems: "flex-end",
  },
  alignRight: {
    alignSelf: "flex-end",
  },
  alignLeft: {
    alignSelf: "flex-start",
  },
  bubbleContainerZone: {
    position: "relative",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 90,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleMe: {
    backgroundColor: "#d9fdd3",
    borderBottomRightRadius: 0, 
  },
  bubblePartner: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 0,
  },
  bubbleDeleted: { backgroundColor: "#E9EDEF", elevation: 0, shadowOpacity: 0 },
  tail: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderTopWidth: 0,
    borderBottomWidth: 10,
    bottom: 0,
    zIndex: 2,
  },
  tailMe: {
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderLeftColor: "#d9fdd3",
    borderBottomColor: "transparent",
    marginLeft: -4,
  },
  tailDeletedMe: { borderLeftColor: "#E9EDEF" },
  tailDeletedPartner: { borderRightColor: "#E9EDEF" },
  tailPartner: {
    borderLeftWidth: 0,
    borderRightWidth: 10,
    borderRightColor: "#ffffff",
    borderBottomColor: "transparent",
    marginRight: -4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
    color: "#111b21",
  },
  editedText: { fontSize: 9.5, color: "#667781", fontStyle: "italic" },
  textMe: { color: "#111b21" },
  textPartner: {
    color: "#111b21",
  },
  textDeleted: { color: "#667781", fontStyle: "italic" },
  deletedMeta: { color: "#86939A" },
  metaDataFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
    alignSelf: "flex-end",
  },
  timeText: {
    fontSize: 10,
    color: "#667781",
  },
  metaMe: { color: "#667781" },
  seenReceiptText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#53bdeb",
    marginLeft: 3,
  },
  nestedReplyBox: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderLeftWidth: 3,
    borderLeftColor: "#00a884",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  replyHeaderName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#008069",
    marginBottom: 1,
  },
  replyBodySnippet: {
    fontSize: 13,
    color: "#4a5568",
  },
  reactionsBadgeWrapper: {
    position: "absolute",
    bottom: -10,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  reactionRight: {
    right: 14,
  },
  reactionLeft: {
    left: 14,
  },
  singleReactionEmoji: {
    fontSize: 13,
  },
});
