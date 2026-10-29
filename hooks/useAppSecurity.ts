import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export function useAppSecurity() {
  const BACKGROUND_LOCK_DELAY_MS = 4000;
  const [isLocked, setIsLocked] = useState<boolean>(true); // Start locked on fresh launch
  const isAuthenticating = useRef<boolean>(false);
  const isLockedRef = useRef<boolean>(true);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

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
      // Native controls and permission sheets can briefly report "inactive".
      // Only a genuine background transition should schedule a privacy lock.
      if (nextAppState === "background" && !isAuthenticating.current) {
        if (lockTimer.current) clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => {
          isLockedRef.current = true;
          setIsLocked(true);
        }, BACKGROUND_LOCK_DELAY_MS);
      }

      if (nextAppState === "active") {
        if (lockTimer.current) {
          clearTimeout(lockTimer.current);
          lockTimer.current = null;
        }
        if (isLockedRef.current && !isAuthenticating.current) void authenticateBiometrics();
      }
    });

    return () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
      subscription.remove();
    };
  }, [authenticateBiometrics]);

  return { isLocked, authenticateBiometrics };
}
