import * as Haptics from "expo-haptics";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button, Field, Sheet } from "@/components/ui/kit";
import { useE2EE } from "@/context/E2EEContext";
import { makeStyles, useTheme } from "@/hooks/useTheme";

const MIN = 8;

/** Set up, restore and inspect end-to-end encrypted private chat. */
export default function PrivateChatSheet({ visible, onClose, partnerName }: { visible: boolean; onClose: () => void; partnerName: string }) {
  const t = useTheme();
  const s = useStyles();
  const e2ee = useE2EE();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"default" | "change" | "fresh">("default");

  const reset = () => { setPass(""); setConfirm(""); setMode("default"); };
  const close = () => { reset(); onClose(); };
  const strongEnough = pass.length >= MIN;
  const matches = pass === confirm;

  const run = async (task: () => Promise<boolean | void>, done: string) => {
    setBusy(true);
    try {
      const ok = await task();
      if (ok === false) { Alert.alert("That passphrase didn't work", "Check it and try again. It's case-sensitive."); return; }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(done);
      close();
    } catch (error) {
      Alert.alert("Something went wrong", error instanceof Error ? error.message : "Try again.");
    } finally { setBusy(false); }
  };

  const confirmFresh = () => Alert.alert(
    "Start fresh with a new key?",
    "Messages already encrypted for your old key won't be readable on this phone. New messages will be private as usual.",
    [{ text: "Cancel", style: "cancel" }, { text: "Start fresh", style: "destructive", onPress: () => setMode("fresh") }],
  );

  const passphraseFields = (
    <>
      <Field label="Backup passphrase" value={pass} onChangeText={setPass} secureTextEntry placeholder={`At least ${MIN} characters`} autoCapitalize="none" autoCorrect={false} />
      <Field label="Confirm passphrase" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Type it again" autoCapitalize="none" autoCorrect={false} />
      {confirm.length > 0 && !matches && <Text style={s.warn}>Passphrases don&apos;t match yet</Text>}
      <Text style={s.note}>Write it somewhere safe. Nobody, including the TED Space developer, can recover it. You&apos;ll need it on a new or reset phone.</Text>
    </>
  );

  let body: React.ReactNode;
  if (e2ee.status === "loading") {
    body = <Text style={s.p}>Checking this phone&apos;s keys…</Text>;
  } else if (e2ee.status === "restore" && mode !== "fresh") {
    body = (
      <>
        <Point icon={KeyRound} text="Your private chat key is backed up. Enter your passphrase to restore it on this phone." />
        <Field label="Backup passphrase" value={pass} onChangeText={setPass} secureTextEntry autoCapitalize="none" autoCorrect={false} />
        <Button title="Restore my key" loading={busy} disabled={!pass} onPress={() => run(() => e2ee.restore(pass), "Private chat restored 🔒")} />
        <Button title="I forgot it, start fresh" variant="ghost" size="sm" onPress={confirmFresh} style={{ marginTop: 8 }} />
      </>
    );
  } else if (e2ee.status === "setup" || mode === "fresh") {
    body = (
      <>
        <Point icon={LockKeyhole} text="Messages, captions and photos are encrypted on your phone before they're sent. Only your two phones hold the keys." />
        <Point icon={ShieldCheck} text="Push notifications will say “New private message” instead of showing the text." />
        <Point icon={KeyRound} text="Choose a backup passphrase so you can restore your key on a new phone." />
        {passphraseFields}
        <Button title={mode === "fresh" ? "Create new key" : "Turn on private chat"} loading={busy} disabled={!strongEnough || !matches} onPress={() => run(() => (mode === "fresh" ? e2ee.reset(pass) : e2ee.setUp(pass)), "Private chat is on 🔒")} />
      </>
    );
  } else if (mode === "change") {
    body = (
      <>
        {passphraseFields}
        <Button title="Save new passphrase" loading={busy} disabled={!strongEnough || !matches} onPress={() => run(() => e2ee.changePassphrase(pass), "Passphrase updated")} />
      </>
    );
  } else {
    body = (
      <>
        <View style={[s.status, { backgroundColor: e2ee.active ? t.successSoft : t.warningSoft }]}>
          <ShieldCheck color={e2ee.active ? t.successText : t.warningText} size={20} />
          <Text style={[s.statusText, { color: e2ee.active ? t.successText : t.warningText }]}>
            {e2ee.active ? "New messages are end-to-end encrypted." : `Your key is ready. Encryption starts once ${partnerName} turns on private chat.`}
          </Text>
        </View>
        {e2ee.safety && (
          <>
            <Text style={s.label}>SAFETY CODE</Text>
            <Text style={s.code}>{e2ee.safety}</Text>
            <Text style={s.note}>Compare this with {partnerName}&apos;s phone. If the codes match, nobody is sitting in the middle of your conversation.</Text>
          </>
        )}
        <Button title="Change backup passphrase" variant="secondary" onPress={() => setMode("change")} style={{ marginTop: 16 }} />
      </>
    );
  }

  return (
    <Sheet visible={visible} onClose={close} eyebrow="PRIVATE CHAT" title={e2ee.status === "restore" ? "Restore your key" : e2ee.status === "setup" ? "End-to-end encryption" : "Privacy"}>
      {body}
    </Sheet>
  );
}

function Point({ icon: Icon, text }: { icon: typeof KeyRound; text: string }) {
  const t = useTheme();
  const s = useStyles();
  return <View style={s.point}><View style={s.pointIcon}><Icon color={t.accentText} size={16} /></View><Text style={s.pointText}>{text}</Text></View>;
}

const useStyles = makeStyles((t) => ({
  p: { color: t.textSecondary, fontSize: 14.5 },
  point: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  pointIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: t.accentSoft, alignItems: "center", justifyContent: "center" },
  pointText: { flex: 1, color: t.text, fontSize: 14.5, lineHeight: 20 },
  warn: { color: t.dangerText, fontSize: 12.5, marginTop: -6, marginBottom: 8 },
  note: { color: t.textMuted, fontSize: 12.5, lineHeight: 18, marginBottom: 14 },
  status: { flexDirection: "row", gap: 10, alignItems: "center", padding: 14, borderRadius: 16 },
  statusText: { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 19 },
  label: { color: t.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 18 },
  code: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: 2, marginTop: 6, fontVariant: ["tabular-nums"] },
}));
