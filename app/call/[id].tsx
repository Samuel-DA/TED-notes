// app/call/[id].tsx — call route. The real screen (and Stream's native code) loads only when available.
import React from "react";
import { useRouter } from "expo-router";
import { PhoneOff } from "lucide-react-native";
import { Button, EmptyState, Screen } from "@/components/ui/kit";
import { callsAvailable } from "@/services/calls";

export default function CallRoute() {
  const router = useRouter();
  if (callsAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CallView = (require("@/components/calls/CallView") as typeof import("@/components/calls/CallView")).default;
    return <CallView />;
  }
  return (
    <Screen bottom="safe">
      <EmptyState icon={PhoneOff} title="Calls need the new app build" body="Voice and video calls use native code that isn't in Expo Go. Install the latest EAS build to call." />
      <Button title="Back" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace("/chat"))} />
    </Screen>
  );
}
