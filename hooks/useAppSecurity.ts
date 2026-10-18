import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export function useAppSecurity() {
  const [isLocked, setIsLocked] = useState<boolean>(true); // Start locked on fresh launch
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isAuthenticating = useRef<boolean>(false);
  const lastBackgroundTime = useRef<number>(0);

  const authenticateBiometrics = useCallback(async (): Promise<boolean> => {
    if (isAuthenticating.current) return false;

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        return true;
      }

      isAuthenticating.current = true;
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock TED Space Vault",
        fallbackLabel: "Use Device Passcode",
        disableDeviceFallback: false,
      });

      // Give the OS a tiny moment to clean up the modal presentation context
      await new Promise((resolve) => setTimeout(resolve, 150));
      isAuthenticating.current = false;

      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      isAuthenticating.current = false;
      console.error("Biometric security error:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial launch authentication
    authenticateBiometrics();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      const now = Date.now();

      // 1. Moving away from active state (minimizing or backgrounding)
      if (
        appState.current.match(/active/) && 
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        // Track exactly when the app lost focus
        if (!isAuthenticating.current) {
          lastBackgroundTime.current = now;
          setIsLocked(true);
        }
      }

      // 2. Returning to the app
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === "active"
      ) {
        // TIME GUARD: If the app was backgrounded for less than 2 seconds,
        // it was almost certainly just the native Face ID modal flickering the app state.
        // Do not re-trigger a secondary lock screen or authentication.
        if (now - lastBackgroundTime.current < 2000 && isLocked === false) {
          appState.current = nextAppState;
          return;
        }

        authenticateBiometrics();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authenticateBiometrics, isLocked]);

  return { isLocked, authenticateBiometrics };
}
