
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View,
  Image,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { TextField } from "../../components/TextField";
import { colors } from "../../theme/colors";
import type { ProfileStackParamList } from "../../navigation/ProfileStack";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
  getProfileImageUri,
} from "../../services/profileService";
import * as ImagePicker from "expo-image-picker";
import { AppHeader } from "../../components/AppHeader";

type EditProfileNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "EditProfile"
>;

export function EditProfileScreen() {
  const navigation = useNavigation<EditProfileNavigationProp>();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wardDivision, setWardDivision] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await getMyProfile();

        if (!active) return;

        const profile = response.profile;

        if (profile) {
          setFullName(profile.fullName ?? "");
          setPhone(profile.phone ?? "");
          setAddress(profile.address ?? "");
          setWardDivision(profile.wardDivision ?? "");
          setProfileImageUrl(getProfileImageUri(profile.profileImageUrl));
        }
      } catch (error) {
        console.error("[EditProfile] Load failed:", error);

        if (active) {
          Alert.alert(
            "Error",
            error instanceof Error
              ? error.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleChoosePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access to select a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open your photo gallery.");
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) {
      Alert.alert("Select Photo", "Please select a photo first.");
      return;
    }

    setUploadingPhoto(true);

    try {
      const result = await uploadProfilePicture({
        uri: selectedPhoto.uri,
        fileName: selectedPhoto.fileName,
        mimeType: selectedPhoto.mimeType,
      });

      setProfileImageUrl(getProfileImageUri(result.profileImageUrl));
      setSelectedPhoto(null);

      Alert.alert("Success", "Your profile picture has been updated.");
    } catch (error) {
      Alert.alert(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "Unable to upload your profile picture.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = fullName.trim();

    if (trimmedName.length < 2) {
      Alert.alert("Invalid Name", "Please enter at least 2 characters.");
      return;
    }

    if (trimmedName.length > 100) {
      Alert.alert("Invalid Name", "Full name cannot exceed 100 characters.");
      return;
    }

    const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");

    if (
      normalizedPhone &&
      !/^(?:07\d{8}|\+947\d{8}|947\d{8})$/.test(normalizedPhone)
    ) {
      Alert.alert(
        "Invalid Phone Number",
        "Enter a valid Sri Lankan mobile number, e.g. 0771234567 or +94771234567.",
      );
      return;
    }

    if (phone.trim().length > 20) {
      Alert.alert("Invalid Phone", "Phone number cannot exceed 20 characters.");
      return;
    }

    if (address.trim().length > 250) {
      Alert.alert("Invalid Address", "Address cannot exceed 250 characters.");
      return;
    }

    if (wardDivision.trim().length > 100) {
      Alert.alert(
        "Invalid Ward / Division",
        "Ward / Division cannot exceed 100 characters.",
      );
      return;
    }

    setSaving(true);

    try {
      await updateMyProfile({
        fullName: trimmedName,
        phone: normalizedPhone
          ? normalizedPhone.startsWith("07")
            ? `+94${normalizedPhone.slice(1)}`
            : normalizedPhone.startsWith("947")
              ? `+${normalizedPhone}`
              : normalizedPhone
          : null,
        address: address.trim() || null,
        wardDivision: wardDivision.trim() || null,
      });

      console.log("[EditProfile] Profile updated successfully.");

      navigation.goBack();
    } catch (error) {
      console.error("[EditProfile] Update failed:", error);

      Alert.alert(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Unable to update your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle = (titleText: string) => (
    <View className="mb-4 flex-row items-center gap-2.5">
      <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
      <Text className="text-[17px] font-extrabold text-slate-900">
        {titleText}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-4 mb-5 h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white"
          >
            <Text className="text-2xl text-slate-700">‹</Text>
          </Pressable>

          <View className="flex-1 items-center justify-center">
            <View className="items-center rounded-3xl border border-gray-100 bg-white px-8 py-8 shadow-sm">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-3 text-sm font-medium text-slate-500">
                Loading your information...
              </Text>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >

        <AppHeader onNotificationPress={() => {}} />
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          className="mb-6 self-start rounded-full bg-white px-4 py-2"
        >
          <Text className="text-base font-semibold text-gray-700">
            ← Back
          </Text>
        </Pressable>

        {/* Page header */}
        <View className="mb-5 overflow-hidden rounded-3xl bg-emerald-600 p-5 shadow-md">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />

          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Text className="text-xl">✏️</Text>
          </View>

          <Text className="mt-4 text-[26px] font-extrabold tracking-tight text-white">
            Edit Profile
          </Text>

          <Text className="mt-1 text-sm font-medium text-emerald-50">
            Update your personal information
          </Text>
        </View>

        {/* Profile photo */}
        <View className="mb-5 items-center rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="mb-3 flex-row items-center self-start">
            <View className="mr-2 h-5 w-1.5 rounded-full bg-emerald-600" />
            <Text className="text-[17px] font-extrabold text-slate-900">
              Profile Picture
            </Text>
          </View>

          <View className="h-[124px] w-[124px] items-center justify-center rounded-full bg-emerald-100 p-1.5">
            <Image
              source={{
                uri: selectedPhoto?.uri ?? profileImageUrl ?? undefined,
              }}
              className="h-full w-full rounded-full"
              style={{
                backgroundColor: colors.border,
              }}
            />
          </View>

          <Text className="mt-3 text-[13px] text-slate-500">
            {selectedPhoto
              ? "New photo selected — upload to save it"
              : "Add a clear photo of yourself"}
          </Text>

          <View className="mt-4 w-full flex-row flex-wrap items-center justify-center gap-3">
            <Pressable
              onPress={handleChoosePhoto}
              className="flex-row items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3"
            >
              <Text className="text-base">🖼️</Text>
              <Text className="text-sm font-bold text-emerald-700">
                {selectedPhoto ? "Change Selected Photo" : "Choose Profile Photo"}
              </Text>
            </Pressable>

            {selectedPhoto && (
              <Pressable
                onPress={handleUploadPhoto}
                disabled={uploadingPhoto}
                className={`flex-row items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 shadow-sm ${
                  uploadingPhoto ? "opacity-60" : ""
                }`}
              >
                <Text className="text-base">⬆️</Text>
                <Text className="text-sm font-bold text-white">
                  {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Personal details form */}
        <View className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("Personal Details")}

          <TextField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            maxLength={100}
          />

          <TextField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            maxLength={20}
          />

          <TextField
            label="Home Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your home address"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={250}
          />

          <TextField
            label="Ward / Division"
            value={wardDivision}
            onChangeText={setWardDivision}
            placeholder="Enter your ward or division"
            maxLength={100}
          />

          {/* Information note */}
          <View className="mb-5 flex-row overflow-hidden rounded-2xl bg-emerald-50">
            <View className="w-1.5 bg-emerald-500" />
            <View className="flex-1 flex-row items-start gap-2.5 p-3.5">
              <Text className="text-base">ℹ️</Text>
              <Text className="flex-1 text-[13px] leading-5 text-slate-600">
                Your assigned collection area is managed by the local
                authority. Contact the administrator if it needs to be changed.
              </Text>
            </View>
          </View>

          {/* Save button */}
          <PrimaryButton
            title="Save Changes"
            loading={saving}
            disabled={saving}
            onPress={() => {
              void handleSave();
            }}
          />

          {/* Cancel button */}
          <View className="mt-3">
            <PrimaryButton
              title="Cancel"
              variant="ghost"
              disabled={saving}
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>

        {/* Footer */}
        <View className="mt-5 items-center px-4">
          <Text className="text-center text-xs leading-5 text-slate-400">
            Keep your profile information up to date to receive accurate
            collection updates from EcoCollect.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
