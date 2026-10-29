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
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebase";

export default function PairScreen() {
  const router = useRouter();
  const user = auth.currentUser;

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
      if (!userSnap.exists()) return;

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
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not create pair");
    } finally {
      setProcessing(false);
    }
  };

  // Join an existing pair
  const joinPair = async () => {
    if (!user || !joinCode.trim()) {
      Alert.alert("Missing Code", "Please enter a partner code");
      return;
    }

    setProcessing(true);
    const code = joinCode.trim();
    const pairRef = doc(db, "pairs", code);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;

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
        Alert.alert("Pair Full", "This pair already has two members");
      } else if (reason === "ALREADY_MEMBER") {
        Alert.alert("Already Joined", "You are already a member of this pair");
      } else {
        Alert.alert("Invalid Code", "No available pair was found with this code");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 12, color: "#4f46e5" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>ONE PRIVATE SPACE</Text>
        <Text style={styles.title}>Connect with your person</Text>
        <Text style={styles.subtitle}>Create a private invite or enter the code they sent you.</Text>

        <TouchableOpacity
          style={[styles.button, processing && styles.disabled]}
          onPress={createPair}
          disabled={processing}
        >
          <Text style={styles.buttonText}>
            {processing ? "Processing…" : "Create Invite Code"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.or}>OR</Text>

        <TextInput
          placeholder="Enter Partner Code"
          value={joinCode}
          onChangeText={setJoinCode}
          style={styles.input}
          editable={!processing}
        />

        <TouchableOpacity
          style={[
            styles.button,
            styles.secondary,
            processing && styles.disabled,
          ]}
          onPress={joinPair}
          disabled={processing}
        >
          <Text style={styles.buttonText}>
            {processing ? "Processing…" : "Join Pair"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#16121F",
    justifyContent: "center",
    padding: 24,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#16121F",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#B5445A",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  secondary: { backgroundColor: "#76527D" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  or: { textAlign: "center", marginVertical: 14, fontWeight: "800", color: "#8F8296", fontSize: 11, letterSpacing: 1.5 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    color: "#211A2C",
  },
  kicker: { color: "#F08BA0", textAlign: "center", fontSize: 10, fontWeight: "900", letterSpacing: 1.8, marginBottom: 8 },
  subtitle: { color: "#B4A8BA", textAlign: "center", fontSize: 14, lineHeight: 20, marginBottom: 30 },
});
