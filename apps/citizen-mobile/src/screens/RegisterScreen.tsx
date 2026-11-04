import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { ApiError } from '../services/http';
import { getAreas, getPlaces } from '../services/auth';
import type { Area, Place } from '../services/auth';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+94|0)[0-9]{9}$/;

type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  place?: string;
};

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<Area | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load areas (routes) once
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await getAreas();
        if (isMounted) setAreas(result);
      } catch {
        // silent
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch places when the modal opens or filters change
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
        if (isMounted) setPlaces(result);
      } catch (err) {
        if (isMounted) {
          setGeneralError(
            err instanceof ApiError ? err.message : 'Failed to load places',
          );
        }
      } finally {
        if (isMounted) setPlacesLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [placeModalVisible, placeSearch, selectedAreaFilter]);

  const clearFieldError = (key: keyof FieldErrors) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = 'Please enter your full name.';
    else if (fullName.trim().length < 3)
      errors.fullName = 'Name must be at least 3 characters.';

    if (!phone.trim()) errors.phone = 'Please enter your mobile number.';
    else if (!PHONE_REGEX.test(phone.trim()))
      errors.phone = 'Enter a valid Sri Lankan mobile (e.g. 0712345678).';

    if (!email.trim()) errors.email = 'Please enter your email address.';
    else if (!EMAIL_REGEX.test(email.trim()))
      errors.email = 'Enter a valid email address.';

    if (!password) errors.password = 'Please choose a password.';
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters.';

    if (!selectedPlace) errors.place = 'Please select your road or junction.';

    return errors;
  };

  const canSubmit =
    !loading &&
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    phone.trim().length > 0 &&
    selectedPlace !== null;

  const handleRegister = async () => {
    setGeneralError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        placeId: selectedPlace!.id,
      });
      navigation.replace('Login', {
        justRegistered: true,
        email: email.trim(),
      } as never);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_TAKEN') {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'This email is already registered. Try signing in.',
          }));
        } else if (err.status === 400 && err.details) {
          const details = err.details as {
            fieldErrors?: Record<string, string[]>;
          };
          const backendFields = details.fieldErrors ?? {};
          const nextErrors: FieldErrors = {};
          if (backendFields.email) nextErrors.email = backendFields.email[0];
          if (backendFields.phone) nextErrors.phone = backendFields.phone[0];
          if (backendFields.password)
            nextErrors.password = backendFields.password[0];
          if (backendFields.fullName)
            nextErrors.fullName = backendFields.fullName[0];
          if (backendFields.placeId)
            nextErrors.place = 'Please select your road or junction.';
          if (Object.keys(nextErrors).length > 0) setFieldErrors(nextErrors);
          else setGeneralError(err.message);
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Could not create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>♻️</Text>
        </View>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Join EcoCollect to schedule pickups and report issues
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About you</Text>

        <TextField
          label="Full name"
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            clearFieldError('fullName');
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
            clearFieldError('phone');
          }}
          keyboardType="phone-pad"
          placeholder="07X XXX XXXX"
          error={fieldErrors.phone}
        />

        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Sign-in details</Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clearFieldError('email');
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
            clearFieldError('password');
          }}
          secureTextEntry
          placeholder="At least 8 characters"
          error={fieldErrors.password}
        />

        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Your location</Text>
        <Text style={styles.helper}>
          Search your road, junction, or landmark to be added to the correct
          collection route.
        </Text>

        <Pressable
          style={[
            styles.placeSelector,
            fieldErrors.place ? styles.placeSelectorError : null,
          ]}
          onPress={() => setPlaceModalVisible(true)}
        >
          <View style={{ flex: 1 }}>
            {selectedPlace ? (
              <>
                <Text style={styles.placeSelectedName}>
                  {selectedPlace.name}
                </Text>
                <Text style={styles.placeSelectedArea}>
                  {selectedPlace.area.name}
                </Text>
              </>
            ) : (
              <Text style={styles.placePlaceholder}>
                Choose your road / junction
              </Text>
            )}
          </View>
          <Text style={styles.dropdownArrow}>▼</Text>
        </Pressable>

        {fieldErrors.place ? (
          <Text style={styles.fieldError}>{fieldErrors.place}</Text>
        ) : null}

        {/* Place Picker Modal */}
        <Modal
          visible={placeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPlaceModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPlaceModalVisible(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Choose your area</Text>

              <TextInput
                value={placeSearch}
                onChangeText={setPlaceSearch}
                placeholder="Search e.g. kalegana, hapugala"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
              />

              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setSelectedAreaFilter(null)}
                  style={[
                    styles.chip,
                    selectedAreaFilter === null && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedAreaFilter === null && styles.chipTextActive,
                    ]}
                  >
                    All routes
                  </Text>
                </Pressable>
                {areas.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => setSelectedAreaFilter(a)}
                    style={[
                      styles.chip,
                      selectedAreaFilter?.id === a.id && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedAreaFilter?.id === a.id &&
                          styles.chipTextActive,
                      ]}
                    >
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ minHeight: 250, maxHeight: 350 }}>
                {placesLoading ? (
                  <ActivityIndicator
                    color={colors.primary}
                    style={{ marginTop: 20 }}
                  />
                ) : places.length === 0 ? (
                  <Text style={styles.noResults}>
                    No matching places. Try a different search.
                  </Text>
                ) : (
                  <FlatList
                    data={places}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <Pressable
                        style={styles.placeOption}
                        onPress={() => {
                          setSelectedPlace(item);
                          setPlaceModalVisible(false);
                          setPlaceSearch('');
                          setSelectedAreaFilter(null);
                          clearFieldError('place');
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.placeOptionName}>
                            {item.name}
                          </Text>
                          <Text style={styles.placeOptionArea}>
                            {item.area.name}
                          </Text>
                        </View>
                        {selectedPlace?.id === item.id && (
                          <Text style={styles.selectedMark}>✓</Text>
                        )}
                      </Pressable>
                    )}
                  />
                )}
              </View>

              <Pressable
                style={styles.closeBtn}
                onPress={() => setPlaceModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {generalError ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{generalError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Create account"
          onPress={handleRegister}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          Sign in
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 12, marginBottom: 24, alignItems: 'center' },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 28 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 6,
    marginBottom: 16,
  },
  placeSelector: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: colors.surface,
  },
  placeSelectorError: { borderColor: colors.error },
  placeSelectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeSelectedArea: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  placePlaceholder: { fontSize: 14, color: colors.textSecondary },
  dropdownArrow: { fontSize: 12, color: colors.textSecondary },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: 'white' },
  noResults: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  placeOption: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  placeOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeOptionArea: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectedMark: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  error: { color: colors.error, fontSize: 13, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});