import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BiometricAuth from "../../components/BiometricAuth";
import { useRouter } from "expo-router";

export default function BiometricScreen() {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BiometricAuth
        onAuthenticated={() => {
          router.replace("/(tabs)/Home");
        }}
      />
    </GestureHandlerRootView>
  );
}