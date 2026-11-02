import { Tabs } from "expo-router";
import { Gamepad2, HeartHandshake, House, ListChecks } from "lucide-react-native";
import SleekTabBar from "../../components/SleekTabBar";
import { useTheme } from "@/hooks/useTheme";

// Auth and pairing redirects are handled once in app/_layout.tsx.
export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      tabBar={(props) => <SleekTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.bgSolid } }}
    >
      <Tabs.Screen name="Home" options={{ title: "Home", tabBarLabel: "Home", tabBarIcon: ({ color, focused }) => <House color={color} strokeWidth={focused ? 2.4 : 2} size={22} /> }} />
      <Tabs.Screen name="TED_todos" options={{ title: "Shared Todos", tabBarLabel: "Plans", tabBarIcon: ({ color, focused }) => <ListChecks color={color} strokeWidth={focused ? 2.4 : 2} size={22} /> }} />
      <Tabs.Screen name="Care" options={{ title: "Care Space", tabBarLabel: "Care", tabBarIcon: ({ color, focused }) => <HeartHandshake color={color} strokeWidth={focused ? 2.4 : 2} size={22} /> }} />
      <Tabs.Screen name="Games" options={{ title: "Games", tabBarLabel: "Play", tabBarIcon: ({ color, focused }) => <Gamepad2 color={color} strokeWidth={focused ? 2.4 : 2} size={22} /> }} />
    </Tabs>
  );
}
