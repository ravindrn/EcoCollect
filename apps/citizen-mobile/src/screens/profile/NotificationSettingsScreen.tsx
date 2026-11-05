
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { ScreenContainer } from "../../components/ScreenContainer";
import { AppHeader } from "../../components/AppHeader";
import { api } from "../../services/http";
import { colors } from "../../theme/colors";

type NotificationSettings = {
  pushEnabled: boolean;
  importantAnnouncements: boolean;
  urgentAnnouncements: boolean;
  collectionReminders: boolean;
  complaintUpdates: boolean;
};

type SettingKey = keyof NotificationSettings;

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  importantAnnouncements: true,
  urgentAnnouncements: true,
  collectionReminders: true,
  complaintUpdates: true,
};

const SETTING_ITEMS: {
  key: SettingKey;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "pushEnabled",
    title: "Push Notifications",
    description: "Enable or disable all EcoCollect notifications.",
    icon: "🔔",
  },
  {
    key: "importantAnnouncements",
    title: "Important Announcements",
    description: "Receive important notices from the local authority.",
    icon: "📢",
  },
  {
    key: "urgentAnnouncements",
    title: "Urgent Announcements",
    description: "Receive urgent alerts and emergency notices.",
    icon: "🚨",
  },
  {
    key: "collectionReminders",
    title: "Collection Reminders",
    description: "Get reminders about your waste collection schedule.",
    icon: "🗓️",
  },
  {
    key: "complaintUpdates",
    title: "Complaint Updates",
    description: "Receive updates when your complaints change status.",
    icon: "📋",
  },
];

export function NotificationSettingsScreen() {
  const navigation = useNavigation();

  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SettingKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        setError(null);

        const response = await api.get<NotificationSettings>(
          "/users/me/notification-settings",
          { auth: true },
        );

        if (active) {
          setSettings(response);
        }
      } catch (err) {
        console.error("[NotificationSettings] Load failed:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load notification settings.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updateSetting = async (
    key: SettingKey,
    value: boolean,
  ) => {
    const previousSettings = settings;
    const updatedSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(updatedSettings);
    setSavingKey(key);

    try {
      const response = await api.patch<NotificationSettings>(
        "/users/me/notification-settings",
        { [key]: value },
        { auth: true },
      );

      setSettings(response);
    } catch (err) {
      console.error("[NotificationSettings] Update failed:", err);

      setSettings(previousSettings);

      Alert.alert(
        "Update Failed",
        err instanceof Error
          ? err.message
          : "Unable to save your notification preference.",
      );
    } finally {
      setSavingKey(null);
    }
  };

  const sectionTitle = (title: string) => (
    <View className="mb-4 flex-row items-center gap-2.5">
      <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
      <Text className="text-[17px] font-extrabold text-slate-900">
        {title}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <View className="items-center rounded-3xl border border-gray-100 bg-white px-8 py-8 shadow-sm">
            <ActivityIndicator size="large" color={colors.primary} />

            <Text className="mt-3 text-sm font-medium text-slate-500">
              Loading notification settings...
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
        }}
      >
        <AppHeader onNotificationPress={() => {}} />

        {/* Page Header */}
        <View className="mb-5 mt-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mb-5 self-start rounded-full bg-white px-4 py-2"
            accessibilityRole="button"
          >
            <Text className="font-semibold text-slate-700">
              ← Back
            </Text>
          </Pressable>

          <Text className="text-2xl font-extrabold text-slate-900">
            Notification Settings
          </Text>

          <Text className="mt-2 text-sm leading-6 text-slate-500">
            Manage the notifications you receive from EcoCollect.
          </Text>
        </View>

        {/* Hero Card */}
        <View className="mb-6 overflow-hidden rounded-3xl bg-emerald-600 p-5 shadow-md">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />

          <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Text className="text-3xl">🔔</Text>
          </View>

          <Text className="text-xl font-extrabold text-white">
            Stay Updated!
          </Text>

          <Text className="mt-2 text-sm leading-6 text-emerald-50">
            Choose which notifications you want to receive about waste
            collection, announcements and complaint updates.
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mb-5 flex-row overflow-hidden rounded-2xl border border-red-100 bg-red-50">
            <View className="w-1.5 bg-red-500" />

            <View className="flex-1 p-4">
              <Text className="text-sm font-bold text-red-700">
                Unable to load your settings
              </Text>

              <Text className="mt-1.5 text-[13px] text-slate-600">
                {error}
              </Text>
            </View>
          </View>
        )}

        {/* Notification Preferences */}
        <Text className="mb-1 text-[17px] font-extrabold text-slate-900">
          Notification Preferences
        </Text>

        <Text className="mb-4 text-xs text-slate-500">
          Customize your notification preferences below.
        </Text>

        <View className="mb-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {SETTING_ITEMS.map((item, index) => {
            const isMasterSwitch = item.key === "pushEnabled";

            const disabled =
              (!settings.pushEnabled && !isMasterSwitch) ||
              savingKey !== null;

            return (
              <View
                key={item.key}
                className={`flex-row items-center gap-3 py-4 ${
                  index === SETTING_ITEMS.length - 1
                    ? ""
                    : "border-b border-gray-100"
                }`}
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-xl ${
                    isMasterSwitch ? "bg-emerald-100" : "bg-emerald-50"
                  }`}
                >
                  <Text className="text-lg">{item.icon}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-slate-900">
                    {item.title}
                  </Text>

                  <Text className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description}
                  </Text>
                </View>

                <View className="items-center">
                  {savingKey === item.key ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Switch
                      value={settings[item.key]}
                      onValueChange={(value) => {
                        void updateSetting(item.key, value);
                      }}
                      disabled={disabled}
                      trackColor={{
                        false: "#CBD5E1",
                        true: "#6EE7B7",
                      }}
                      thumbColor={
                        settings[item.key] ? "#059669" : "#F8FAFC"
                      }
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Information Card */}
        <View className="mb-5 flex-row overflow-hidden rounded-2xl bg-emerald-50">
          <View className="w-1.5 bg-emerald-500" />

          <View className="flex-1 flex-row items-start gap-2.5 p-4">
            <Text className="text-base">ℹ️</Text>

            <Text className="flex-1 text-[13px] leading-5 text-slate-600">
              Your notification preferences are saved to your EcoCollect
              account. Your phone's notification permission is managed
              separately in your device settings.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text className="mt-2 text-center text-xs text-slate-400">
          EcoCollect • Notification Settings
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
