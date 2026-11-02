import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { makeStyles, useTheme } from "@/hooks/useTheme";

let showFn: any;

export function showAlert(title: string, message: string) {
  showFn?.(title, message);
}

export default function AppAlert() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState({ title: "", message: "" });
  const t = useTheme();
  const styles = useStyles();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    showFn = (title: string, message: string) => {
      setContent({ title, message });
      setVisible(true);

      opacity.setValue(0);
      scale.setValue(0.92);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return () => {
      showFn = undefined;
    };
  }, [opacity, scale]);

  const close = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Pressable style={[styles.overlay, { backgroundColor: t.overlay }]} onPress={close}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => undefined}>
            <Text style={styles.title}>{content.title}</Text>
            {!!content.message && <Text style={styles.message}>{content.message}</Text>}
            <Pressable onPress={close} style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.97 }] }]}>
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  card: { width: "100%", maxWidth: 380, borderRadius: 26, padding: 24, backgroundColor: t.surfaceRaised, borderWidth: 1, borderColor: t.border, ...t.shadowLg },
  title: { fontSize: 20, fontWeight: "800", textAlign: "center", color: t.text, letterSpacing: -0.3 },
  message: { marginTop: 10, fontSize: 15, textAlign: "center", color: t.textSecondary, lineHeight: 22 },
  button: { marginTop: 24, height: 50, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15.5 },
}));
