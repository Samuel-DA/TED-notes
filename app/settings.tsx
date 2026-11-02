import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Eye, EyeOff, Fingerprint, LogOut, Moon, Settings, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { CarePage } from "@/components/care/CareUI";
import { Button, Card, SectionHeader } from "@/components/ui/kit";
import { useApp } from "@/context/AppContext";
import { auth, db } from "@/firebase";
import { makeStyles, useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const { uid, myName, partnerName, suppressAppLock } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const email = auth.currentUser?.email;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snapshot) => setShowPreview(snapshot.data()?.notificationPreview !== false));
  }, [uid]);

  const togglePreview = async (value: boolean) => {
    if (!uid || saving) return;
    suppressAppLock();
    setShowPreview(value);
    setSaving(true);
    try { await setDoc(doc(db, "users", uid), { notificationPreview: value, settingsUpdatedAt: serverTimestamp() }, { merge: true }); }
    catch { setShowPreview(!value); Alert.alert("Couldn't save", "Check your connection and try again."); }
    finally { setSaving(false); }
  };

  const confirmSignOut = () => Alert.alert("Sign out?", "You'll need to sign in again to return to your shared space.", [
    { text: "Cancel", style: "cancel" },
    { text: "Sign out", style: "destructive", onPress: () => void signOut(auth) },
  ]);

  return (
    <CarePage bottom="safe" eyebrow="SETTINGS" title="Settings" subtitle="Your account, privacy and notifications." icon={<Settings color="#fff" size={23} />}>
      <Card variant="hero" style={s.profile}>
        <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
          <Text style={s.avatarText}>{(myName || "Y").charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{myName || "You"}</Text>
          {!!email && <Text style={s.meta} numberOfLines={1}>{email}</Text>}
          {!!partnerName && <Text style={[s.meta, { color: t.accentText, fontWeight: "700" }]}>Paired with {partnerName} 💞</Text>}
        </View>
      </Card>

      <SectionHeader title="Notifications" />
      <Card padded={false} style={s.group}>
        <Row
          icon={showPreview ? <Eye color={t.violetText} size={19} /> : <EyeOff color={t.violetText} size={19} />}
          title="Show previews"
          body={showPreview ? "Message text and activity details appear in push notifications." : "Push notifications show a private, generic message."}
          right={<Switch value={showPreview} onValueChange={togglePreview} disabled={saving} trackColor={{ false: t.surfacePressed, true: t.accent }} thumbColor="#fff" ios_backgroundColor={t.surfacePressed} />}
        />
      </Card>

      <SectionHeader title="Privacy and appearance" />
      <Card padded={false} style={s.group}>
        <Row icon={<Fingerprint color={t.successText} size={19} />} title="App lock" body="TED Space locks when you leave and unlocks with Face ID, fingerprint or your passcode." />
        <View style={s.divider} />
        <Row icon={t.mode === "dark" ? <Moon color={t.infoText} size={19} /> : <Sun color={t.warningText} size={19} />} title={`Appearance: ${t.mode === "dark" ? "dark" : "light"}`} body="Follows your phone's light or dark setting automatically." />
      </Card>

      <Button title="Sign out" icon={LogOut} variant="danger" onPress={confirmSignOut} style={{ marginTop: 24 }} />
      <Text style={s.version}>TED Space {Constants.expoConfig?.version ?? ""}</Text>
    </CarePage>
  );
}

function Row({ icon, title, body, right }: { icon: React.ReactNode; title: string; body: string; right?: React.ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowBody}>{body}</Text>
      </View>
      {right}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  profile: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 24 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  name: { color: t.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  meta: { color: t.textSecondary, fontSize: 13.5, marginTop: 2 },
  group: { borderRadius: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 13, padding: 16 },
  rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSunken },
  rowTitle: { color: t.text, fontSize: 15, fontWeight: "700" },
  rowBody: { color: t.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.borderStrong, marginLeft: 69 },
  version: { color: t.textMuted, fontSize: 12, textAlign: "center", marginTop: 16 },
}));
