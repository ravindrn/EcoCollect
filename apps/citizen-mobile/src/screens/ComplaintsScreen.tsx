import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { ComplaintMap } from "../components/complaints/ComplaintMap";
import type { ComplaintLocation } from "../types/complaint";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { api, ApiError } from "../services/http";
import { AppHeader } from "../components/AppHeader";

const CATEGORIES = [
  "Garbage not collected",
  "Missed collection schedule",
  "Illegal dumping",
  "Overflowing public bin",
  "Waste collection vehicle issue",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

type ComplaintResponse = {
  id: string;
  category: string;
  title: string;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
  photoUrl?: string | null;
};

export function ComplaintsScreen() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<ComplaintLocation | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<ComplaintLocation | null>(null);

  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const titleError = !title.trim()
    ? "Please enter a complaint title."
    : title.trim().length > 100
      ? "Title must be 100 characters or less."
      : "";

  const descriptionError = !description.trim()
    ? "Please describe the problem."
    : description.trim().length > 1000
      ? "Description must be 1000 characters or less."
      : "";

  const categoryError = !category ? "Please select a complaint category." : "";

  const locationError =
    !isAnonymous && !location
      ? "Please choose the complaint location on the map."
      : "";

  const getCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      throw new Error("Please allow location permission to continue.");
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  };

  const openMap = async () => {
    try {
      setGettingLocation(true);

      const current = location ?? (await getCurrentLocation());

      setLocation(current);
      setMapRegion(current);
      setMapVisible(true);
    } catch (error) {
      Alert.alert(
        "Location unavailable",
        error instanceof Error
          ? error.message
          : "Could not access your location.",
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const confirmMapLocation = () => {
    if (!location) {
      Alert.alert(
        "Select a location",
        "Tap the map to place a marker at the complaint location.",
      );
      return;
    }

    setMapVisible(false);
  };

  const pickPhoto = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          useCamera
            ? "Allow camera access to take a photo."
            : "Allow photo library access to choose a photo.",
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.7,
          });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Photo unavailable", "Could not select the photo.");
    }
  };

  const choosePhotoSource = () => {
    if (Platform.OS === "web") {
      void pickPhoto(false);
      return;
    }

    Alert.alert("Attach a photo", "Choose how to add your photo.", [
      {
        text: "Take a photo",
        onPress: () => void pickPhoto(true),
      },
      {
        text: "Choose from gallery",
        onPress: () => void pickPhoto(false),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const submitComplaint = async () => {
    setSubmitted(true);

    if (categoryError || titleError || descriptionError || locationError) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        category: category!,
        title: title.trim(),
        description: description.trim(),
        isAnonymous,
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : null,
      };

      let result: ComplaintResponse;

      if (photoUri) {
        const formData = new FormData();

        formData.append("category", payload.category);
        formData.append("title", payload.title);
        formData.append("description", payload.description);
        formData.append("isAnonymous", String(payload.isAnonymous));
        formData.append(
          "location",
          payload.location ? JSON.stringify(payload.location) : "",
        );

        const filename =
          photoUri.split("/").pop()?.split("?")[0] ||
          `complaint-${Date.now()}.jpg`;

        if (Platform.OS === "web") {
          const photoResponse = await fetch(photoUri);

          if (!photoResponse.ok) {
            throw new Error("Could not read the selected photo.");
          }

          const photoBlob = await photoResponse.blob();

          if (
            !["image/jpeg", "image/png", "image/webp"].includes(
              photoBlob.type.toLowerCase(),
            )
          ) {
            throw new Error("Please select a JPG, PNG, or WEBP image.");
          }

          formData.append("photo", photoBlob, filename);
        } else {
          const extension = filename.split(".").pop()?.toLowerCase();

          const mimeType =
            extension === "png"
              ? "image/png"
              : extension === "webp"
                ? "image/webp"
                : "image/jpeg";

          formData.append("photo", {
            uri: photoUri,
            name: filename,
            type: mimeType,
          } as any);
        }

        result = await api.postFormData<ComplaintResponse>(
          "/complaints",
          formData,
          { auth: true },
        );
      } else {
        result = await api.post<ComplaintResponse>("/complaints", payload, {
          auth: true,
        });
      }

      const message = "Your complaint has been submitted successfully!";

      if (Platform.OS === "web") {
        window.alert(message);
         resetForm();
      } else {
        Alert.alert("Success!", message, [
          {
            text: "OK",
            onPress: resetForm,
          },
        ]);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not submit your complaint. Please try again.";

      if (Platform.OS === "web") {
        window.alert(`Submission failed: ${message}`);
      } else {
        Alert.alert("Submission failed", message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory(null);
    setTitle("");
    setDescription("");
    setLocation(null);
    setPhotoUri(null);
    setSubmitted(false);
    setSuccessMessage("");
  };

  const sectionTitle = (number: string, titleText: string) => (
    <View className="mb-4 flex-row items-center">
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
        <Text className="text-sm font-extrabold text-white">{number}</Text>
      </View>
      <Text className="flex-1 text-[17px] font-extrabold text-slate-900">
        {titleText}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AppHeader onNotificationPress={() => {}} />
        {/* ───────────── Page header ───────────── */}
        <View className="mb-6 mt-4 overflow-hidden rounded-3xl bg-emerald-600 p-5 shadow-md">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />

          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Text className="text-xl">📝</Text>
          </View>

          <Text className="mt-4 text-[26px] font-extrabold tracking-tight text-white">
            New Complaint
          </Text>
          <Text className="mt-1 text-sm font-medium text-emerald-50">
            Report a waste-related issue
          </Text>
        </View>

        {/* ───────────── 1. Complaint Type ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("1", "Complaint Type")}

          <Pressable
            onPress={() => setIsAnonymous(false)}
            className={`mb-3 rounded-2xl border p-4 ${
              !isAnonymous
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2.5">
                <Text className="text-lg">👤</Text>
                <Text className="flex-1 text-[15px] font-bold text-slate-900">
                  Registered Complaint
                </Text>
              </View>
              <View
                className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                  !isAnonymous ? "border-emerald-600" : "border-gray-300"
                }`}
              >
                {!isAnonymous && (
                  <View className="h-3 w-3 rounded-full bg-emerald-600" />
                )}
              </View>
            </View>
            <Text className="mt-1.5 text-[13px] leading-5 text-slate-500">
              Your account is associated with the complaint.
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setIsAnonymous(true)}
            className={`rounded-2xl border p-4 ${
              isAnonymous
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2.5">
                <Text className="text-lg">🕶️</Text>
                <Text className="flex-1 text-[15px] font-bold text-slate-900">
                  Anonymous Complaint
                </Text>
              </View>
              <View
                className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                  isAnonymous ? "border-emerald-600" : "border-gray-300"
                }`}
              >
                {isAnonymous && (
                  <View className="h-3 w-3 rounded-full bg-emerald-600" />
                )}
              </View>
            </View>
            <Text className="mt-1.5 text-[13px] leading-5 text-slate-500">
              Your identity is not linked to the complaint record.
            </Text>
            <View className="mt-2 self-start rounded-full bg-gray-100 px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-slate-600">
                Location is optional in anonymous mode
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ───────────── 2. Complaint Details ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("2", "Complaint Details")}

          <Text className="mb-2 text-sm font-bold text-slate-900">
            Category *
          </Text>

          <View
            className={`mb-4 gap-2 rounded-2xl ${
              submitted && !category ? "border border-red-500 p-1.5" : ""
            }`}
          >
            {CATEGORIES.map((item) => {
              const selected = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  className={`flex-row items-center rounded-2xl border px-4 py-3.5 ${
                    selected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`flex-1 text-sm ${
                      selected
                        ? "font-bold text-emerald-800"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {item}
                  </Text>
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selected ? "border-emerald-600" : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <View className="h-3 w-3 rounded-full bg-emerald-600" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {submitted && !category && (
            <Text className="-mt-2 mb-3 text-[13px] font-medium text-red-600">
              {categoryError}
            </Text>
          )}

          <Text className="mb-2 text-sm font-bold text-slate-900">Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter complaint title"
            placeholderTextColor="#94A3B8"
            maxLength={100}
            accessibilityLabel="Complaint title"
            className={`rounded-2xl border bg-gray-50 px-4 py-3.5 text-sm text-slate-800 ${
              submitted && titleError ? "border-red-500" : "border-gray-200"
            }`}
          />
          {submitted && titleError ? (
            <Text className="mb-2 mt-1.5 text-[13px] font-medium text-red-600">
              {titleError}
            </Text>
          ) : (
            <View className="mb-4" />
          )}
          <Text className="mb-2 text-right text-xs font-medium text-slate-400">
            {title.length}/100
          </Text>

          <Text className="mb-2 text-sm font-bold text-slate-900">
            Description *
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the problem..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            maxLength={1000}
            accessibilityLabel="Complaint description"
            className={`min-h-32 rounded-2xl border bg-gray-50 px-4 py-3.5 text-sm leading-5 text-slate-800 ${
              submitted && descriptionError
                ? "border-red-500"
                : "border-gray-200"
            }`}
          />
          {submitted && descriptionError ? (
            <Text className="mt-1.5 text-[13px] font-medium text-red-600">
              {descriptionError}
            </Text>
          ) : null}
          <Text className="mt-1.5 text-right text-xs font-medium text-slate-400">
            {description.length}/1000
          </Text>
        </View>

        {/* ───────────── 3. Complaint Location ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("3", "Complaint Location")}

          <Text className="mb-3 text-[13px] leading-5 text-slate-500">
            Help the council locate the issue.
          </Text>

          <Pressable
            onPress={() => void openMap()}
            disabled={gettingLocation}
            className={`flex-row items-center justify-center gap-2 rounded-2xl px-4 py-4 ${
              submitted && locationError
                ? "border-2 border-red-500 bg-red-50"
                : "border border-emerald-500 bg-emerald-50"
            } ${gettingLocation ? "opacity-60" : ""}`}
          >
            {gettingLocation ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text className="text-base">📍</Text>
                <Text
                  className={`text-[15px] font-bold ${
                    submitted && locationError
                      ? "text-red-600"
                      : "text-emerald-700"
                  }`}
                >
                  {location
                    ? "Change location on map"
                    : "Choose location on map"}
                </Text>
              </>
            )}
          </Pressable>

          {submitted && locationError !== "" ? (
            <Text className="mt-2 text-[13px] font-medium text-red-600">
              {String(locationError)}
            </Text>
          ) : null}

          <View className="mt-3 self-start rounded-full bg-gray-100 px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-slate-600">
              Registered: required · Anonymous: optional
            </Text>
          </View>

          {location && (
            <View className="mt-3 flex-row overflow-hidden rounded-2xl bg-emerald-50">
              <View className="w-1.5 bg-emerald-500" />
              <View className="flex-1 p-3.5">
                <Text className="text-sm font-bold text-emerald-800">
                  Location selected
                </Text>
                <Text className="mt-1 text-xs text-slate-600">
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
                <Pressable
                  onPress={() => setLocation(null)}
                  className="mt-2.5 self-start rounded-full border border-emerald-200 bg-white px-3 py-1.5"
                >
                  <Text className="text-[13px] font-bold text-emerald-700">
                    Remove location
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ───────────── 4. Attach Photo ───────────── */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          {sectionTitle("4", "Attach Photo (Optional)")}

          <Pressable
            onPress={choosePhotoSource}
            className="items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-4 py-6"
          >
            <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Text className="text-2xl">📷</Text>
            </View>
            <Text className="mb-1 text-center text-[15px] font-bold text-emerald-700">
              {photoUri
                ? "Change photo"
                : "Take a photo or choose from gallery"}
            </Text>
            <Text className="text-center text-xs leading-5 text-slate-500">
              Avoid including faces or personal information.
            </Text>
          </Pressable>

          {photoUri && (
            <View className="mt-3">
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: 190, borderRadius: 16 }}
                resizeMode="cover"
                accessibilityLabel="Selected complaint photo"
              />
              <View className="mt-3 flex-row items-center justify-between gap-2">
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  className="rounded-full border border-red-200 bg-red-50 px-3.5 py-2"
                >
                  <Text className="text-[13px] font-bold text-red-600">
                    Remove photo
                  </Text>
                </Pressable>
                <Text className="flex-1 text-right text-xs leading-5 text-slate-500">
                  Photo will be uploaded with your complaint.
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text className="mb-3 ml-1 text-xs font-medium text-slate-500">
          * Required fields
        </Text>

        <Pressable
          onPress={() => void submitComplaint()}
          disabled={submitting || gettingLocation}
          className={`mb-4 min-h-14 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-4 shadow-md ${
            submitting || gettingLocation ? "opacity-60" : ""
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">
              Submit Complaint
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* ───────────── Map location picker ───────────── */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        onRequestClose={() => setMapVisible(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-100 px-5 pb-4 pt-5">
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-slate-900">
                Select location
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                Tap the map where the problem occurred.
              </Text>
            </View>
            <Pressable
              onPress={() => setMapVisible(false)}
              className="rounded-full bg-gray-100 px-4 py-2"
            >
              <Text className="text-sm font-bold text-slate-700">Cancel</Text>
            </Pressable>
          </View>

          {mapRegion && (
            <ComplaintMap
              initialLocation={location ?? mapRegion}
              onConfirm={(selectedLocation) => {
                setLocation(selectedLocation);
                setMapRegion(selectedLocation);
                setMapVisible(false);
              }}
              onCancel={() => setMapVisible(false)}
            />
          )}

          <View className="rounded-t-3xl border-t border-gray-100 bg-white p-4">
            {location && (
              <View className="mb-3 self-start rounded-full bg-emerald-50 px-3 py-1.5">
                <Text className="text-xs font-semibold text-emerald-700">
                  📍 {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            <Pressable
              onPress={confirmMapLocation}
              className="items-center rounded-2xl bg-emerald-600 px-4 py-4"
            >
              <Text className="text-base font-bold text-white">
                Confirm location
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
