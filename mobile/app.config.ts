import { ExpoConfig, ConfigContext } from "@expo/config";

/**
 * Dynamic Expo config so the API URL can be swapped per environment without
 * editing a JSON file.
 *
 *   Local dev           : reads extra.apiUrl from app.json as before (resolved
 *                         via the Metro LAN IP by `mobile/lib/api.ts`).
 *   Preview APK build   : set EXPO_PUBLIC_API_URL to the Vercel URL before
 *                         `eas build` or in the EAS env for the preview profile.
 *   Production AAB build: same pattern, with the production URL.
 *
 * `api.ts` already prefers `Constants.expoConfig.extra.apiUrl` when it is a
 * non-localhost absolute URL, so simply setting EXPO_PUBLIC_API_URL before the
 * build is enough to point the shipped app at production.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3010";

  return {
    ...(config as ExpoConfig),
    name: "Zarpay",
    slug: "zarpay",
    owner: "aatifali",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "zarpay",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0B2545",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "dev.zarpay.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0B2545",
      },
      package: "dev.zarpay.app",
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router", "expo-secure-store", "expo-font"],
    updates: { enabled: false },
    experiments: { typedRoutes: true },
    extra: {
      apiUrl,
      router: {},
      eas: {
        projectId: "1f5af050-aafe-48c9-80eb-11e7b721d45e",
      },
    },
  };
};
