// app/(auth)/PairScreen.tsx
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { KeyRound, Link2, Sparkles } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { AuthField, AuthShell } from "@/components/auth/AuthShell";
import { Button, ScreenBackground } from "@/components/ui/kit";
import { makeStyles, useTheme } from "@/hooks/useTheme";
import { auth, db } from "../../firebase";

export default function PairScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const t = useTheme();
  const styles = useStyles();

  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Check if the user is already paired
  useEffect(() => {
    const checkIfPaired = async () => {
      if (!user) return setLoading(false);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().pairId) {
          router.replace("/(auth)/WaitingForPartner");
          return;
        }
      } catch (err) {
        console.error("Error checking pair:", err);
      } finally {
        setLoading(false);
      }
    };

    checkIfPaired();
  }, [user, router]);

  // Create a new pair
  const createPair = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) { Alert.alert("Profile not found", "Your account setup didn't finish. Sign out and register again."); return; }

      const { name } = userSnap.data();
      // Firestore auto IDs use a cryptographically strong, high-entropy generator.
      const pairRef = doc(collection(db, "pairs"));
      const pairId = pairRef.id;
      const batch = writeBatch(db);

      batch.set(pairRef, {
        members: [user.uid],
        names: { [user.uid]: name },
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", user.uid), { pairId });
      await batch.commit();
      router.replace("/(auth)/WaitingForPartner");
    } catch {
      Alert.alert("Couldn't create your invite", "Check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Join an existing pair
  const joinPair = async () => {
    if (!user || !joinCode.trim()) {
      Alert.alert("Enter a code", "Paste the invite code your partner shared with you.");
      return;
    }

    setProcessing(true);
    const code = joinCode.trim();
    const pairRef = doc(db, "pairs", code);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) { Alert.alert("Profile not found", "Your account setup didn't finish. Sign out and register again."); return; }

      const { name } = userSnap.data();
      await runTransaction(db, async (transaction) => {
        const pairSnap = await transaction.get(pairRef);
        if (!pairSnap.exists()) throw new Error("PAIR_NOT_FOUND");

        const pair = pairSnap.data();
        const members: string[] = Array.isArray(pair.members) ? pair.members : [];
        if (members.includes(user.uid)) throw new Error("ALREADY_MEMBER");
        if (members.length !== 1) throw new Error("PAIR_FULL");

        transaction.update(pairRef, {
          members: [...members, user.uid],
          names: { ...(pair.names || {}), [user.uid]: name },
        });
        transaction.update(doc(db, "users", user.uid), { pairId: code });
      });
      router.replace("/(auth)/WaitingForPartner");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "PAIR_FULL") {
        Alert.alert("That space is full", "This invite has already been used by two people.");
      } else if (reason === "ALREADY_MEMBER") {
        Alert.alert("Already joined", "You're already part of this space.");
      } else {
        Alert.alert("Code not found", "Check the code and try again. It's case-sensitive.");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <ScreenBackground style={{ alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={t.accent} /></ScreenBackground>;
  }

  return (
    <AuthShell
      title="Connect with your person"
      subtitle="TED Space is built for two. Create an invite, or join with the code they sent you."
      footer={<Pressable onPress={() => void signOut(auth)} hitSlop={8}><Text style={styles.signOut}>Sign out</Text></Pressable>}
    >
      <View style={styles.option}>
        <View style={[styles.optionIcon, { backgroundColor: t.accentSoft }]}><Sparkles color={t.accentText} size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>Start a new space</Text>
          <Text style={styles.optionBody}>You&apos;ll get a code to send to your partner.</Text>
        </View>
      </View>
      <Button title="Create invite code" icon={Link2} onPress={createPair} loading={processing} />

      <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>OR</Text><View style={styles.line} /></View>

      <AuthField label="Have a code?" icon={KeyRound} value={joinCode} onChangeText={setJoinCode} placeholder="Paste your partner's code" autoCapitalize="none" autoCorrect={false} editable={!processing} returnKeyType="go" onSubmitEditing={joinPair} />
      <Button title="Join their space" variant="secondary" onPress={joinPair} disabled={!joinCode.trim() || processing} />
    </AuthShell>
  );
}

const useStyles = makeStyles((t) => ({
  option: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  optionIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  optionTitle: { color: t.text, fontSize: 16, fontWeight: "800" },
  optionBody: { color: t.textSecondary, fontSize: 13.5, marginTop: 2 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: t.border },
  or: { color: t.textMuted, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.2 },
  signOut: { color: t.textMuted, fontSize: 14, fontWeight: "700" },
}));
