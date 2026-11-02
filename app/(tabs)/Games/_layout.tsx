import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function GamesLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bgSolid } }} />;
}
