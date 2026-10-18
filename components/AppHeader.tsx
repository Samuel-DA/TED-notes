import { auth } from "@/firebase";
import { BlurView } from "expo-blur";
import { Href, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { ArrowLeft, BookOpen, CalendarDays, ClipboardCheck, LogOut, Menu } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  back?: boolean;
  onIconPress?: () => void;
  iconAccessibilityLabel?: string;
};

const NAV_ITEMS: { label: string; href: Href; icon: React.ComponentType<{ color: string; size: number }> }[] = [
  { label: "Period checker", href: "/(tabs)/Care/period", icon: CalendarDays },
  { label: "Daily routines", href: "/(tabs)/Care/routine", icon: ClipboardCheck },
  { label: "Knowledge & facts", href: "/(tabs)/Care/facts", icon: BookOpen },
];

export default function AppHeader({ eyebrow, title, subtitle, icon, back = false, onIconPress, iconAccessibilityLabel }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: Href) => {
    setMenuOpen(false);
    router.push(href);
  };

  const confirmSignOut = () => Alert.alert("Sign out?", "You’ll need to sign in again to return to your shared space.", [
    { text: "Cancel", style: "cancel" },
    { text: "Sign out", style: "destructive", onPress: () => void signOut(auth) },
  ]);

  return (
    <>
      <View style={styles.shell}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityLabel={back ? "Back" : "Open menu"}
          onPress={() => back ? router.back() : setMenuOpen(true)}
          style={styles.action}
        >
          {back ? <ArrowLeft color="#fff" size={21} /> : <Menu color="#fff" size={21} />}
        </Pressable>
        {onIconPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={iconAccessibilityLabel || "Header action"}
            hitSlop={8}
            onPress={onIconPress}
            style={({ pressed }) => [styles.icon, styles.pressableIcon, pressed && styles.iconPressed]}
          >
            {icon}
          </Pressable>
        ) : <View style={styles.icon}>{icon}</View>}
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
        </View>
        <Pressable accessibilityLabel="Sign out" onPress={confirmSignOut} style={styles.action}>
          <LogOut color="#fff" size={20} />
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.menuTitle}>TED Space</Text>
            <Text style={styles.menuSubtitle}>Your care shortcuts</Text>
            <View style={styles.menuGrid}>
              {NAV_ITEMS.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Pressable key={item.label} onPress={() => go(item.href)} style={styles.menuItem}>
                    <View style={styles.menuIcon}><ItemIcon color="#693C71" size={20} /></View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shell: { minHeight: 96, borderRadius: 28, overflow: "hidden", padding: 13, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, backgroundColor: "rgba(22,18,31,0.82)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", shadowColor: "#1A1020", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 8 },
  action: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  icon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,93,117,0.88)" },
  pressableIcon: { borderWidth: 1, borderColor: "rgba(255,255,255,0.34)", shadowColor: "#E85D75", shadowOpacity: 0.45, shadowRadius: 10, elevation: 5 },
  iconPressed: { transform: [{ scale: 0.9 }], opacity: 0.72 },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#F9A8D4", fontSize: 8.5, fontWeight: "900", letterSpacing: 1.45 },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: -0.4, marginTop: 2 },
  subtitle: { color: "#D8C9DF", fontSize: 10.5, lineHeight: 14, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: "rgba(15,10,18,0.52)", justifyContent: "flex-end", padding: 14 },
  sheet: { backgroundColor: "rgba(255,252,253,0.98)", borderRadius: 30, padding: 20, paddingBottom: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: "#DDD2DF", alignSelf: "center", marginBottom: 18 },
  menuTitle: { color: "#211A2C", fontSize: 23, fontWeight: "900" },
  menuSubtitle: { color: "#766D80", fontSize: 12, marginTop: 3, marginBottom: 16 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  menuItem: { width: "31%", flexGrow: 1, minHeight: 82, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F5EFF6", gap: 7 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  menuLabel: { color: "#35283C", fontSize: 11, fontWeight: "900" },
});
