
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { ApiError } from "../services/http";
import { getAreas, getPlaces } from "../services/auth";
import type { Area, Place } from "../services/auth";
import type { AuthStackParamList } from "../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+94|0)[0-9]{9}$/;

type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  place?: string;
};

// Display Area A as Route A, Area B as Route B, etc.
const getRouteName = (areaName: string) => {
  return areaName.replace(/^Area\s*/i, "Route ");
};

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaFilter, setSelectedAreaFilter] =
    useState<Area | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [placeSearch, setPlaceSearch] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load areas (routes) once
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const result = await getAreas();

        console.log("AREAS API RESULT:", result);

        if (isMounted) {
          setAreas(result);
        }
      } catch (err) {
        console.error("Failed to load areas:", err);

        if (isMounted) {
          setGeneralError(
            err instanceof Error ? err.message : "Failed to load areas",
          );
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch places when modal opens or filters/search changes
  useEffect(() => {
    if (!placeModalVisible) return;

    let isMounted = true;

    setPlacesLoading(true);

    (async () => {
      try {
        const result = await getPlaces({
          q: placeSearch.trim() || undefined,
          areaId: selectedAreaFilter?.id,
          limit: 200,
        });

        console.log("PLACES API RESULT:", result);

        if (isMounted) {
          setPlaces(result);
        }
      } catch (err) {
        if (isMounted) {
          setGeneralError(
            err instanceof ApiError ? err.message : "Failed to load places",
          );
        }
      } finally {
        if (isMounted) {
          setPlacesLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [placeModalVisible, placeSearch, selectedAreaFilter]);

  const clearFieldError = (key: keyof FieldErrors) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    }
  };

  // Validate all fields
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = "Please enter your full name.";
    } else if (fullName.trim().length < 3) {
      errors.fullName = "Name must be at least 3 characters.";
    }

    if (!phone.trim()) {
      errors.phone = "Please enter your mobile number.";
    } else if (!PHONE_REGEX.test(phone.trim())) {
      errors.phone =
        "Enter a valid Sri Lankan mobile (e.g. 0712345678).";
    }

    if (!email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Please choose a password.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!selectedPlace) {
      errors.place = "Please select your road or junction.";
    }

    return errors;
  };

  // Button remains clickable until registration starts
  const canSubmit = !loading;

  const handleRegister = async () => {
    setGeneralError(null);

    const errors = validate();
    setFieldErrors(errors);

    // Stop registration if any validation error exists
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        placeId: selectedPlace!.id,
      });

      navigation.replace("Login", {
        justRegistered: true,
        email: email.trim(),
      } as never);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_TAKEN") {
          setFieldErrors((prev) => ({
            ...prev,
            email: "This email is already registered. Try signing in.",
          }));
        } else if (err.status === 400 && err.details) {
          const details = err.details as {
            fieldErrors?: Record<string, string[]>;
          };

          const backendFields = details.fieldErrors ?? {};
          const nextErrors: FieldErrors = {};

          if (backendFields.email) {
            nextErrors.email = backendFields.email[0];
          }

          if (backendFields.phone) {
            nextErrors.phone = backendFields.phone[0];
          }

          if (backendFields.password) {
            nextErrors.password = backendFields.password[0];
          }

          if (backendFields.fullName) {
            nextErrors.fullName = backendFields.fullName[0];
          }

          if (backendFields.placeId) {
            nextErrors.place = "Please select your road or junction.";
          }

          if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
          } else {
            setGeneralError(err.message);
          }
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Could not create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow pb-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-3 mb-6 items-center">
            <View className="mb-3.5 h-[60px] w-[60px] items-center justify-center rounded-[20px] border border-green-200 bg-green-50">
              <Text className="text-[28px]">♻️</Text>
            </View>

            <Text className="text-[28px] font-extrabold text-gray-900">
              Create account
            </Text>

            <Text className="mt-1.5 px-3 text-center text-sm leading-5 text-gray-500">
              Join EcoCollect to schedule pickups and report issues
            </Text>
          </View>

          <View className="rounded-[20px] border border-gray-200 bg-white p-[18px]">
            <Text className="mb-3 text-sm font-bold text-green-700">
              About you
            </Text>

            <TextField
              label="Full name"
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                clearFieldError("fullName");
              }}
              autoCapitalize="words"
              placeholder="e.g. Nimal Perera"
              error={fieldErrors.fullName}
            />

            <TextField
              label="Mobile number"
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                clearFieldError("phone");
              }}
              keyboardType="phone-pad"
              placeholder="07X XXX XXXX"
              error={fieldErrors.phone}
            />

            <View className="mb-4 mt-1.5 h-px bg-gray-200" />

            <Text className="mb-3 text-sm font-bold text-green-700">
              Sign-in details
            </Text>

            <TextField
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError("email");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              error={fieldErrors.email}
            />

            <TextField
              label="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                clearFieldError("password");
              }}
              secureTextEntry
              placeholder="At least 8 characters"
              error={fieldErrors.password}
            />

            <View className="mb-4 mt-1.5 h-px bg-gray-200" />

            <Text className="mb-3 text-sm font-bold text-green-700">
              Your location
            </Text>

            <Text className="mb-2.5 text-xs text-gray-500">
              Search your road, junction, or landmark to be added to the
              correct collection route.
            </Text>

            <Pressable
              className={`mb-1 min-h-14 flex-row items-center rounded-[10px] border bg-white px-3.5 py-2.5 ${
                fieldErrors.place ? "border-red-500" : "border-gray-200"
              }`}
              onPress={() => setPlaceModalVisible(true)}
            >
              <View className="flex-1">
                {selectedPlace ? (
                  <>
                    <Text className="text-[15px] font-semibold text-gray-900">
                      {selectedPlace.name}
                    </Text>

                    <Text className="mt-0.5 text-xs text-gray-500">
                      {getRouteName(selectedPlace.area.name)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-500">
                    Choose your road / junction
                  </Text>
                )}
              </View>

              <Text className="text-xs text-gray-500">▼</Text>
            </Pressable>

            {fieldErrors.place ? (
              <Text className="mb-3 mt-0.5 text-xs text-red-500">
                {fieldErrors.place}
              </Text>
            ) : null}

            {/* Place Picker Modal */}
            <Modal
              visible={placeModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setPlaceModalVisible(false)}
            >
              <Pressable
                className="flex-1 justify-center bg-black/45 p-5"
                onPress={() => setPlaceModalVisible(false)}
              >
                <Pressable
                  className="max-h-[88%] rounded-2xl bg-white p-[18px]"
                  onPress={(e) => e.stopPropagation()}
                >
                  <Text className="mb-3 text-lg font-bold text-gray-900">
                    Choose your road / junction
                  </Text>

                  <TextInput
                    value={placeSearch}
                    onChangeText={setPlaceSearch}
                    placeholder="Search e.g. Kalegana, Hapugala"
                    placeholderTextColor={colors.textMuted}
                    className="mb-3 rounded-[10px] border border-gray-200 bg-white px-3 py-2.5 text-[15px] text-gray-900"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {/* Route filters */}
                  <View className="mb-3 flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setSelectedAreaFilter(null)}
                      className={`rounded-full border px-3 py-1.5 ${
                        selectedAreaFilter === null
                          ? "border-green-700 bg-green-700"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          selectedAreaFilter === null
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        All
                      </Text>
                    </Pressable>

                    {areas.map((area) => (
                      <Pressable
                        key={area.id}
                        onPress={() => setSelectedAreaFilter(area)}
                        className={`rounded-full border px-3 py-1.5 ${
                          selectedAreaFilter?.id === area.id
                            ? "border-green-700 bg-green-700"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selectedAreaFilter?.id === area.id
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {getRouteName(area.name)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View className="min-h-[250px] max-h-[350px]">
                    {placesLoading ? (
                      <ActivityIndicator
                        color={colors.primary}
                        className="mt-5"
                      />
                    ) : places.length === 0 ? (
                      <Text className="mt-6 text-center text-[13px] text-gray-500">
                        No matching places. Try a different search.
                      </Text>
                    ) : (
                      <FlatList
                        data={places}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator
                        renderItem={({ item }) => (
                          <Pressable
                            className="min-h-14 flex-row items-center border-b border-gray-200 px-1 py-2.5"
                            onPress={() => {
                              setSelectedPlace(item);
                              setPlaceModalVisible(false);
                              setPlaceSearch("");
                              setSelectedAreaFilter(null);
                              clearFieldError("place");
                            }}
                          >
                            <View className="flex-1">
                              <Text className="text-[15px] font-semibold text-gray-900">
                                {item.name}
                              </Text>

                              <Text className="mt-0.5 text-xs text-gray-500">
                                {getRouteName(item.area.name)}
                              </Text>
                            </View>

                            {selectedPlace?.id === item.id && (
                              <Text className="text-xl font-extrabold text-green-700">
                                ✓
                              </Text>
                            )}
                          </Pressable>
                        )}
                      />
                    )}
                  </View>

                  <Pressable
                    className="mt-3 items-center rounded-[10px] bg-gray-100 py-2.5"
                    onPress={() => setPlaceModalVisible(false)}
                  >
                    <Text className="text-sm font-bold text-gray-900">
                      Close
                    </Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>

            {generalError ? (
              <View className="mb-3.5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5">
                <Text className="text-[13px] leading-[18px] text-red-600">
                  {generalError}
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Create account"
              onPress={handleRegister}
              loading={loading}
              disabled={!canSubmit}
            />
          </View>

          <View className="mb-3 mt-6 flex-row justify-center">
            <Text className="text-sm text-gray-500">
              Already have an account?{" "}
            </Text>

            <Text
              className="text-sm font-bold text-green-700"
              onPress={() => navigation.navigate("Login")}
            >
              Sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
