import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Lock, Mail, User } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { showAlert } from "../../components/AppAlert";
import { auth, db } from "../../firebase";

const friendly = (code?: string) => {
  switch (code) {
    case "auth/email-already-in-use": return "There's already an account with that email. Try signing in instead.";
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/weak-password": return "Choose a password with at least 6 characters.";
    case "auth/network-request-failed": return "You seem to be offline. Check your connection and try again.";
    default: return "Something went wrong. Try again.";
  }
};

export default function Register() {
  const router = useRouter();
  const t = useTheme();
  const s = useStyles();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 || !/[0-9]/.test(password) ? 2 : 3;

  const register = async () => {
    if (loading) return;
    const cleanEmail = email.trim();
    if (!name.trim() || !cleanEmail || !password || !confirm) { showAlert("Missing details", "Fill in every field to continue."); return; }
    if (password.length < 6) { showAlert("Password too short", "Use at least 6 characters."); return; }
    if (password !== confirm) { showAlert("Passwords don't match", "Make sure both passwords are the same."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await setDoc(doc(db, "users", cred.user.uid), { uid: cred.user.uid, name: name.trim(), email: cleanEmail, pairId: null, createdAt: serverTimestamp() });
      router.replace("/");
    } catch (err: any) {
      showAlert("Couldn't create your account", friendly(err?.code));
    } finally { setLoading(false); }
  };

  return (
    <AuthShell
      title="Create your space"
      subtitle="Set up your account, then connect with your partner."
      footer={
        <Pressable onPress={() => router.replace("/Login")} hitSlop={8}>
          <Text style={s.footerText}>Already have an account? <Text style={s.link}>Sign in</Text></Text>
        </Pressable>
      }
    >
      <AuthField label="Your name" icon={User} value={name} onChangeText={setName} placeholder="What should they call you?" autoCapitalize="words" autoComplete="name" textContentType="givenName" maxLength={40} editable={!loading} />
      <AuthField label="Email" icon={Mail} value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" editable={!loading} />
      <AuthField label="Password" icon={Lock} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secure autoComplete="new-password" textContentType="newPassword" editable={!loading} />
      {password.length > 0 && (
        <View style={s.strength}>
          {[1, 2, 3].map((level) => <View key={level} style={[s.strengthBar, strength >= level && { backgroundColor: strength === 1 ? t.danger : strength === 2 ? t.warning : t.success }]} />)}
          <Text style={s.strengthText}>{strength === 1 ? "Too short" : strength === 2 ? "Okay" : "Strong"}</Text>
        </View>
      )}
      <AuthField label="Confirm password" icon={Lock} value={confirm} onChangeText={setConfirm} placeholder="Type it again" secure autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={register} editable={!loading} />
      {confirm.length > 0 && confirm !== password && <Text style={s.mismatch}>Passwords don&apos;t match yet</Text>}
      <Button title="Create account" onPress={register} loading={loading} style={{ marginTop: 6 }} />
    </AuthShell>
  );
}

const useStyles = makeStyles((t) => ({
  link: { color: t.accentText, fontWeight: "800", fontSize: 14 },
  footerText: { color: t.textSecondary, fontSize: 14.5 },
  strength: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -4, marginBottom: 12 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: t.surfaceSunken },
  strengthText: { color: t.textMuted, fontSize: 11.5, fontWeight: "700", marginLeft: 6, width: 58 },
  mismatch: { color: t.dangerText, fontSize: 12.5, fontWeight: "600", marginTop: -4, marginBottom: 10 },
}));
