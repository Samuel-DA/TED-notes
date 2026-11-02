import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  type RefreshControlProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, type as typo } from "@/constants/tokens";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useTabBarSpace } from "@/components/SleekTabBar";

export type IconType = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number; fill?: string }>;

/* ---------------- Screen ---------------- */

type ScreenProps = {
  children: React.ReactNode;
  /** "tabs" leaves room for the floating tab bar; "safe" just the device inset. */
  bottom?: "tabs" | "safe" | "none";
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: "always" | "handled" | "never";
};

export function ScreenBackground({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <LinearGradient colors={t.bg} locations={[0, 0.45, 1]} style={[{ flex: 1, backgroundColor: t.bgSolid }, style]}>
      {children}
    </LinearGradient>
  );
}

export function Screen({ children, bottom = "tabs", scroll = true, padded = true, contentStyle, refreshControl, keyboardShouldPersistTaps = "handled" }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const paddingBottom = bottom === "tabs" ? tabSpace + 24 : bottom === "safe" ? insets.bottom + 24 : 0;
  const inner = [{ paddingTop: insets.top + 4, paddingHorizontal: padded ? 16 : 0, paddingBottom }, contentStyle];
  return (
    <ScreenBackground>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={keyboardShouldPersistTaps} refreshControl={refreshControl} contentContainerStyle={inner}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </ScreenBackground>
  );
}

/* ---------------- Card ---------------- */

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  /** "hero" draws the brand wash behind the content. */
  variant?: "default" | "hero" | "sunken";
  padded?: boolean;
  accessibilityLabel?: string;
};

export function Card({ children, style, onPress, onLongPress, variant = "default", padded = true, accessibilityLabel }: CardProps) {
  const s = useStyles();
  const t = useTheme();
  const body = (
    <>
      {variant === "hero" && <LinearGradient pointerEvents="none" colors={t.heroWash} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {children}
    </>
  );
  const base = [s.card, variant === "sunken" && s.cardSunken, !padded && { padding: 0 }, style];
  if (!onPress && !onLongPress) return <View style={base}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => void Haptics.selectionAsync()}
      style={({ pressed }) => [...base, pressed && s.pressed]}
    >
      {body}
    </Pressable>
  );
}

/* ---------------- Button ---------------- */

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconType;
  loading?: boolean;
  disabled?: boolean;
  size?: "md" | "sm";
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({ title, onPress, variant = "primary", icon: Icon, loading, disabled, size = "md", style, accessibilityLabel }: ButtonProps) {
  const s = useStyles();
  const t = useTheme();
  const color = variant === "primary" ? t.onAccent : variant === "danger" ? t.dangerText : t.text;
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      style={({ pressed }) => [
        s.button,
        size === "sm" && s.buttonSm,
        variant === "secondary" && s.buttonSecondary,
        variant === "ghost" && s.buttonGhost,
        variant === "danger" && s.buttonDanger,
        inactive && { opacity: 0.5 },
        pressed && s.pressed,
        style,
      ]}
    >
      {variant === "primary" && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {loading ? <ActivityIndicator color={color} /> : (
        <>
          {Icon && <Icon color={color} size={size === "sm" ? 15 : 18} />}
          <Text style={[s.buttonText, size === "sm" && s.buttonTextSm, { color }]} numberOfLines={1}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------------- Icon button ---------------- */

export function IconButton({ icon: Icon, onPress, label, variant = "default", size = 40, color, badge }: { icon: IconType; onPress?: () => void; label: string; variant?: "default" | "plain" | "accent"; size?: number; color?: string; badge?: number }) {
  const s = useStyles();
  const t = useTheme();
  const tint = color ?? (variant === "accent" ? t.onAccent : t.text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => { void Haptics.selectionAsync(); onPress?.(); }}
      style={({ pressed }) => [s.iconButton, { width: size, height: size, borderRadius: size * 0.36 }, variant === "plain" && s.iconButtonPlain, variant === "accent" && { overflow: "hidden", borderWidth: 0 }, pressed && s.pressed]}
    >
      {variant === "accent" && <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      <Icon color={tint} size={Math.round(size * 0.48)} />
      {!!badge && badge > 0 && <View style={s.badgeDot}><Text style={s.badgeDotText}>{badge > 9 ? "9+" : badge}</Text></View>}
    </Pressable>
  );
}

/* ---------------- Chip ---------------- */

export function Chip({ label, active, onPress, icon: Icon, emoji, color }: { label: string; active?: boolean; onPress?: () => void; icon?: IconType; emoji?: string; color?: string }) {
  const s = useStyles();
  const t = useTheme();
  const activeBg = color ?? t.inverse;
  const fg = active ? (color ? "#fff" : t.onInverse) : t.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => { void Haptics.selectionAsync(); onPress?.(); }}
      style={({ pressed }) => [s.chip, active && { backgroundColor: activeBg, borderColor: activeBg }, pressed && { opacity: 0.75 }]}
    >
      {Icon && <Icon color={fg} size={14} />}
      {!!emoji && <Text style={s.chipEmoji}>{emoji}</Text>}
      <Text style={[s.chipText, { color: fg }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- Badge ---------------- */

export function Badge({ label, tone = "neutral", icon: Icon }: { label: string; tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "violet" | "info"; icon?: IconType }) {
  const s = useStyles();
  const t = useTheme();
  const map = {
    neutral: [t.surfaceSunken, t.textSecondary],
    accent: [t.accentSoft, t.accentText],
    success: [t.successSoft, t.successText],
    warning: [t.warningSoft, t.warningText],
    danger: [t.dangerSoft, t.dangerText],
    violet: [t.violetSoft, t.violetText],
    info: [t.infoSoft, t.infoText],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      {Icon && <Icon color={fg} size={11} />}
      <Text style={[s.badgeText, { color: fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/* ---------------- Section header ---------------- */

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  return (
    <View style={[s.section, style]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!action && <Pressable hitSlop={8} onPress={onAction}><Text style={s.sectionAction}>{action}</Text></Pressable>}
    </View>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({ icon: Icon, title, body, actionTitle, onAction, style }: { icon: IconType; title: string; body?: string; actionTitle?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={[s.empty, style]}>
      <View style={s.emptyIcon}><Icon color={t.accentText} size={24} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!body && <Text style={s.emptyBody}>{body}</Text>}
      {!!actionTitle && <Button title={actionTitle} onPress={onAction} size="sm" style={{ marginTop: 14, alignSelf: "center", paddingHorizontal: 18 }} />}
    </View>
  );
}

/* ---------------- Field ---------------- */

export function Field({ label, style, inputStyle, ...props }: TextInputProps & { label?: string; inputStyle?: TextInputProps["style"] }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={[{ marginBottom: 12 }, style as StyleProp<ViewStyle>]}>
      {!!label && <Text style={s.fieldLabel}>{label}</Text>}
      <TextInput placeholderTextColor={t.textMuted} selectionColor={t.accent} {...props} style={[s.field, props.multiline && s.fieldMultiline, inputStyle]} />
    </View>
  );
}

/* ---------------- Segmented control ---------------- */

export function Segmented<T extends string>({ options, value, onChange, style }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (value: T) => void; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={[s.segment, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { if (!active) { void Haptics.selectionAsync(); onChange(option.value); } }} style={[s.segmentItem, active && s.segmentActive]}>
            <Text style={[s.segmentText, active && { color: t.text }]} numberOfLines={1}>{option.label}</Text>
            {option.count !== undefined && <View style={[s.segmentCount, active && { backgroundColor: t.accentSoft }]}><Text style={[s.segmentCountText, active && { color: t.accentText }]}>{option.count}</Text></View>}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Bottom sheet ---------------- */

export function Sheet({ visible, onClose, eyebrow, title, children, footer }: { visible: boolean; onClose: () => void; eyebrow?: string; title?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const s = useStyles();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[s.sheetBackdrop, { backgroundColor: t.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={s.handle} />
          {(!!title || !!eyebrow) && (
            <View style={s.sheetHead}>
              <View style={{ flex: 1 }}>
                {!!eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
                {!!title && <Text style={s.sheetTitle}>{title}</Text>}
              </View>
              <IconButton icon={X} label="Close" onPress={onClose} size={36} />
            </View>
          )}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          {footer && <View style={{ marginTop: 14 }}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------------- Text helpers ---------------- */

export function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  return <Text style={[s.eyebrow, color ? { color } : null, style as never]}>{children}</Text>;
}

const useStyles = makeStyles((t) => ({
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  card: { backgroundColor: t.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.border, padding: 16, overflow: "hidden", ...t.shadow },
  cardSunken: { backgroundColor: t.surfaceSunken, borderColor: "transparent" },
  button: { height: 52, borderRadius: radius.md, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  buttonSm: { height: 40, borderRadius: radius.sm, paddingHorizontal: 14, gap: 6 },
  buttonSecondary: { backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  buttonGhost: { backgroundColor: "transparent" },
  buttonDanger: { backgroundColor: t.dangerSoft },
  buttonText: { fontSize: 15.5, fontWeight: "800", letterSpacing: -0.1 },
  buttonTextSm: { fontSize: 13.5 },
  iconButton: { alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  iconButtonPlain: { backgroundColor: "transparent", borderColor: "transparent" },
  badgeDot: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: t.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: t.bgSolid },
  badgeDotText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: "700" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11.5, fontWeight: "800" },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 10, paddingHorizontal: 2 },
  sectionTitle: { color: t.text, ...typo.heading },
  sectionAction: { color: t.accentText, fontSize: 13.5, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: t.accentSoft, marginBottom: 12 },
  emptyTitle: { color: t.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  emptyBody: { color: t.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 5, maxWidth: 300 },
  fieldLabel: { color: t.textSecondary, fontSize: 12.5, fontWeight: "700", marginBottom: 7, marginLeft: 2 },
  field: { minHeight: 52, borderRadius: radius.md, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border, paddingHorizontal: 16, color: t.text, fontSize: 15.5 },
  fieldMultiline: { minHeight: 96, paddingTop: 14, paddingBottom: 14, textAlignVertical: "top" },
  segment: { flexDirection: "row", padding: 4, borderRadius: radius.md, backgroundColor: t.surfaceSunken, borderWidth: 1, borderColor: t.border },
  segmentItem: { flex: 1, height: 38, borderRadius: radius.sm, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  segmentActive: { backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.14)" : "#FFFFFF", ...t.shadow },
  segmentText: { color: t.textSecondary, fontSize: 13.5, fontWeight: "700" },
  segmentCount: { minWidth: 22, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: t.surfacePressed },
  segmentCountText: { color: t.textSecondary, fontSize: 11, fontWeight: "800" },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", backgroundColor: t.surfaceRaised, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, borderWidth: 1, borderColor: t.border, ...t.shadowLg },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: t.borderStrong, alignSelf: "center", marginBottom: 14 },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  sheetTitle: { color: t.text, ...typo.title, marginTop: 2 },
  eyebrow: { color: t.accentText, ...typo.caption },
}));
