import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Keyboard, LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme } from "@/hooks/useTheme";

const BAR_HEIGHT = 64;
const INSET = 6;
const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

/** Gap between the bar and the screen edge — tucks slightly into the system nav/home-indicator area. */
const bottomGap = (insetBottom: number) => Math.max(insetBottom - 8, 6);

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** Space the floating tab bar occupies at the bottom of the screen (0 while the keyboard is open). */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  return keyboardVisible ? 0 : 8 + BAR_HEIGHT + bottomGap(insets.bottom);
}

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];
type TabOptions = BottomTabBarProps["descriptors"][string]["options"];

export default function SleekTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const t = useTheme();
  const styles = useStyles();
  const keyboardVisible = useKeyboardVisible();

  const routes = state.routes;
  const activeKey = routes[state.index]?.key;
  const activeIndex = state.index;
  const tabWidth = routes.length ? (barWidth - INSET * 2) / routes.length : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = barWidth ? withSpring(activeIndex * tabWidth, SPRING) : 0;
  }, [activeIndex, tabWidth, barWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const activeOptions = descriptors[activeKey]?.options;
  const flat = StyleSheet.flatten(activeOptions?.tabBarStyle) as { display?: string } | undefined;
  if (flat?.display === "none" || keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottomGap(insets.bottom) }]}>
      <View style={styles.bar} onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}>
        <LinearGradient
          colors={t.mode === "dark" ? ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)"] : ["rgba(255,255,255,0)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {tabWidth > 0 && (
          <Animated.View pointerEvents="none" style={[styles.indicator, { width: tabWidth }, indicatorStyle]}>
            <LinearGradient
              colors={t.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicatorFill}
            />
          </Animated.View>
        )}
        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === activeKey;
          const label =
            typeof options.tabBarLabel === "string" ? options.tabBarLabel : options.title ?? route.name;
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              void Haptics.selectionAsync();
              navigateToTab(route.key);
            }
          };
          const onLongPress = () => emitter.emit({ type: "tabLongPress", target: route.key });
          return (
            <TabButton
              key={route.key}
              focused={focused}
              label={label}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              icon={options.tabBarIcon}
            />
          );
        })}
      </View>
    </View>
  );
}

type TabButtonProps = {
  focused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
  icon: TabOptions["tabBarIcon"];
};

function TabButton({ focused, label, onPress, onLongPress, accessibilityLabel, icon }: TabButtonProps) {
  const t = useTheme();
  const styles = useStyles();
  const progress = useSharedValue(focused ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, progress]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [7, 0]) },
      { scale: 1 - pressed.value * 0.08 },
    ],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [4, 0]) }],
  }));

  const color = focused ? "#FFFFFF" : t.textMuted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => (pressed.value = withTiming(1, { duration: 90 }))}
      onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
      style={styles.tab}
      hitSlop={4}
    >
      <Animated.View style={[styles.tabContent, contentStyle]}>
        {icon?.({ focused, color, size: 22 })}
        <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: INSET,
    overflow: "hidden",
    backgroundColor: t.surfaceRaised,
    borderWidth: t.mode === "dark" ? StyleSheet.hairlineWidth : 1,
    borderColor: t.mode === "dark" ? "rgba(255,255,255,0.14)" : t.border,
    ...t.shadowLg,
  },
  indicator: {
    position: "absolute",
    left: INSET,
    top: INSET,
    bottom: INSET,
    paddingHorizontal: 3,
  },
  indicatorFill: {
    flex: 1,
    borderRadius: (BAR_HEIGHT - INSET * 2) / 2,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
}));
