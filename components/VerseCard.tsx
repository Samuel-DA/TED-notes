import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

interface VerseCardProps {
  verse: { text: string; reference: string } | null;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  iRead: boolean;
  partnerRead: boolean;
  partnerName: string;
  onToggle: () => void;
}

export default function VerseCard({
  verse,
  scaleAnim,
  fadeAnim,
  iRead,
  partnerRead,
  partnerName,
  onToggle,
}: VerseCardProps) {
  if (!verse) return null;

  return (
    <Animated.View
      style={{
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", opacity: 0.9, marginBottom: 6 }}>
        📖 Verse of the Day
      </Text>
      <Text style={{ color: "#fff", fontSize: 16, fontStyle: "italic", lineHeight: 22, marginBottom: 6 }}>
        “{verse.text}”
      </Text>
      <Text style={{ color: "#ffe4e6", fontSize: 13, fontWeight: "600", textAlign: "right", marginBottom: 12 }}>
        — {verse.reference}
      </Text>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <TouchableOpacity 
          onPress={onToggle}
          activeOpacity={0.7}
          style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            backgroundColor: iRead ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.15)", 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 12 
          }}
        >
          <CheckCircle2 size={16} color={iRead ? "#4ade80" : "#fff"} fill={iRead ? "rgba(34, 197, 94, 0.2)" : "transparent"} style={{ marginRight: 6 }} />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
            {iRead ? "Read" : "Mark as Read"}
          </Text>
        </TouchableOpacity>
        
        {partnerRead && (
          <Text style={{ color: "#ffe4e6", fontSize: 12, fontWeight: "600", fontStyle: "italic" }}>
            ✓ {partnerName || "Partner"} read this
          </Text>
        )}
      </View>
    </Animated.View>
  );
}