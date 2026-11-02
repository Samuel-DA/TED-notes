import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import { ArrowLeft, Bell, BookOpen, CalendarDays, CalendarHeart, ClipboardCheck, HeartHandshake, Menu, Mic, Settings } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { IconButton, Sheet, type IconType } from "@/components/ui/kit";
import { type as typo } from "@/constants/tokens";
import { useApp } from "@/context/AppContext";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  back?: boolean;
  onIconPress?: () => void;
  iconAccessibilityLabel?: string;
  /** Extra element shown on the right of the title row (replaces the icon). */
  right?: React.ReactNode;
};

const NAV_ITEMS: { label: string; href: Href; icon: IconType; tone: "accent" | "violet" | "success" | "warning" | "info" }[] = [
  { label: "Period tracker", href: "/(tabs)/Care/period", icon: CalendarDays, tone: "accent" },
  { label: "Routines", href: "/(tabs)/Care/routine", icon: ClipboardCheck, tone: "success" },
  { label: "Support", href: "/(tabs)/Care/support", icon: HeartHandshake, tone: "accent" },
  { label: "Dates", href: "/(tabs)/Care/dates", icon: CalendarHeart, tone: "violet" },
  { label: "Voice notes", href: "/(tabs)/Care/voice", icon: Mic, tone: "info" },
  { label: "Facts", href: "/(tabs)/Care/facts", icon: BookOpen, tone: "warning" },
];

export default function AppHeader({ eyebrow, title, subtitle, icon, back = false, onIconPress, iconAccessibilityLabel, right }: Props) {
  const router = useRouter();
  const t = useTheme();
  const s = useStyles();
  const { pairId, uid, partnerName } = useApp();
  const { unreadCount } = useNotificationCenter(pairId, uid);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: Href) => { setMenuOpen(false); router.push(href); };
  const tones = {
    accent: [t.accentSoft, t.accentText], violet: [t.violetSoft, t.violetText], success: [t.successSoft, t.successText],
    warning: [t.warningSoft, t.warningText], info: [t.infoSoft, t.infoText],
  } as const;

  return (
    <>
      <View style={s.shell}>
        <View style={s.utilityRow}>
          <IconButton icon={back ? ArrowLeft : Menu} label={back ? "Back" : "Open menu"} onPress={() => (back ? router.back() : setMenuOpen(true))} />
          <Text style={s.eyebrow} numberOfLines={1}>{eyebrow}</Text>
          <View style={s.rightActions}>
            <IconButton icon={Bell} label="Notifications" badge={unreadCount} onPress={() => router.push("/notifications" as Href)} />
            <IconButton icon={Settings} label="Settings" onPress={() => router.push("/settings" as Href)} />
          </View>
        </View>
        <View style={s.heroRow}>
          <View style={s.copy}>
            <Text style={s.title} numberOfLines={2}>{title}</Text>
            {!!subtitle && <Text style={s.subtitle} numberOfLines={3}>{subtitle}</Text>}
          </View>
          {right ?? (icon ? (
            onIconPress ? (
              <Pressable accessibilityRole="button" accessibilityLabel={iconAccessibilityLabel || "Header action"} hitSlop={8} onPress={onIconPress} style={({ pressed }) => [s.icon, pressed && { transform: [{ scale: 0.92 }] }]}>
                <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.iconFill} />
                {icon}
              </Pressable>
            ) : (
              <View style={s.icon}>
                <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.iconFill} />
                {icon}
              </View>
            )
          ) : null)}
        </View>
      </View>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} eyebrow="TED SPACE" title="Care shortcuts">
        <Text style={s.menuSubtitle}>{partnerName ? `Tools for you and ${partnerName}.` : "Your shared tools."}</Text>
        <View style={s.menuGrid}>
          {NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            const [bg, fg] = tones[item.tone];
            return (
              <Pressable key={item.label} onPress={() => go(item.href)} style={({ pressed }) => [s.menuItem, pressed && { backgroundColor: t.surfacePressed }]}>
                <View style={[s.menuIcon, { backgroundColor: bg }]}><ItemIcon color={fg} size={20} /></View>
                <Text style={s.menuLabel} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  shell: { marginBottom: 18 },
  utilityRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10 },
  rightActions: { flexDirection: "row", gap: 8 },
  eyebrow: { flex: 1, color: t.textMuted, ...typo.caption },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 14 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: t.text, ...typo.display },
  subtitle: { color: t.textSecondary, fontSize: 14.5, lineHeight: 20, marginTop: 6, fontWeight: "500" },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", ...t.shadow },
  iconFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 },
  menuSubtitle: { color: t.textSecondary, fontSize: 14, marginBottom: 16 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 6 },
  menuItem: { width: "31%", flexGrow: 1, minHeight: 92, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  menuLabel: { color: t.text, fontSize: 12.5, fontWeight: "700" },
}));
