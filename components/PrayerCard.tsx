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
  compact?: boolean;
}

export default function PrayerCard({
  prayerPoint,
  scaleAnim,
  fadeAnim,
  iPrayed,
  partnerPrayed,
  partnerName,
  onToggle,
  compact = false,
}: PrayerCardProps) {
  if (!prayerPoint) return null;

  return (
    <Animated.View
      style={{
        marginBottom: compact ? 0 : 16,
        flex: compact ? 1 : undefined,
        padding: compact ? 13 : 16,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.13)",
      }}
    >
      <Text style={{ color: "#fff", fontSize: compact ? 13 : 15, fontWeight: "800", opacity: 0.9, marginBottom: 6 }}>
        {compact ? "🙏 PRAYER" : "🙏 Prayer Point of the Day"}
      </Text>
      <Text numberOfLines={compact ? 6 : undefined} style={{ color: "#fff", fontSize: compact ? 14 : 16, fontWeight: "500", lineHeight: compact ? 20 : 22, marginBottom: 6 }}>
        {`“${prayerPoint.text}”`}
      </Text>
      <Text numberOfLines={1} style={{ color: "#ffe4e6", fontSize: compact ? 11 : 13, fontWeight: "600", textAlign: "right", marginBottom: compact ? 7 : 12 }}>
        — {prayerPoint.reference}
      </Text>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 8 }} />
      <View style={{ flexDirection: compact ? "column" : "row", justifyContent: "space-between", alignItems: compact ? "stretch" : "center", marginTop: 4, gap: 7 }}>
        <TouchableOpacity 
          onPress={onToggle}
          activeOpacity={0.7}
          style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            backgroundColor: iPrayed ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.15)", 
            paddingHorizontal: compact ? 8 : 12,
            paddingVertical: 7,
            borderRadius: 10,
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={16} color={iPrayed ? "#4ade80" : "#fff"} fill={iPrayed ? "rgba(34, 197, 94, 0.2)" : "transparent"} style={{ marginRight: 6 }} />
          <Text style={{ color: "#fff", fontSize: compact ? 13.5 : 13, fontWeight: "700" }}>
            {iPrayed ? "Prayed" : compact ? "I prayed" : "Mark as Prayed"}
          </Text>
        </TouchableOpacity>
        
        {partnerPrayed && (
          <Text style={{ color: "#ffe4e6", fontSize: compact ? 12.5 : 12, fontWeight: "600", fontStyle: "italic" }}>
            ✓ {partnerName} prayed
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
