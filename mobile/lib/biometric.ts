import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_KEY = "zarpay.biometric.enabled";

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" && localStorage.getItem(BIOMETRIC_KEY) === "true";
  }
  const value = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return value === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") return;
    if (enabled) localStorage.setItem(BIOMETRIC_KEY, "true");
    else localStorage.removeItem(BIOMETRIC_KEY);
    return;
  }
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, "true");
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
  }
}

export async function promptBiometric(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Zarpay",
    fallbackLabel: "Use password",
    disableDeviceFallback: false,
  });
  return result.success;
}
