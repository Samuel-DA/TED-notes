import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cardShadow, palette } from "@/constants/design";
import AppHeader from "@/components/AppHeader";

export function CarePage({ eyebrow, title, subtitle, icon, children, back = true }: { eyebrow: string; title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[palette.ink, "#34203D", "#6A315C"]} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 16, paddingBottom: 120 }}>
        <AppHeader back={back} eyebrow={eyebrow} title={title} subtitle={subtitle} icon={icon} />
        {children}
      </ScrollView>
    </LinearGradient>
  );
}

export function CareCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <View style={styles.card}><BlurView intensity={42} tint="light" style={StyleSheet.absoluteFill} />{(title || subtitle) && <View style={styles.cardHead}>{icon && <View style={styles.cardIcon}>{icon}</View>}<View style={{ flex: 1 }}><Text style={styles.cardTitle}>{title}</Text>{subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}</View></View>}{children}</View>;
}

export const careStyles = StyleSheet.create({
  input: { minHeight: 50, backgroundColor: "#F8F5F8", borderRadius: 16, paddingHorizontal: 15, color: palette.text, marginBottom: 9, borderWidth: 1, borderColor: palette.line, fontSize: 14 },
  primaryButton: { minHeight: 50, borderRadius: 16, backgroundColor: palette.rose, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  secondaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: "#F1E7F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryText: { color: palette.plum, fontWeight: "900", fontSize: 13 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: { backgroundColor: "rgba(255,255,255,0.78)", borderRadius: 24, padding: 17, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.66)", overflow: "hidden", ...cardShadow },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  cardIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#F6ECF5", alignItems: "center", justifyContent: "center" },
  cardTitle: { color: palette.text, fontSize: 17, fontWeight: "900" },
  cardSubtitle: { color: palette.muted, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});
