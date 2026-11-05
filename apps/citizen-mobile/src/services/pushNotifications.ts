
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "./http";

export async function registerForPushNotifications(): Promise<void> {
  // Push notifications Android/iOS සඳහා පමණයි.
  if (Platform.OS === "web") return;

  try {
    // Android notification channel එක සකස් කිරීම.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("announcements", {
        name: "Announcements",
        importance: Notifications.AndroidImportance.MAX,
        //sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Notification permission ලබාගැනීම.
    let permission = await Notifications.getPermissionsAsync();

    if (!permission.granted) {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (!permission.granted) {
      console.log("[Push] Notification permission denied.");
      return;
    }

    // EAS project ID එක ලබාගැනීම.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    // Expo Push Token එක ලබාගැනීම.
    const tokenResult = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const expoPushToken = tokenResult.data;

    console.log("[Push] Expo Push Token:", expoPushToken);

    // Backend එකට token එක save කිරීම.
    await api.post(
      "/users/push-token",
      { expoPushToken },
      { auth: true },
    );

    console.log("[Push] Token registered successfully.");
  } catch (error) {
    // Push registration failure එකක් නිසා login එක fail වෙන්න දෙන්නේ නැහැ.
    console.error("[Push] Registration failed:", error);
  }
}
