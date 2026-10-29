import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "../../components/AppAlert";
import { auth, db } from "../../firebase";
import { gradients } from "@/constants/design";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState(""); // 👈 NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const scale = useRef(new Animated.Value(1)).current;

  const register = async () => {
    if (loading) return;

    if (!name.trim() || !email || !password || !confirmPassword) {
      showAlert("Missing fields", "Please enter all fields");
      return;
    }

    if (password.length < 6) {
      showAlert("Weak password", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showAlert(
        "Passwords do not match",
        "Please make sure both passwords are identical",
      );
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Create user doc with NAME
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name.trim(), // 👈 STORED HERE
        email,
        pairId: null,
        createdAt: serverTimestamp(),
      });

      router.replace("/"); // index.tsx decides next screen
    } catch (err: any) {
      showAlert("Registration failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  useEffect(() => {
    if (
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword
    ) {
      Animated.spring(checkAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(checkAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [password, confirmPassword, checkAnim]);

  return (
    <LinearGradient colors={gradients.app} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%" }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start your shared space together
            </Text>

            {/* 👇 NAME INPUT */}
            <TextInput
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Confirm password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />

              {/* 👇 Animated Checkmark */}
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: checkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                  opacity: checkAnim,
                  marginRight: 8,
                }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
              </Animated.View>

              {/* 👁 Eye Icon */}
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                onPressIn={pressIn}
                onPressOut={pressOut}
                onPress={register}
                disabled={loading}
                style={[styles.button, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              disabled={loading}
              onPress={() => router.replace("/Login")}
            >
              <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 18,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#211A2C",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#F7F3F8",
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#B5445A",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    marginTop: 18,
    color: "#7A385F",
    fontWeight: "600",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F3F8",
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 56,
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
});
