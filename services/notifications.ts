import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { addDoc, collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export type NotificationRoute =
  | "home"
  | "chat"
  | "plans"
  | "care"
  | "care_support"
  | "care_dates"
  | "care_period"
  | "care_routine"
  | "care_voice"
  | "games";

export type NotificationResponse = import("expo-notifications").NotificationResponse;
type NotificationsModule = typeof import("expo-notifications");

let notificationsPromise: Promise<NotificationsModule | null> | null = null;
let handlerConfigured = false;

function isAndroidExpoGo() {
  return Platform.OS === "android" && Constants.expoVersion != null;
}

/**
 * Android Expo Go cannot load remote notification support from SDK 53 onward.
 * Load the native module only in builds where it is available so the rest of
 * the app remains usable in Expo Go. Preview/development builds keep the full
 * notification feature set.
 */
export async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isAndroidExpoGo()) return null;
  if (!notificationsPromise) {
    notificationsPromise = import("expo-notifications")
      .then((notifications) => {
        if (!handlerConfigured) {
          notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });
          handlerConfigured = true;
        }
        return notifications;
      })
      .catch((error) => {
        console.warn("Notifications are unavailable in this app client:", error);
        return null;
      });
  }
  return notificationsPromise;
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "TED Space",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E85D75",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
  ).data;

  return token;
}

export async function scheduleImportantDateNotificationAsync({
  title,
  body,
  date,
}: {
  title: string;
  body: string;
  date: Date;
}) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { route: "care", action: "important_date" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

function tokenDocumentId(token: string) {
  return token.replace(/[^A-Za-z0-9_-]/g, "_").slice(-180);
}

export async function savePushTokenForUser(uid: string, token: string) {
  await setDoc(doc(db, "users", uid, "pushTokens", tokenDocumentId(token)), {
    token,
    platform: Platform.OS,
    projectId: Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? "",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removePushTokenForUser(uid: string, token: string) {
  await deleteDoc(doc(db, "users", uid, "pushTokens", tokenDocumentId(token)));
}

export async function notifyPartner({
  pairId,
  currentUid,
  title,
  body,
  route,
  action,
}: {
  pairId: string;
  currentUid: string;
  title: string;
  body: string;
  route: NotificationRoute;
  action: string;
}) {
  const pairSnap = await getDoc(doc(db, "pairs", pairId));
  if (!pairSnap.exists()) return;
  const pair = pairSnap.data();
  if (!(pair.members as string[] | undefined)?.some((id) => id !== currentUid)) return;

  try {
    await addDoc(collection(db, "pairs", pairId, "notificationEvents"), {
      actorUid: currentUid,
      title,
      body,
      route,
      action,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // The underlying app action has already succeeded. A notification outage
    // must never make a saved message, plan or care update appear to have failed.
    console.warn("Unable to queue partner notification:", error);
  }
}
