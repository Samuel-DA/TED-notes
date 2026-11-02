import React from "react";
import { Animated } from "react-native";
import DevotionCard from "./DevotionCard";

type Props = { verse: { text: string; reference: string } | null; scaleAnim: Animated.Value; fadeAnim: Animated.Value; iRead: boolean; partnerRead: boolean; partnerName: string; onToggle: () => void; compact?: boolean };

export default function VerseCard({ verse, iRead, partnerRead, ...rest }: Props) {
  return <DevotionCard kind="verse" content={verse} mine={iRead} partners={partnerRead} {...rest} />;
}
