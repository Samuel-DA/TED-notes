import React, { memo, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { Message } from "@/types/chat";
import styles from "./styles";
import { MessageTail } from "./MessageTail";

const SWIPE_TRIGGER = 50;

interface Props {
  message: Message;
  isMe: boolean;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
  onSwipeReply: () => void;
  formatTime: () => string;
  getSeenText: () => string;
  isPickerVisible?: boolean;
}

function MessageItemComponent({
  message,
  isMe,
  onLongPress,
  onSwipeReply,
  formatTime,
  getSeenText,
}: Props) {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_TRIGGER) {
        runOnJS(Haptics.impactAsync)(
          Haptics.ImpactFeedbackStyle.Light
        );
        runOnJS(onSwipeReply)();
      }
      translateX.value = withSpring(0);
    });

  return (
    <View style={{ marginVertical: 6 }}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable onLongPress={onLongPress}>
            <View
              style={[
                styles.bubble,
                isMe ? styles.myBubble : styles.theirBubble,
              ]}
            >
              <Text style={styles.messageText}>
                {message.text}
              </Text>

              <View style={styles.timeSeenRow}>
                <Text style={styles.time}>
                  {formatTime()}
                </Text>
                {isMe && (
                  <Text style={styles.seen}>
                    {getSeenText()}
                  </Text>
                )}
              </View>

              <MessageTail isMe={isMe} />
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export const MessageItem = memo(MessageItemComponent);