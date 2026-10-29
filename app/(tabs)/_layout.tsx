import { Redirect, Tabs } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { Gamepad2, HeartHandshake, House, ListChecks } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../firebase";
import { gradients } from "../../constants/design";

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
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginTop: 2 },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarBackground: () => (
          <LinearGradient
            colors={gradients.app}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 58 + insets.bottom,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, 6),
          shadowOpacity: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => <House color={color} strokeWidth={focused ? 2.8 : 2.1} size={24} />,
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
    </Tabs>
  );
}
