import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

interface PrayerCardProps {
  prayerPoint: { text: string; reference: string } | null;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  iPrayed: boolean;
  partnerPrayed: boolean;
  partnerName: string;
  onToggle: () => void;
}

export default function PrayerCard({
  prayerPoint,
  scaleAnim,
  fadeAnim,
  iPrayed,
  partnerPrayed,
  partnerName,
  onToggle,
}: PrayerCardProps) {
  if (!prayerPoint) return null;

  return (
    <Animated.View
      style={{
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", opacity: 0.9, marginBottom: 6 }}>
        🙏 Prayer Point of the Day
      </Text>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500", lineHeight: 22, marginBottom: 6 }}>
        "{prayerPoint.text}"
      </Text>
      <Text style={{ color: "#ffe4e6", fontSize: 13, fontWeight: "600", textAlign: "right", marginBottom: 12 }}>
        — {prayerPoint.reference}
      </Text>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 8 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <TouchableOpacity 
          onPress={onToggle}
          activeOpacity={0.7}
          style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            backgroundColor: iPrayed ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.15)", 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: 12 
          }}
        >
          <CheckCircle2 size={16} color={iPrayed ? "#4ade80" : "#fff"} fill={iPrayed ? "rgba(34, 197, 94, 0.2)" : "transparent"} style={{ marginRight: 6 }} />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
            {iPrayed ? "I Prayed" : "Mark as Prayed"}
          </Text>
        </TouchableOpacity>
        
        {partnerPrayed && (
          <Text style={{ color: "#ffe4e6", fontSize: 12, fontWeight: "600", fontStyle: "italic" }}>
            ✓ {partnerName || "Partner"} prayed
          </Text>
        )}
      </View>
    </Animated.View>
  );
}