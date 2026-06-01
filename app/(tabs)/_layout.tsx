// app/(tabs)/_layout.tsx
import { Redirect, Tabs, useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Gamepad2, Heart, Home, List, LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { useApp } from "../../context/AppContext";
import { auth } from "../../firebase";

export default function TabsLayout() {
  const router = useRouter();
  const { uid } = useApp();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/Login" />;
  }

  const handleLogout = async () => {
    await signOut(auth);
  };

  const goHome = () => {
    router.replace("/(tabs)/Home");
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: { backgroundColor: "#f3f4f6" },
        tabBarActiveTintColor: "#4f46e5",

        /* 👈 LEFT SIDE */
        headerLeft: () => (
          <TouchableOpacity
            onPress={goHome}
            style={{ marginLeft: 16 }}
          >
            <Home color="#4f46e5" size={24} />
          </TouchableOpacity>
        ),

        /* 👉 RIGHT SIDE */
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 20 }}
          >
            <LogOut color="#4f46e5" size={24} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "TED Space",
          tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="TED_todos"
        options={{
          title: "Shared Todos",
          tabBarIcon: ({ color }) => <List color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Games"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => (
            <Gamepad2 color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          title: "The Walls have Ears!",
        }}
      />
    </Tabs>
  );
}