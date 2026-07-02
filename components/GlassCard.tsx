import React, { useRef } from "react";
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
    backgroundColor: "rgba(255, 255, 255, 0.11)",
    borderRadius: 28, // High-end hardware curve matching squircle designs
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
    shadowColor: "#c084fc", // Radiant theme accent ambient glow color
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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