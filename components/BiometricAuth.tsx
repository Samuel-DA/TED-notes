import * as LocalAuthentication from "expo-local-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { Fingerprint, Heart } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, ScreenBackground } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";

type Props = { onAuthenticated: () => void };

export default function BiometricAuth({ onAuthenticated }: Props) {
  const t = useTheme();
  const styles = useStyles();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const isAuthenticating = useRef(false);
  const hasAutoPrompted = useRef(false);

  const authenticate = useCallback(async () => {
    if (isAuthenticating.current) return;
    if (!supported) { onAuthenticated(); return; }
    isAuthenticating.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock TED Space", fallbackLabel: "Use passcode" });
      if (result.success) onAuthenticated(); else setFailed(true);
    } finally { isAuthenticating.current = false; }
  }, [onAuthenticated, supported]);

  useEffect(() => {
    void (async () => {
      const ok = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      setSupported(ok);
    })();
  }, []);

  useEffect(() => {
    if (supported && !hasAutoPrompted.current) { hasAutoPrompted.current = true; void authenticate(); }
  }, [supported, authenticate]);

  return (
    <ScreenBackground style={styles.container}>
      <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mark}>
        <Heart color="#fff" fill="#fff" size={32} />
      </LinearGradient>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.body}>
        {supported === false ? "Biometric unlock isn't set up on this phone, so you can go straight in." : failed ? "That didn't work. Try again when you're ready." : "Unlock to open your shared space."}
      </Text>
      <View style={{ alignSelf: "stretch", marginTop: 28 }}>
        <Button title={supported === false ? "Continue" : "Unlock"} icon={supported === false ? undefined : Fingerprint} onPress={authenticate} loading={supported === null} />
      </View>
    </ScreenBackground>
  );
}

const useStyles = makeStyles((t) => ({
  container: { justifyContent: "center", alignItems: "center", padding: 28 },
  mark: { width: 84, height: 84, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 22, ...t.shadowLg },
  title: { color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.7 },
  body: { color: t.textSecondary, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 8, maxWidth: 300 },
}));
