// services/widget.ts — keeps the home-screen widgets (iOS + Android) in sync with the app.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const WIDGET_APP_GROUP = "group.com.samuel.adebiyi.TEDnotes";
export const WIDGET_STORAGE_KEY = "ted-widget-snapshot";
export const ANDROID_WIDGET_NAME = "TedSpace";

export type WidgetSnapshot = {
  partnerName: string;
  partnerMood: string;
  streak: number;
  best: number;
  /** Days until the next visit, or null when none is planned. */
  reunionDays: number | null;
  question: "pick" | "answer" | "waiting" | "revealed";
  meCheckedIn: boolean;
  partnerCheckedIn: boolean;
  updatedAt: number;
};

export async function readWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WidgetSnapshot) : null;
  } catch {
    return null;
  }
}

let lastJson = "";

/** Save the latest snapshot and ask the OS to redraw the widgets. Cheap to call often. */
export async function updateWidget(data: Omit<WidgetSnapshot, "updatedAt">) {
  if (Platform.OS === "web") return;
  const json = JSON.stringify(data);
  if (json === lastJson) return;
  lastJson = json;
  const snapshot: WidgetSnapshot = { ...data, updatedAt: Date.now() };
  const full = JSON.stringify(snapshot);
  await AsyncStorage.setItem(WIDGET_STORAGE_KEY, full).catch(() => undefined);

  try {
    if (Platform.OS === "ios") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ExtensionStorage } = require("@bacons/apple-targets") as typeof import("@bacons/apple-targets");
      new ExtensionStorage(WIDGET_APP_GROUP).set("snapshot", full);
      ExtensionStorage.reloadWidget();
    } else if (Platform.OS === "android") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestWidgetUpdate } = require("react-native-android-widget") as typeof import("react-native-android-widget");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { renderTedSpaceWidget } = require("@/widgets/TedSpaceWidget") as typeof import("@/widgets/TedSpaceWidget");
      await requestWidgetUpdate({ widgetName: ANDROID_WIDGET_NAME, renderWidget: () => renderTedSpaceWidget(snapshot) });
    }
  } catch {
    // Widgets are a nice-to-have: never let them break the app (e.g. in Expo Go).
  }
}

/** Clear the widget on sign-out so a partner's name never lingers on the home screen. */
export async function clearWidget() {
  lastJson = "";
  await AsyncStorage.removeItem(WIDGET_STORAGE_KEY).catch(() => undefined);
  try {
    if (Platform.OS === "ios") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ExtensionStorage } = require("@bacons/apple-targets") as typeof import("@bacons/apple-targets");
      new ExtensionStorage(WIDGET_APP_GROUP).remove("snapshot");
      ExtensionStorage.reloadWidget();
    } else if (Platform.OS === "android") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { requestWidgetUpdate } = require("react-native-android-widget") as typeof import("react-native-android-widget");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { renderTedSpaceWidget } = require("@/widgets/TedSpaceWidget") as typeof import("@/widgets/TedSpaceWidget");
      await requestWidgetUpdate({ widgetName: ANDROID_WIDGET_NAME, renderWidget: () => renderTedSpaceWidget(null) });
    }
  } catch {
    // ignore
  }
}
