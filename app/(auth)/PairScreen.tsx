// app/(auth)/PairScreen.tsx
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { nanoid } from "nanoid/non-secure";
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
      const pairId = nanoid(8);

      await setDoc(doc(db, "pairs", pairId), {
        members: [user.uid],
        names: { [user.uid]: name },
        createdAt: Date.now(),
      });

      await updateDoc(doc(db, "users", user.uid), { pairId });
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
      const pairSnap = await getDoc(pairRef);

      // ✅ Invalid code
      if (!pairSnap.exists()) {
        Alert.alert("Invalid Code", "No pair found with this code");
        return;
      }

      const pair = pairSnap.data();
      if (!pair.members || pair.members.length >= 2) {
        Alert.alert("Pair Full", "This pair already has two members");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;

      const { name } = userSnap.data();

      // Add user to the pair
      await updateDoc(pairRef, {
        members: [...pair.members, user.uid],
        names: { ...pair.names, [user.uid]: name },
      });

      await updateDoc(doc(db, "users", user.uid), { pairId: code });
      router.replace("/(auth)/WaitingForPartner");
    } catch (err) {
      // Firestore permission/network errors
      Alert.alert("Invalid Code", "No pair found with this code");
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
        <Text style={styles.title}>Pair with your partner 💞</Text>

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
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    padding: 24,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: 30,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  secondary: { backgroundColor: "#6366f1" },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
  or: { textAlign: "center", marginVertical: 14, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
});
