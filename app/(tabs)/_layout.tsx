import { Redirect, Tabs } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { Gamepad2, Heart, HeartHandshake, ListChecks } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@/constants/design";

import { auth } from "../../firebase";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.rose,
        tabBarInactiveTintColor: "#9B91A2",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginTop: 2 },
        tabBarItemStyle: { paddingTop: 8 },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: Math.max(insets.bottom, 8),
          height: Platform.OS === "ios" ? 72 : 68,
          borderRadius: 24,
          backgroundColor: "#17121F",
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 10 : 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.24,
          shadowRadius: 20,
          elevation: 14,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "TED Space",
          tabBarLabel: "Together",
          tabBarIcon: ({ color, focused }) => <Heart color={color} fill={focused ? color : "transparent"} size={22} />,
        }}
      />
      <Tabs.Screen
        name="TED_todos"
        options={{
          title: "Shared Todos",
          tabBarLabel: "Plans",
          tabBarIcon: ({ color }) => <ListChecks color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="Care"
        options={{ title: "Care Space", tabBarLabel: "Care", tabBarIcon: ({ color }) => <HeartHandshake color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="Games"
        options={{
          title: "Games",
          tabBarLabel: "Play",
          tabBarIcon: ({ color }) => <Gamepad2 color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          title: "The Walls have Ears!",
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
