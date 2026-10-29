import { CareCard, CarePage } from "@/components/care/CareUI";
import { palette } from "@/constants/design";
import { useApp } from "@/context/AppContext";
import { db } from "@/firebase";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { BellRing, Eye, EyeOff, Settings } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsPage() {
  const { uid, suppressAppLock } = useApp();
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "users", uid), (snapshot) => {
      setShowPreview(snapshot.data()?.notificationPreview !== false);
    });
  }, [uid]);

  const togglePreview = async (value: boolean) => {
    if (!uid || saving) return;
    suppressAppLock();
    setShowPreview(value);
    setSaving(true);
    try {
      await setDoc(doc(db, "users", uid), { notificationPreview: value, settingsUpdatedAt: serverTimestamp() }, { merge: true });
    } finally {
      setSaving(false);
    }
  };

  return <CarePage eyebrow="SETTINGS" title="Your preferences" subtitle="Control how TED Space behaves on this account." icon={<Settings color="#fff" size={23} />}>
    <CareCard title="Notifications" subtitle="Choose what appears before you open the app" icon={<BellRing color={palette.rose} size={20} />}>
      <View style={styles.row}>
        <View style={styles.settingIcon}>{showPreview ? <Eye color={palette.plum} size={20} /> : <EyeOff color={palette.plum} size={20} />}</View>
        <View style={styles.copy}><Text style={styles.title}>Show notification previews</Text><Text style={styles.description}>{showPreview ? "Messages and activity details can appear in push notifications." : "Push notifications use a private generic message. Full details stay inside TED Space."}</Text></View>
        <Switch value={showPreview} onValueChange={togglePreview} disabled={saving} trackColor={{ false: "#CEC5D1", true: "#F4A5B5" }} thumbColor={showPreview ? palette.rose : "#fff"} />
      </View>
    </CareCard>
  </CarePage>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#F3EAF6", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  title: { color: palette.text, fontSize: 14, fontWeight: "900" },
  description: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
});
