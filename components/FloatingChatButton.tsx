import AsyncStorage from "@react-native-async-storage/async-storage";
import { Href, useRouter } from "expo-router";
import { MessageCircleHeart } from "lucide-react-native";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

const STORAGE_KEY = "ted-space-floating-chat-position-v2";
const BUTTON_SIZE = 56;
const EDGE = 14;

type Point = { x: number; y: number };

export default function FloatingChatButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const unreadCount = useUnreadMessages();
  const t = useTheme();
  const styles = useStyles();
  const initial = useMemo<Point>(() => ({
    x: Math.max(EDGE, width - BUTTON_SIZE - 18),
    y: Math.max(insets.top + EDGE, height - insets.bottom - BUTTON_SIZE - 98),
  }), [height, insets.bottom, insets.top, width]);
  const position = useRef(new Animated.ValueXY(initial)).current;
  const current = useRef<Point>(initial);
  const dragStart = useRef<Point>(initial);

  const clamp = (point: Point): Point => ({
    x: Math.max(EDGE, Math.min(point.x, width - BUTTON_SIZE - EDGE)),
    y: Math.max(insets.top + EDGE, Math.min(point.y, height - insets.bottom - BUTTON_SIZE - 88)),
  });

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (!active) return;
      let next = initial;
      if (saved) {
        try {
          next = clamp(JSON.parse(saved) as Point);
        } catch {
          next = initial;
        }
      }
      current.current = next;
      position.setValue(next);
    });
    return () => { active = false; };
  // Position is restored once; later orientation changes are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = clamp(current.current);
    current.current = next;
    position.setValue(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, insets.bottom, insets.top, width]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 7,
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 7,
    onPanResponderGrant: () => { dragStart.current = current.current; },
    onPanResponderMove: (_, gesture) => {
      const next = clamp({ x: dragStart.current.x + gesture.dx, y: dragStart.current.y + gesture.dy });
      current.current = next;
      position.setValue(next);
    },
    onPanResponderRelease: () => { void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.current)); },
    onPanResponderTerminate: () => { void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current.current)); },
  // Bounds are refreshed when the screen size changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [height, insets.bottom, insets.top, width]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.positioner, { transform: position.getTranslateTransform() }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open chat. Drag to move."
          hitSlop={8}
          onPress={() => router.push("/chat" as Href)}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: BUTTON_SIZE / 2 }]} />
          <MessageCircleHeart color="#fff" size={25} strokeWidth={2.2} />
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text></View>}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  positioner: { position: "absolute", left: 0, top: 0, width: BUTTON_SIZE, height: BUTTON_SIZE, zIndex: 50 },
  button: { width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2, justifyContent: "center", alignItems: "center", backgroundColor: t.accent, borderWidth: 2, borderColor: t.mode === "dark" ? "rgba(255,255,255,0.18)" : "#FFFFFF", ...t.shadowLg },
  buttonPressed: { transform: [{ scale: 0.94 }], opacity: 0.92 },
  badge: { position: "absolute", top: -5, right: -5, minWidth: 21, height: 21, borderRadius: 11, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: t.accent },
  badgeText: { color: t.accent, fontSize: 10, fontWeight: "900" },
}));
