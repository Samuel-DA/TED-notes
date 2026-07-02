import { Redirect, Tabs, useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Gamepad2, Heart, Home, List, LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Platform } from "react-native";

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
  if (!isLoggedIn) return <Redirect href="/(auth)/Login" />;

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

        /* 🚀 CLEAN TAB BAR BUTTON FEEDBACK */
        tabBarButton: (props) => (
          <Pressable
            {...props}
            style={({ pressed }) => [
              props.style,
              { opacity: pressed && Platform.OS === 'ios' ? 0.5 : 1 }
            ]}
          />
        ),

        /* 👈 LEFT SIDE (FIXED HIT BOX & POINTER EVENTS) */
        headerLeft: () => (
          <Pressable
            onPress={goHome}
            hitSlop={{ top: 15, bottom: 15, left: 20, right: 20 }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.4 : 1,
              marginLeft: 16,
              justifyContent: 'center',
              alignItems: 'center',
            })}
          >
            <Home color="#4f46e5" size={24} />
          </Pressable>
        ),

        /* 👉 RIGHT SIDE (FIXED HIT BOX & POINTER EVENTS) */
        headerRight: () => (
          <Pressable
            onPress={handleLogout}
            hitSlop={{ top: 15, bottom: 15, left: 20, right: 20 }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.4 : 1,
              marginRight: 20,
              justifyContent: 'center',
              alignItems: 'center',
            })}
          >
            <LogOut color="#4f46e5" size={24} />
          </Pressable>
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
          tabBarIcon: ({ color }) => <Gamepad2 color={color} size={24} />,
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