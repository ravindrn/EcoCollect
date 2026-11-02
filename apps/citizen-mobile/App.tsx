import "./global.css";

import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import { AuthProvider } from "./src/contexts/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

// App එක foreground එකේ තිබෙන විට notifications පෙන්වීම.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  useEffect(() => {
    // App එකට notification එකක් ලැබුණු විට.
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] Notification received:", notification);
      },
    );

    // User notification එක click කළ විට.
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        console.log("[Push] Notification opened:", data);

        // ඉදිරියේදී announcement screen එකට navigate කරන්න මෙතැන භාවිතා කළ හැකියි.
      });

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
