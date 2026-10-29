import AppHeader from "@/components/AppHeader";
import { gradients, palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { InAppNotification, useNotificationCenter } from "@/hooks/useNotificationCenter";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import { Bell, CheckCheck, Settings, Trash2, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROUTES: Record<string, Href> = {
  home: "/(tabs)/Home",
  chat: "/chat",
  plans: "/(tabs)/TED_todos",
  care: "/(tabs)/Care",
  care_support: "/(tabs)/Care/support",
  care_dates: "/(tabs)/Care/dates",
  care_period: "/(tabs)/Care/period",
  care_routine: "/(tabs)/Care/routine" as Href,
  care_voice: "/(tabs)/Care/voice",
  games: "/(tabs)/Games",
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

export default function NotificationsPage() {
  const { pairId, uid, partnerName } = useApp();
  const { items, unreadCount, markRead, markAllRead, clearOne, clearAll } = useNotificationCenter(pairId, uid);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markingRef = useRef(false);

  useEffect(() => {
    if (!unreadCount) { markingRef.current = false; return; }
    if (markingRef.current) return;
    markingRef.current = true;
    void markAllRead();
  }, [markAllRead, unreadCount]); // mark the delivered snapshot once it is visible

  const open = (item: InAppNotification) => {
    if (!item.readBy?.includes(uid || "")) void markRead(item.id).catch(console.warn);
    router.push(ROUTES[item.route] || "/(tabs)/Home");
  };

  const confirmClearAll = () => Alert.alert(
    "Clear notifications?",
    "This removes every notification from your notification centre.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Clear all", style: "destructive", onPress: () => void clearAll().catch(console.warn) },
    ],
  );

  return (
    <LinearGradient colors={gradients.app} style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: 16, paddingBottom: 80 }}>
        <AppHeader back eyebrow="NOTIFICATION CENTRE" title="What you missed" subtitle="Messages, nudges and shared activity in one place." icon={<Bell color="#fff" size={23} />} />
        <View style={styles.actions}>
          {!!items.length && <Pressable accessibilityLabel="Clear all notifications" onPress={confirmClearAll} style={styles.clearAllButton}>
            <Trash2 color="#fff" size={16} /><Text style={styles.settingsText}>Clear all</Text>
          </Pressable>}
          <Pressable onPress={() => router.push("/settings" as Href)} style={styles.settingsButton}>
            <Settings color="#fff" size={17} /><Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </View>
        {!items.length ? (
          <View style={styles.empty}><CheckCheck color="#E8B8C8" size={38} /><Text style={styles.emptyTitle}>All caught up</Text><Text style={styles.emptyText}>{partnerName}&apos;s latest activity will appear here.</Text></View>
        ) : items.map((item) => {
          const unread = !item.readBy?.includes(uid || "");
          return <View key={item.id} style={[styles.item, unread && styles.unread]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => open(item)} style={styles.itemMain}>
              <View style={[styles.dot, !unread && styles.dotRead]} />
              <View style={{ flex: 1 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.body} numberOfLines={2}>{item.body}</Text><Text style={styles.time}>{timeLabel(item)}</Text></View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${item.title}`} hitSlop={8} onPress={() => void clearOne(item.id).catch(console.warn)} style={styles.clearButton}>
              <X color={palette.muted} size={18} />
            </Pressable>
          </View>;
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginBottom: 12 },
  settingsButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  clearAllButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: "rgba(181,68,90,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  settingsText: { color: "#fff", fontSize: 11.5, fontWeight: "900" },
  item: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, marginBottom: 10, backgroundColor: "rgba(255,255,255,0.82)", borderWidth: 1, borderColor: "rgba(255,255,255,0.46)", overflow: "hidden" },
  itemMain: { flex: 1, flexDirection: "row", gap: 12, padding: 15, paddingRight: 8 },
  clearButton: { width: 42, minHeight: 64, alignItems: "center", justifyContent: "center" },
  unread: { backgroundColor: "rgba(255,247,250,0.94)", borderColor: "rgba(181,68,90,0.38)" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.rose, marginTop: 5 },
  dotRead: { backgroundColor: "#C9BECB" },
  title: { color: palette.text, fontSize: 15, fontWeight: "700" },
  body: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  time: { color: palette.plum, fontSize: 9.5, fontWeight: "800", marginTop: 7 },
  empty: { alignItems: "center", padding: 34, marginTop: 28, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#D8C9DF", fontSize: 12, textAlign: "center", marginTop: 5 },
});
