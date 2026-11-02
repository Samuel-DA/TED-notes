// app/(auth)/WaitingForPartner.tsx
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Check, Copy, Heart, Share2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, Share, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button, ScreenBackground } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { useApp } from "../../context/AppContext";
import { auth } from "../../firebase";

export default function WaitingForPartner() {
  const router = useRouter();
  const t = useTheme();
  const s = useStyles();
  const { pairId, partnerName, loading } = useApp();
  const [copied, setCopied] = useState(false);
  const redirected = useRef(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (!loading && partnerName && !redirected.current) {
      redirected.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/Home");
    }
  }, [loading, partnerName, router]);

  const copy = async () => {
    if (!pairId) return;
    await Clipboard.setStringAsync(pairId);
    void Haptics.selectionAsync();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = () => pairId && Share.share({ message: `Join me on TED Space 💞 Open the app, choose "Join their space" and paste this code:\n\n${pairId}` });

  if (loading || !pairId) {
    return <ScreenBackground style={{ alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={t.accent} /></ScreenBackground>;
  }

  return (
    <AuthShell
      title="Waiting for your partner"
      subtitle="Send them this code. You'll both be taken in the moment they join."
      footer={<Pressable onPress={() => void signOut(auth)} hitSlop={8}><Text style={s.signOut}>Sign out</Text></Pressable>}
    >
      <View style={s.pulseWrap}>
        <Animated.View style={[s.pulse, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }] }]} />
        <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heart}><Heart color="#fff" fill="#fff" size={24} /></LinearGradient>
      </View>
      <Text style={s.label}>YOUR INVITE CODE</Text>
      <Pressable onPress={copy} style={({ pressed }) => [s.code, pressed && { opacity: 0.8 }]}>
        <Text selectable style={s.codeText} numberOfLines={1} adjustsFontSizeToFit>{pairId}</Text>
        {copied ? <Check color={t.successText} size={18} /> : <Copy color={t.textMuted} size={18} />}
      </Pressable>
      <Text style={s.hint}>{copied ? "Copied" : "Tap the code to copy it"}</Text>
      <Button title="Share invite" icon={Share2} onPress={share} style={{ marginTop: 14 }} />
    </AuthShell>
  );
}

const useStyles = makeStyles((t) => ({
  pulseWrap: { alignSelf: "center", width: 96, height: 96, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  pulse: { position: "absolute", width: 64, height: 64, borderRadius: 32, backgroundColor: t.accent },
  heart: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  label: { color: t.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.3, textAlign: "center" },
  code: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, paddingHorizontal: 16, minHeight: 58, borderRadius: 18, backgroundColor: t.surfaceSunken, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.borderStrong },
  codeText: { flex: 1, color: t.text, fontSize: 18, fontWeight: "800", letterSpacing: 0.5, fontVariant: ["tabular-nums"] },
  hint: { color: t.textMuted, fontSize: 12.5, textAlign: "center", marginTop: 8 },
  signOut: { color: t.textMuted, fontSize: 14, fontWeight: "700" },
}));
