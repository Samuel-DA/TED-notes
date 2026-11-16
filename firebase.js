import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyALk4-Ea6OAtw1e90WBRpW9bl_HZASrqto",
  authDomain: "ted-notes.firebaseapp.com",
  projectId: "ted-notes",
  storageBucket: "ted-notes.firebasestorage.app",
  messagingSenderId: "1097417430176",
  appId: "1:1097417430176:web:b790a8b4e10fd7a058e5c5",
  measurementId: "G-HK5VRZZK3C",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore.
// React Native's networking can silently stall Firestore's default streaming
// transport (live listeners stop updating until the screen is reopened).
// Long polling is the reliable transport on native.
export const db = initializeFirestore(
  app,
  Platform.OS === "web" ? {} : { experimentalForceLongPolling: true },
);

// Initialize Storage
export const storage = getStorage(app);

// Cloud Functions (same region as functions/index.js)
export const functions = getFunctions(app, "us-central1");

// Initialize Auth with **platform-specific persistence**
export const auth =
  Platform.OS === "web"
    ? initializeAuth(app, { persistence: browserLocalPersistence })
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
