import * as LocalAuthentication from "expo-local-authentication";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


type Props = {
  onAuthenticated: () => void;
};

export default function BiometricAuth({ onAuthenticated }: Props) {
  const [biometricSupported, setBiometricSupported] = useState(false);

  const checkDeviceForBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricSupported(hasHardware && isEnrolled);
  };

  // ✅ Wrap handleAuthenticate in useCallback to avoid hook warning
  const handleAuthenticate = useCallback(async () => {
    if (!biometricSupported) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock TED Space",
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      onAuthenticated();
    }
  }, [biometricSupported, onAuthenticated]);

  useEffect(() => {
    if (biometricSupported) {
      handleAuthenticate();
    }
  }, [biometricSupported, handleAuthenticate]);

  // 🔹 Check if biometrics are supported
  useEffect(() => {
    checkDeviceForBiometrics();
  }, []);

  // 🔹 Auto-prompt when available
  useEffect(() => {
    if (biometricSupported) {
      handleAuthenticate();
    }
  }, [biometricSupported, handleAuthenticate]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TED Space</Text>
      {biometricSupported ? (
        <TouchableOpacity style={styles.button} onPress={handleAuthenticate}>
          <Text style={styles.buttonText}>
            Unlock with Face ID / Fingerprint
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.text}>Biometric authentication not available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
    color: "#4f46e5",
  },
  text: { fontSize: 16, color: "#6b7280", marginTop: 10 },
  button: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 22,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
