// app/index.tsx
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// ✅ Define all allowed routes for type-safety
type Route =
  | "/(auth)/Login"
  | "/(auth)/Register"
  | "/(auth)/PairScreen"
  | "/(auth)/WaitingForPartner"
  | "/(tabs)/Home";

export default function Index() {
  const [redirectTo, setRedirectTo] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setRedirectTo("/(auth)/Login");
          return;
        }

        // 🔹 Load user document
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          setRedirectTo("/(auth)/Register");
          return;
        }

        const { pairId } = userSnap.data();

        if (!pairId) {
          setRedirectTo("/(auth)/PairScreen");
          return;
        }

        // 🔹 Load pair document
        const pairSnap = await getDoc(doc(db, "pairs", pairId));
        if (!pairSnap.exists()) {
          setRedirectTo("/(auth)/PairScreen");
          return;
        }

        const members = pairSnap.data().members;

        if (!Array.isArray(members)) {
          setRedirectTo("/(auth)/PairScreen");
          return;
        }

        if (members.length < 2) {
          setRedirectTo("/(auth)/WaitingForPartner");
          return;
        }

        // ✅ Pair complete
        setRedirectTo("/(tabs)/Home");
      } catch (err) {
        console.error("Index.tsx error:", err);
        setRedirectTo("/(auth)/Login");
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text>Loading your TED Space…</Text>
      </View>
    );
  }

  // 🔹 Redirect if needed
  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return null; // Nothing to render if already redirected
}