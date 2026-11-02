import { Href, useRouter } from "expo-router";
import { BookOpen, CalendarHeart, ChevronRight, ClipboardCheck, Droplets, HeartHandshake, HeartPulse, Mic } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { CarePage } from "@/components/care/CareUI";
import type { IconType } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Tone = "accent" | "violet" | "success" | "warning" | "info";
const ITEMS: { href: Href; title: string; subtitle: string; icon: IconType; tone: Tone }[] = [
  { href: "/(tabs)/Care/support", title: "Support and needs", subtitle: "Wish lists and your OTISH signal", icon: HeartHandshake, tone: "accent" },
  { href: "/(tabs)/Care/routine", title: "Daily routines", subtitle: "Habits you cheer each other on", icon: ClipboardCheck, tone: "success" },
  { href: "/(tabs)/Care/period", title: "Cycle tracker", subtitle: "Shared calendar and phase guide", icon: Droplets, tone: "accent" },
  { href: "/(tabs)/Care/dates", title: "Important dates", subtitle: "Reminders for both of you", icon: CalendarHeart, tone: "violet" },
  { href: "/(tabs)/Care/voice", title: "Voice notes", subtitle: "Words they can replay", icon: Mic, tone: "info" },
  { href: "/(tabs)/Care/facts", title: "Knowledge and facts", subtitle: "Faith, civics and history", icon: BookOpen, tone: "warning" },
];

export default function CareHub() {
  const router = useRouter();
  const t = useTheme();
  const s = useStyles();
  const { partnerName } = useApp();
  const tones: Record<Tone, [string, string]> = {
    accent: [t.accentSoft, t.accentText], violet: [t.violetSoft, t.violetText], success: [t.successSoft, t.successText],
    warning: [t.warningSoft, t.warningText], info: [t.infoSoft, t.infoText],
  };
  const [featured, ...rest] = ITEMS;
  const FeaturedIcon = featured.icon;

  return (
    <CarePage back={false} eyebrow="CARE SPACE" title="Support without pressure" subtitle={`Private tools for you and ${partnerName || "your partner"}.`} icon={<HeartPulse color="#fff" size={23} />}>
      <Pressable onPress={() => router.push(featured.href)} style={({ pressed }) => [s.featured, pressed && s.pressed]}>
        <View style={[s.icon, { backgroundColor: tones.accent[0], marginBottom: 0 }]}><FeaturedIcon color={tones.accent[1]} size={24} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{featured.title}</Text>
          <Text style={s.subtitle}>{featured.subtitle}</Text>
        </View>
        <ChevronRight color={t.textMuted} size={20} />
      </Pressable>
      <View style={s.grid}>
        {rest.map((item) => {
          const Icon = item.icon;
          const [bg, fg] = tones[item.tone];
          return (
            <Pressable key={item.title} onPress={() => router.push(item.href)} style={({ pressed }) => [s.item, pressed && s.pressed]}>
              <View style={[s.icon, { backgroundColor: bg }]}><Icon color={fg} size={22} /></View>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.subtitle}>{item.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </CarePage>
  );
}

const useStyles = makeStyles((t) => ({
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  featured: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 24, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, marginBottom: 10, ...t.shadow },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  item: { width: "48%", flexGrow: 1, minHeight: 150, padding: 16, borderRadius: 24, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow },
  icon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { color: t.text, fontSize: 15.5, lineHeight: 20, fontWeight: "800" },
  subtitle: { color: t.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
}));
