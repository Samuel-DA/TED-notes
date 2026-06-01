import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

const { width, height } = Dimensions.get("window");

const BUTTON_SIZE = 60;
const STORAGE_KEY = "@floating_chat_position";

const HEADER_HEIGHT = 56;
const TAB_BAR_HEIGHT = 80;
const SIDE_PADDING = 16;

type Position = { x: number; y: number };

export default function FloatingChatButton() {
  const router = useRouter();

  const x = useSharedValue(width - BUTTON_SIZE - SIDE_PADDING);
  const y = useSharedValue(height - TAB_BAR_HEIGHT - BUTTON_SIZE - 16);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const unreadCount = useUnreadMessages();

  // Load saved position
  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const pos: Position = JSON.parse(json);
        x.value = pos.x;
        y.value = pos.y;
      }
    })();
  }, []);

  const savePosition = (pos: Position) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      const nextX = startX.value + e.translationX;
      const nextY = startY.value + e.translationY;

      x.value = Math.min(
        Math.max(nextX, SIDE_PADDING),
        width - BUTTON_SIZE - SIDE_PADDING,
      );

      y.value = Math.min(
        Math.max(nextY, HEADER_HEIGHT),
        height - TAB_BAR_HEIGHT - BUTTON_SIZE,
      );
    })
    .onEnd(() => {
      runOnJS(savePosition)({ x: x.value, y: y.value });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(x.value, { damping: 15 }) },
      { translateY: withSpring(y.value, { damping: 15 }) },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={() => router.push("/(tabs)/chat")}
          style={styles.button}
        >
          <Text style={styles.text}>💬</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    fontSize: 28,
  },
  badge: {
  position: "absolute",
  top: -4,
  right: -4,
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: "#ef4444",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
},
badgeText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "700",
},
});
