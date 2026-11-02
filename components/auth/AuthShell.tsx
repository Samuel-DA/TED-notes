import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff, Heart } from "lucide-react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TextInputProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenBackground } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

/** Branded layout shared by the sign-in, registration and pairing screens. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const t = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
          <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mark}>
            <Heart color="#fff" fill="#fff" size={28} />
          </LinearGradient>
          <Text style={s.brand}>TED Space</Text>
          <Text style={s.title}>{title}</Text>
          {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
          <View style={s.card}>{children}</View>
          {footer && <View style={s.footer}>{footer}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

export function AuthField({ label, icon: Icon, secure, ...props }: TextInputProps & { label: string; icon?: React.ComponentType<{ color?: string; size?: number }>; secure?: boolean }) {
  const t = useTheme();
  const s = useStyles();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.field, focused && { borderColor: t.accent }]}>
        {Icon && <Icon color={focused ? t.accent : t.textMuted} size={18} />}
        <TextInput
          placeholderTextColor={t.textMuted}
          selectionColor={t.accent}
          {...props}
          secureTextEntry={secure ? hidden : props.secureTextEntry}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={s.input}
        />
        {secure && (
          <Pressable accessibilityLabel={hidden ? "Show password" : "Hide password"} hitSlop={10} onPress={() => setHidden((h) => !h)}>
            {hidden ? <Eye color={t.textMuted} size={18} /> : <EyeOff color={t.textMuted} size={18} />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  content: { flexGrow: 1, paddingHorizontal: 22, alignItems: "stretch" },
  mark: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", alignSelf: "center", ...t.shadowLg },
  brand: { color: t.accentText, fontSize: 12, fontWeight: "800", letterSpacing: 1.6, textAlign: "center", marginTop: 14, textTransform: "uppercase" },
  title: { color: t.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.9, textAlign: "center", marginTop: 6 },
  subtitle: { color: t.textSecondary, fontSize: 15, lineHeight: 21, textAlign: "center", marginTop: 6, paddingHorizontal: 10 },
  card: { marginTop: 26, padding: 18, borderRadius: 28, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...t.shadow },
  footer: { marginTop: 18, alignItems: "center" },
  label: { color: t.textSecondary, fontSize: 12.5, fontWeight: "700", marginBottom: 7, marginLeft: 2 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 54, borderRadius: 16, paddingHorizontal: 14, backgroundColor: t.surfaceSunken, borderWidth: 1.5, borderColor: t.border },
  input: { flex: 1, color: t.text, fontSize: 16, paddingVertical: 12 },
}));
