// app/(tabs)/Games/notify.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { sendPushNotification } from "@/services/notifications";

export async function notifyGamePartner(pairId: string, currentUid: string, title: string, body: string) {
  try {
    const pairSnap = await getDoc(doc(db, "pairs", pairId));
    if (!pairSnap.exists()) return;
    
    const members = pairSnap.data().members || [];
    const partnerUid = members.find((id: string) => id !== currentUid);
    
    if (partnerUid) {
      const partnerSnap = await getDoc(doc(db, "users", partnerUid));
      const token = partnerSnap.data()?.expoPushToken;
      if (token) {
        await sendPushNotification(token, title, body);
      }
    }
  } catch (error) {
    console.warn("Failed sending game notification payload:", error);
  }
}