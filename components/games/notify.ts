// app/(tabs)/Games/notify.ts
import { notifyPartner } from "@/services/notifications";

export async function notifyGamePartner(pairId: string, currentUid: string, title: string, body: string) {
  await notifyPartner({ pairId, currentUid, title, body, route: "games", action: "game_activity" });
}
