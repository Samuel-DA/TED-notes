import { Href, useRouter } from "expo-router";
import { BookOpen, CalendarHeart, ClipboardCheck, HeartHandshake, HeartPulse, Mic, ShieldCheck } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CarePage } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";

const ITEMS = [
  { href: "/(tabs)/Care/support", title: "Emotional Support and Needs", subtitle: "Wish lists and your shared OTISH signal", icon: HeartHandshake, tint: "#FCE7F0", color: palette.rose },
  { href: "/(tabs)/Care/routine", title: "Daily routines", subtitle: "Your checklist and your partner’s progress", icon: ClipboardCheck, tint: "#E8F5F1", color: palette.whatsapp },
  { href: "/(tabs)/Care/dates", title: "Important dates", subtitle: "Appointments and meaningful reminders", icon: CalendarHeart, tint: "#F3E8FF", color: "#7C3AED" },
  { href: "/(tabs)/Care/voice", title: "Voice comfort", subtitle: "Record something they can replay", icon: Mic, tint: "#E8F5F1", color: palette.whatsapp },
  { href: "/(tabs)/Care/period", title: "Period tracker", subtitle: "A shared calendar with cycle estimates", icon: ShieldCheck, tint: "#FFF0F3", color: "#BE3455" },
  { href: "/(tabs)/Care/facts", title: "Knowledge & facts", subtitle: "Religion, politics and history", icon: BookOpen, tint: "#FFF6E8", color: "#B56A13" },
] as const;

export default function CareHub() {
  const router = useRouter();
  const { partnerName } = useApp();
  return <CarePage back={false} eyebrow="CARE SPACE" title="Support without pressure" subtitle={`Private tools for you and ${partnerName || "your partner"}.`} icon={<HeartPulse color="#fff" size={23} />}>
    <View style={styles.grid}>{ITEMS.map((item) => { const Icon = item.icon; return <Pressable key={item.href} onPress={() => router.push(item.href as Href)} style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.98 }], opacity: 0.88 }]}><View style={[styles.icon, { backgroundColor: item.tint }]}><Icon color={item.color} size={23} /></View><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemText}>{item.subtitle}</Text></Pressable>; })}</View>
  </CarePage>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, item: { width: "48%", flexGrow: 1, minHeight: 164, backgroundColor: "rgba(255,255,255,0.76)", borderRadius: 24, padding: 15, justifyContent: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.62)", shadowColor: "#130B18", shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.16, shadowRadius: 18, elevation: 4 }, icon: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 14 }, itemTitle: { color: palette.text, fontSize: 15, fontWeight: "900" }, itemText: { color: palette.muted, fontSize: 11.5, lineHeight: 16, marginTop: 5 },
});
