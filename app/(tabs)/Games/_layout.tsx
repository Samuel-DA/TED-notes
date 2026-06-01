import { Stack } from "expo-router";

export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // header handled by Tabs
      }}
    />
  );
}
