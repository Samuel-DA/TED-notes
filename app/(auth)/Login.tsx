import { registerForPushNotificationsAsync } from "@/services/notifications";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { showAlert } from "../../components/AppAlert";
import { auth, db } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // 👑 Track dynamic background operations
  const router = useRouter();

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  /** FORGOT PASSWORD INTERFACE ROUTINE */
  const handleForgotPassword = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      showAlert("Missing Email", "Please enter your email address in the input field first so we know where to send the link.");
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, targetEmail);
      showAlert(
        "Reset Link Sent", 
        `We have dispatched a password reset link to ${targetEmail}. Please check your inbox and spam folder.`
      );
    } catch (err: any) {
      let message = "Could not initialize password recovery protocols.";
      if (err.code === "auth/invalid-email") {
        message = "The syntax of that email address appears incorrect.";
      } else if (err.code === "auth/user-not-found") {
        message = "No profile exists under this email layout registry.";
      }
      showAlert("Recovery Failure", message);
    } finally {
      setIsLoading(false);
    }
  };

  /** AUTHENTICATION LOGIN ROUTINE */
  const login = async () => {
    if (isLoading) return;
    if (!email.trim() || !password) {
      showAlert("Missing fields", "Please fill in all layout credentials.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = userCredential.user.uid;
      const token = await registerForPushNotificationsAsync();

      if (token) {
        await setDoc(
          doc(db, "users", uid),
          { pushToken: token },
          { merge: true }
        );
      }

      router.replace("/");
    } catch (err: any) {
      const code = err?.code;
      let message = "Authentication failed.";

      if (code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        message = "Invalid email or password layout match.";
      }

      showAlert("Login failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          {/* Header Typography Elements */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue to your shared space</Text>

          {/* Email Element input node */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#4b5563"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password element input node */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#4b5563"
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setSecure(!secure)}
              activeOpacity={0.7}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={secure ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* 👑 FORGOT PASSWORD BUTTON ACTION CONTAINER */}
          <TouchableOpacity 
            onPress={handleForgotPassword}
            activeOpacity={0.7}
            disabled={isLoading}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Master Action Core Interface Trigger */}
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: "100%" }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={login}
              disabled={isLoading}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Fallback alternative route placement */}
          <TouchableOpacity
            onPress={() => router.push("/Register")}
            activeOpacity={0.7}
            style={styles.registerTouch}
          >
            <Text style={styles.registerText}>
              Don’t have an account? <Text style={styles.registerHighlight}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712", // 👑 True Ultra Dark Deep Obsidian
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#0b0f19", // 👑 Smooth contrasting inner layout slate card
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: "#1f2937", // 👑 Clean micro border defining interface shapes cleanly
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 28,
    fontWeight: "400",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827", 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -4,
    paddingVertical: 4,
  },
  forgotText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4f46e5", // 👑 Premium structural digital royal blue gradient element tint
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#312e81",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  registerTouch: {
    marginTop: 24,
    paddingVertical: 4,
  },
  registerText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "400",
  },
  registerHighlight: {
    color: "#6366f1",
    fontWeight: "600",
  },
});