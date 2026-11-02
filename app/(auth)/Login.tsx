import { useRouter } from "expo-router";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/kit";
import { makeStyles } from "@/hooks/useTheme";
import { showAlert } from "../../components/AppAlert";
import { auth } from "../../firebase";

const friendly = (code?: string) => {
  switch (code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "That email and password don't match. Check them and try again.";
    case "auth/too-many-requests": return "Too many attempts. Wait a few minutes, or reset your password.";
    case "auth/network-request-failed": return "You seem to be offline. Check your connection and try again.";
    default: return "Something went wrong. Try again.";
  }
};

export default function Login() {
  const router = useRouter();
  const s = useStyles();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (loading) return;
    if (!email.trim() || !password) { showAlert("Missing details", "Enter your email and password."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/");
    } catch (err: any) {
      showAlert("Couldn't sign in", friendly(err?.code));
    } finally { setLoading(false); }
  };

  const reset = async () => {
    const target = email.trim();
    if (!target) { showAlert("Enter your email first", "Type your email above and we'll send you a reset link."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, target);
      showAlert("Check your inbox", `If an account exists for ${target}, a reset link is on its way. Check your spam folder too.`);
    } catch (err: any) {
      showAlert("Couldn't send the link", friendly(err?.code));
    } finally { setLoading(false); }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your shared space."
      footer={
        <Pressable onPress={() => router.push("/Register")} hitSlop={8}>
          <Text style={s.footerText}>New here? <Text style={s.link}>Create an account</Text></Text>
        </Pressable>
      }
    >
      <AuthField label="Email" icon={Mail} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" editable={!loading} />
      <AuthField label="Password" icon={Lock} value={password} onChangeText={setPassword} placeholder="Your password" secure autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={login} editable={!loading} />
      <Pressable onPress={reset} hitSlop={8} style={s.forgot}><Text style={s.link}>Forgot password?</Text></Pressable>
      <Button title="Sign in" onPress={login} loading={loading} />
    </AuthShell>
  );
}

const useStyles = makeStyles((t) => ({
  forgot: { alignSelf: "flex-end", marginBottom: 16, marginTop: -2 },
  link: { color: t.accentText, fontWeight: "800", fontSize: 14 },
  footerText: { color: t.textSecondary, fontSize: 14.5 },
}));
