// app/index.tsx — entry route. The root layout owns the auth/pairing redirects and the
// splash screen, so this route only has to send people into the app.
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/Home" />;
}
