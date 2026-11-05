
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api, ApiError } from "../../services/http";
import type { ProfileStackParamList } from "../../navigation/ProfileStack";
import { AppHeader } from "../../components/AppHeader";

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "ChangePassword"
>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "New password must contain at least 8 characters.",
      );
      return;
    }

    if (newPassword.length > 100) {
      Alert.alert(
        "Invalid Password",
        "New password cannot exceed 100 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match.",
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Invalid Password",
        "New password must be different from current password.",
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          auth: true,
        },
      );

      Alert.alert(
        "Success",
        "Your password has been changed successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert("Password Change Failed", error.message);
      } else {
        Alert.alert(
          "Error",
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ flexGrow: 1, padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader onNotificationPress={() => {}} />
      <View className="mb-6">
        <Pressable
          onPress={() => navigation.goBack()}
          className="mb-6 self-start rounded-full bg-white px-4 py-2"
        >
          <Text className="text-base font-semibold text-gray-700">
            ← Back
          </Text>
        </Pressable>

        <Text className="text-2xl font-bold text-gray-900">
          Change Password
        </Text>

        <Text className="mt-2 text-sm text-gray-500">
          Enter your current password and choose a new secure password.
        </Text>
      </View>

      <View className="rounded-2xl bg-white p-5">
        {/* Current Password */}
        <Text className="mb-2 font-semibold text-gray-700">
          Current Password
        </Text>

        <View className="mb-5 flex-row items-center rounded-xl border border-gray-200 px-3">
          <TextInput
            className="flex-1 py-3 text-gray-900"
            placeholder="Enter current password"
            placeholderTextColor="#9CA3AF"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            autoCapitalize="none"
          />

          <Pressable
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            <Text className="text-sm font-semibold text-green-700">
              {showCurrentPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
        </View>

        {/* New Password */}
        <Text className="mb-2 font-semibold text-gray-700">
          New Password
        </Text>

        <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 px-3">
          <TextInput
            className="flex-1 py-3 text-gray-900"
            placeholder="Enter new password"
            placeholderTextColor="#9CA3AF"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
          />

          <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
            <Text className="text-sm font-semibold text-green-700">
              {showNewPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
        </View>

        <Text className="mb-5 text-xs text-gray-500">
          Password must contain at least 8 characters.
        </Text>

        {/* Confirm Password */}
        <Text className="mb-2 font-semibold text-gray-700">
          Confirm New Password
        </Text>

        <View className="mb-6 flex-row items-center rounded-xl border border-gray-200 px-3">
          <TextInput
            className="flex-1 py-3 text-gray-900"
            placeholder="Confirm new password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />

          <Pressable
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text className="text-sm font-semibold text-green-700">
              {showConfirmPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleChangePassword}
          disabled={loading}
          className={`items-center rounded-xl py-4 ${
            loading ? "bg-green-400" : "bg-green-700"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-bold text-white">
              Update Password
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
