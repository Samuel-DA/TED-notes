import React from "react";
import { Animated } from "react-native";
import DevotionCard from "./DevotionCard";

type Props = { prayerPoint: { text: string; reference: string } | null; scaleAnim: Animated.Value; fadeAnim: Animated.Value; iPrayed: boolean; partnerPrayed: boolean; partnerName: string; onToggle: () => void; compact?: boolean };

export default function PrayerCard({ prayerPoint, iPrayed, partnerPrayed, ...rest }: Props) {
  return <DevotionCard kind="prayer" content={prayerPoint} mine={iPrayed} partners={partnerPrayed} {...rest} />;
}
