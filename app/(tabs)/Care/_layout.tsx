import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function CareLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: t.bgSolid } }} />;
}
