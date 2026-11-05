import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/ScreenContainer";
import { AppHeader } from "../../components/AppHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/http";
import type { ProfileStackParamList } from "../../navigation/ProfileStack";
import { colors } from "../../theme/colors";
import { getProfileImageUri } from "../../services/profileService";

type ProfileData = {
  fullName: string | null;
  phone: string | null;
  address: string | null;
  wardDivision: string | null;
  profileImageUrl: string | null;
  area: {
    id: string;
    name: string;
  } | null;
};

type MeResponse = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile: ProfileData | null;
};

type ProfileNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "ProfileHome"
>;

const COLLECTION_DAYS: Record<string, string> = {
  "Route A": "Monday",
  "Route B": "Tuesday",
  "Route C": "Wednesday",
  "Route D": "Thursday",
  "Route E": "Friday",
};

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);

      const response = await api.get<MeResponse>("/users/me", {
        auth: true,
      });

      setProfile(response.profile);
    } catch (err) {
      console.error("[Profile] Failed to load profile:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load profile information.",
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        setLoading(true);
        await fetchProfile();

        if (active) {
          setLoading(false);
        }
      };

      void load();

      return () => {
        active = false;
      };
    }, [fetchProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const fullName = profile?.fullName || user?.fullName || "EcoCollect Citizen";

  const email = user?.email || "";

  const areaName = profile?.area?.name || user?.areaName || null;

  console.log("[Profile] Area name:", JSON.stringify(areaName));

  const collectionDay = areaName
    ? COLLECTION_DAYS[areaName] || "Not available"
    : "Not assigned";

  const initial = fullName.trim().charAt(0).toUpperCase();

  const showComingSoon = (feature: string) => {
    Alert.alert(feature, `${feature} feature will be available soon.`);
  };

  const sectionTitle = (titleText: string) => (
    <View className="mb-4 flex-row items-center gap-2.5">
      <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
      <Text className="text-[17px] font-extrabold text-slate-900">
        {titleText}
      </Text>
    </View>
  );

  const InfoRow = ({
    label,
    value,
    icon,
    last = false,
  }: {
    label: string;
    value?: string | null;
    icon: string;
    last?: boolean;
  }) => (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
        <Text className="text-base">{icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="mb-0.5 text-xs font-medium text-slate-400">
          {label}
        </Text>

        <Text className="text-[15px] font-semibold text-slate-900">
          {value?.trim() || "Not provided"}
        </Text>
      </View>
    </View>
  );

  const SettingsItem = ({
    title,
    icon,
    onPress,
    danger = false,
    last = false,
  }: {
    title: string;
    icon: string;
    onPress: () => void;
    danger?: boolean;
    last?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3.5 ${
        last ? "" : "border-b border-gray-100"
      }`}
      accessibilityRole="button"
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          danger ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        <Text className="text-base">{icon}</Text>
      </View>

      <Text
        className={`flex-1 text-[15px] font-semibold ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {title}
      </Text>

      <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
        <Text className="text-lg font-semibold text-slate-500">›</Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <View className="items-center rounded-3xl border border-gray-100 bg-white px-8 py-8 shadow-sm">
            <ActivityIndicator size="large" color={colors.primary} />

            <Text className="mt-3 text-sm font-medium text-slate-500">
              Loading profile...
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
        }}
      >
        <AppHeader onNotificationPress={() => {}} />

        {/* ───────────── Profile hero card ───────────── */}
        <View className="mb-5 mt-4 overflow-hidden rounded-3xl bg-emerald-600 p-5 shadow-md">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />

          <Text className="mb-4 text-[11px] font-bold uppercase tracking-wide text-emerald-50">
            My Profile
          </Text>

          <View className="flex-row items-center">
            <View className="mr-4 h-[84px] w-[84px] items-center justify-center rounded-full bg-white/25 p-1">
              <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                {profile?.profileImageUrl ? (
                  <Image
                    source={{
                      uri:
                        getProfileImageUri(profile.profileImageUrl) ??
                        undefined,
                    }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-3xl font-extrabold text-emerald-700">
                    {initial}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-1">
              <Text
                className="text-[22px] font-extrabold tracking-tight text-white"
                numberOfLines={2}
              >
                {fullName}
              </Text>

              <Text
                className="mt-1 text-[13px] text-emerald-50"
                numberOfLines={1}
              >
                {email}
              </Text>

              <View className="mt-2.5 self-start rounded-full bg-white/20 px-3 py-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-white">
                  Citizen Account
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ───────────── Error message ───────────── */}
        {error && (
          <View className="mb-5 flex-row overflow-hidden rounded-2xl border border-red-100 bg-red-50">
            <View className="w-1.5 bg-red-500" />
            <View className="flex-1 p-4">
              <Text className="text-sm font-bold text-red-700">{error}</Text>

              <Text className="mt-1.5 text-[13px] text-slate-600">
                Pull down to refresh and try again.
              </Text>
            </View>
          </View>
        )}

        {/* ───────────── Personal Information ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("Personal Information")}

          <InfoRow
            icon="👤"
            label="Full Name"
            value={profile?.fullName || user?.fullName}
          />

          <InfoRow icon="✉️" label="Email Address" value={email} />

          <InfoRow icon="📞" label="Phone Number" value={profile?.phone} />

          <InfoRow icon="🏠" label="Address" value={profile?.address} last />
        </View>

        {/* ───────────── Collection Information ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("Collection Information")}

          <Text className="mb-2 text-xs font-medium text-slate-400">
            My Collection Area
          </Text>

          <View className="mb-4 flex-row overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
            <View className="w-1.5 bg-emerald-500" />
            <View className="flex-1 flex-row items-center gap-3 p-4">
              <Text className="text-xl">📍</Text>
              <Text className="flex-1 text-xl font-extrabold text-emerald-700">
                {areaName || "Not assigned"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl bg-gray-50 px-4 py-3.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-base">🗓️</Text>
              <Text className="text-sm font-medium text-slate-500">
                Collection Day
              </Text>
            </View>

            <View className="rounded-full bg-white px-3 py-1 shadow-sm">
              <Text className="text-sm font-bold text-slate-900">
                {collectionDay}
              </Text>
            </View>
          </View>
        </View>

        {/* ───────────── Account & Settings ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("Account & Settings")}

          <SettingsItem
            icon="✏️"
            title="Edit Profile"
            onPress={() => navigation.navigate("EditProfile")}
          />

          <SettingsItem
            icon="🔔"
            title="Notification Settings"
            onPress={() => navigation.navigate("NotificationSettings")}
          />

          <SettingsItem
            icon="🔑"
            title="Change Password"
            onPress={() => navigation.navigate("ChangePassword")}
          />

          <SettingsItem
            icon="🛡️"
            title="Privacy & Security"
            onPress={() => navigation.navigate("PrivacySecurity")}
          />
          
          <SettingsItem
            icon="💬"
            title="Help & Support"
            onPress={() => navigation.navigate("HelpSupport")}
          />

          <SettingsItem
            icon="ℹ️"
            title="About EcoCollect"
            onPress={() => navigation.navigate("AboutEcoCollect")}
            last
          />
        </View>

        {/* ───────────── Log Out ───────────── */}
        <View className="rounded-3xl border border-red-100 bg-red-50/60 p-4 shadow-sm">
          <PrimaryButton
            title="Log Out"
            variant="ghost"
            onPress={() => {
              void signOut();
            }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
