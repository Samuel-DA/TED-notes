// components/chat/MessageTail.tsx
import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  isMe: boolean;
  color?: string;
}

export function MessageTail({ isMe, color }: Props) {
  const tailColor = color ?? (isMe ? "#6366f1" : "#e5e7eb");

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.rightContainer : styles.leftContainer,
      ]}
    >
      <View
        style={[
          styles.tail,
          {
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: isMe ? tailColor : "transparent",
            borderRightColor: !isMe ? tailColor : "transparent",
          },
        ]}
      />
    </View>
  );
}

const TAIL_WIDTH = 6;
const TAIL_HEIGHT = 10;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0, // attach to bubble bottom
    width: TAIL_WIDTH,
    height: TAIL_HEIGHT,
    overflow: "hidden",
  },
  rightContainer: {
    right: -TAIL_WIDTH / 2,
  },
  leftContainer: {
    left: -TAIL_WIDTH / 2,
  },
  tail: {
    width: 0,
    height: 0,
    borderTopWidth: TAIL_HEIGHT / 2,
    borderBottomWidth: TAIL_HEIGHT / 2,
    borderLeftWidth: TAIL_WIDTH,
    borderRightWidth: TAIL_WIDTH,
  },
});