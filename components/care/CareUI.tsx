import React from "react";
import { Text, View } from "react-native";
import AppHeader from "@/components/AppHeader";
import { Card, Screen } from "@/components/ui/kit";
import { radius } from "@/constants/tokens";
import { makeStyles } from "@/hooks/useTheme";

/** Standard layout for Care sub-pages: themed background, header and tab-bar-aware scrolling. */
export function CarePage({ eyebrow, title, subtitle, icon, children, back = true, bottom = "tabs" }: { eyebrow: string; title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; back?: boolean; bottom?: "tabs" | "safe" }) {
  return (
    <Screen bottom={bottom}>
      <AppHeader back={back} eyebrow={eyebrow} title={title} subtitle={subtitle} icon={icon} />
      {children}
    </Screen>
  );
}

export function CareCard({ title, subtitle, icon, children, right }: { title?: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  const s = useStyles();
  return (
    <Card style={s.card}>
      {(!!title || !!subtitle) && (
        <View style={s.head}>
          {icon && <View style={s.icon}>{icon}</View>}
          <View style={{ flex: 1 }}>
            {!!title && <Text style={s.title}>{title}</Text>}
            {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          </View>
          {right}
        </View>
      )}
      {children}
    </Card>
  );
}

/** Themed form/button styles shared by the Care pages. */
export const useCareStyles = makeStyles((t) => ({
  input: { minHeight: 52, backgroundColor: t.surfaceSunken, borderRadius: radius.md, paddingHorizontal: 16, color: t.text, marginBottom: 10, borderWidth: 1, borderColor: t.border, fontSize: 15.5 },
  primaryButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: t.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15.5 },
  secondaryButton: { minHeight: 48, borderRadius: radius.md, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryText: { color: t.text, fontWeight: "800", fontSize: 14.5 },
  muted: { color: t.textSecondary, fontSize: 14, lineHeight: 20 },
  label: { color: t.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border },
  rowTitle: { color: t.text, fontSize: 15, fontWeight: "700" },
  rowMeta: { color: t.textMuted, fontSize: 12.5, marginTop: 3 },
}));

const useStyles = makeStyles((t) => ({
  card: { marginBottom: 12, padding: 18, borderRadius: 24 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" },
  title: { color: t.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  subtitle: { color: t.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
}));
