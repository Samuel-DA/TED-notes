import { Href, useRouter } from "expo-router";
import { Bell, BookOpen, CalendarHeart, ClipboardCheck, Droplets, Gamepad2, HeartHandshake, House, ListChecks, MessageCircle, Mic, Trash2, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { Button, EmptyState, SectionHeader, Screen, type IconType } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { InAppNotification, useNotificationCenter } from "@/hooks/useNotificationCenter";
import { makeStyles, useTheme } from "@/hooks/useTheme";

const ROUTES: Record<string, { href: Href; icon: IconType; tone: "accent" | "violet" | "success" | "warning" | "info" }> = {
  home: { href: "/(tabs)/Home", icon: House, tone: "accent" },
  chat: { href: "/chat", icon: MessageCircle, tone: "info" },
  plans: { href: "/(tabs)/TED_todos", icon: ListChecks, tone: "violet" },
  care: { href: "/(tabs)/Care", icon: HeartHandshake, tone: "accent" },
  care_support: { href: "/(tabs)/Care/support", icon: HeartHandshake, tone: "accent" },
  care_dates: { href: "/(tabs)/Care/dates", icon: CalendarHeart, tone: "violet" },
  care_period: { href: "/(tabs)/Care/period", icon: Droplets, tone: "accent" },
  care_routine: { href: "/(tabs)/Care/routine" as Href, icon: ClipboardCheck, tone: "success" },
  care_voice: { href: "/(tabs)/Care/voice", icon: Mic, tone: "info" },
  games: { href: "/(tabs)/Games", icon: Gamepad2, tone: "warning" },
  facts: { href: "/(tabs)/Care/facts", icon: BookOpen, tone: "warning" },
};

function timeLabel(item: InAppNotification) {
  const date = item.createdAt?.toDate?.();
  if (!date) return "Just now";
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const isToday = (item: InAppNotification) => {
  const d = item.createdAt?.toDate?.();
  if (!d) return true;
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

export default function NotificationsPage() {
  const { pairId, uid, partnerName } = useApp();
  const { items, unreadCount, markRead, markAllRead, clearOne, clearAll } = useNotificationCenter(pairId, uid);
  const router = useRouter();
  const t = useTheme();
  const s = useStyles();
  // Remember which items were new when the screen opened, so they stay highlighted after being marked read.
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const marking = useRef(false);

  useEffect(() => {
    if (!unreadCount || !uid) { marking.current = false; return; }
    if (marking.current) return;
    marking.current = true;
    setFreshIds((current) => {
      const next = new Set(current);
      items.forEach((item) => { if (!item.readBy?.includes(uid)) next.add(item.id); });
      return next;
    });
    void markAllRead();
  }, [items, markAllRead, uid, unreadCount]);

  const tones = { accent: [t.accentSoft, t.accentText], violet: [t.violetSoft, t.violetText], success: [t.successSoft, t.successText], warning: [t.warningSoft, t.warningText], info: [t.infoSoft, t.infoText] } as const;
  const today = useMemo(() => items.filter(isToday), [items]);
  const earlier = useMemo(() => items.filter((i) => !isToday(i)), [items]);

  const open = (item: InAppNotification) => {
    if (!item.readBy?.includes(uid || "")) void markRead(item.id).catch(console.warn);
    router.push(ROUTES[item.route]?.href || "/(tabs)/Home");
  };

  const confirmClearAll = () => Alert.alert("Clear all notifications?", "This empties your notification centre.", [
    { text: "Cancel", style: "cancel" },
    { text: "Clear all", style: "destructive", onPress: () => void clearAll().catch(console.warn) },
  ]);

  const Row = (item: InAppNotification, index: number) => {
    const route = ROUTES[item.route] ?? ROUTES.home;
    const Icon = route.icon;
    const [bg, fg] = tones[route.tone];
    const fresh = freshIds.has(item.id);
    return (
      <View key={item.id} style={[s.item, index > 0 && s.itemBorder]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => open(item)} style={({ pressed }) => [s.itemMain, pressed && { opacity: 0.7 }]}>
          <View style={[s.icon, { backgroundColor: bg }]}><Icon color={fg} size={18} /></View>
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              {fresh && <View style={s.newDot} />}
            </View>
            <Text style={s.body} numberOfLines={2}>{item.body}</Text>
            <Text style={s.time}>{timeLabel(item)}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${item.title}`} hitSlop={8} onPress={() => void clearOne(item.id).catch(console.warn)} style={s.clear}>
          <X color={t.textMuted} size={16} />
        </Pressable>
      </View>
    );
  };

  return (
    <Screen bottom="safe">
      <AppHeader back eyebrow="NOTIFICATIONS" title="What you missed" subtitle={`Messages, nudges and activity from ${partnerName || "your partner"}.`} icon={<Bell color="#fff" size={23} />} />
      {!items.length ? (
        <EmptyState icon={Bell} title="You're all caught up" body={`${partnerName || "Your partner"}'s latest activity will show up here.`} style={{ marginTop: 30 }} />
      ) : (
        <>
          {today.length > 0 && <SectionHeader title="Today" style={{ marginTop: 4 }} />}
          {today.length > 0 && <View style={s.group}>{today.map(Row)}</View>}
          {earlier.length > 0 && <SectionHeader title="Earlier" />}
          {earlier.length > 0 && <View style={s.group}>{earlier.map(Row)}</View>}
          <Button title="Clear all" icon={Trash2} variant="danger" size="sm" onPress={confirmClearAll} style={{ alignSelf: "center", marginTop: 20 }} />
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  group: { borderRadius: 22, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, overflow: "hidden", ...t.shadow },
  item: { flexDirection: "row", alignItems: "flex-start" },
  itemBorder: { borderTopWidth: 1, borderTopColor: t.border },
  itemMain: { flex: 1, flexDirection: "row", gap: 12, padding: 14, paddingRight: 4 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { color: t.text, fontSize: 15, fontWeight: "700", flexShrink: 1 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent },
  body: { color: t.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  time: { color: t.textMuted, fontSize: 11.5, fontWeight: "600", marginTop: 6 },
  clear: { width: 42, height: 56, alignItems: "center", justifyContent: "center" },
}));
