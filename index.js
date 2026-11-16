// index.js — app entry. Loads expo-router and, on Android, the home-screen widget handler.
import "expo-router/entry";
import { Platform } from "react-native";

if (Platform.OS === "android") {
  const { registerWidgetTaskHandler } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./widgets/taskHandler");
  registerWidgetTaskHandler(widgetTaskHandler);
}
