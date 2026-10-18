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
import { MessageCircle } from "lucide-react-native";
import { palette } from "@/constants/design";

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

  // Load saved position on mount
  useEffect(() => {
    (async () => {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const pos: Position = JSON.parse(json);
        // ✅ Apply position changes smoothly on initial data mount
        x.value = withSpring(pos.x, { damping: 15 });
        y.value = withSpring(pos.y, { damping: 15 });
      }
    })();
  }, [x, y]);

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

      // ✅ Sets positions instantly (no animations) for raw 60 FPS precision dragging
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
      // 👑 Optional/Highly Recommended UX Enhancement: 
      // Snap to the closest edge (left or right side) automatically when released, like a real chat head!
      const snapLeft = SIDE_PADDING;
      const snapRight = width - BUTTON_SIZE - SIDE_PADDING;
      const finalX = x.value + (BUTTON_SIZE / 2) < width / 2 ? snapLeft : snapRight;

      // ✅ Animate the final landing positions smoothly on snap release
      x.value = withSpring(finalX, { damping: 15 });
      y.value = withSpring(y.value, { damping: 15 });

      runOnJS(savePosition)({ x: finalX, y: y.value });
    });

  // ✅ Cleaned-up Animated style targeting clean values
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={() => router.push("/(tabs)/chat")}
          style={styles.button}
        >
          <MessageCircle color="#fff" fill="rgba(255,255,255,0.16)" size={27} />
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
    // Note: Keep top: 0, left: 0 so absolute transform mappings translate 1:1 on the device window grid
    top: 0,
    left: 0,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: palette.whatsapp,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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
    borderWidth: 1.5,
    borderColor: palette.whatsapp,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
});
