export default {
  expo: {
    name: "Wandr",
    slug: "tourist-attraction-app",
    version: "1.0.0",
    scheme: "wandr",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0D9488"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.wandr.explore",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Wandr needs camera access to scan and identify tourist attractions",
        NSLocationWhenInUseUsageDescription: "Wandr needs your location to find nearby attractions",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Wandr uses your location in the background to notify you when you're near an attraction",
        UIBackgroundModes: ["location", "fetch"],
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "app.wandr.explore",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0D9488"
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || ""
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    updates: {
      url: "https://u.expo.dev/9b30d187-8bd6-4466-a484-b20607a66e33"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    plugins: [
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Wandr uses your location in the background to notify you when you're near an attraction you haven't visited yet.",
          isAndroidBackgroundLocationEnabled: true
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#0D9488"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "9b30d187-8bd6-4466-a484-b20607a66e33"
      }
    },
    owner: "kaurri"
  }
};
