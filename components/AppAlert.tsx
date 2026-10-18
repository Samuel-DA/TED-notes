import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";

let showFn: any;

export function showAlert(title: string, message: string) {
  showFn?.(title, message);
}

export default function AppAlert() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState({ title: "", message: "" });

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
    <Modal transparent animationType="none">
      <Pressable style={styles.overlay} onPress={close}>
        <Animated.View
          style={[
            styles.wrapper,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint="light"
            style={styles.glass}
          >
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.message}>{content.message}</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={close}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Got it!</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  wrapper: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
  },
  glass: {
    padding: 28,
    borderRadius: 32,
    backgroundColor:
      Platform.OS === "ios"
        ? "rgba(255,255,255,0.25)"
        : "rgba(255,255,255,0.9)",
    borderWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "rgba(255,255,255,0.4)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    textAlign: "center",
    color: "#334155",
    lineHeight: 22,
  },
  button: {
    marginTop: 26,
    backgroundColor: "rgba(99, 102, 241, 0.9)",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.4,
  },
});
