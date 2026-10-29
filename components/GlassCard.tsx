import React, { useRef } from "react";
import { glass, radii } from "@/constants/design";
import { Animated, Pressable, StyleSheet, ViewStyle, View } from "react-native";
import * as Haptics from "expo-haptics";

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function GlassCard({ children, onPress, style }: GlassCardProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleValue, {
        toValue: 0.97,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  };

  const CardBody = (
    <View style={[styles.glass, style]}>
      {/* Ambient Top Light Rim Highlight */}
      <View style={styles.topHighlight} />
      {children}
    </View>
  );

  if (!onPress) {
    return CardBody;
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {CardBody}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glass: {
    ...glass,
    borderRadius: radii.medium,
    padding: 17,
    overflow: "hidden",
    shadowColor: "#0D0710",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
});
