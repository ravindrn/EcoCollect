import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { ApiError } from '../services/http';
import { getAreas } from '../services/auth';
import type { Area } from '../services/auth';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+94|0)[0-9]{9}$/;

type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  area?: string;
};

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [areasLoading, setAreasLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAreas = async () => {
      try {
        const result = await getAreas();
        if (isMounted) setAreas(result);
      } catch (err) {
        if (isMounted) {
          setGeneralError(
            err instanceof Error
              ? `Could not load areas: ${err.message}`
              : 'Could not load areas. Please try again.',
          );
        }
      } finally {
        if (isMounted) setAreasLoading(false);
      }
    };
    void loadAreas();
    return () => {
      isMounted = false;
    };
  }, []);

  const clearFieldError = (key: keyof FieldErrors) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!fullName.trim()) {
      errors.fullName = 'Please enter your full name.';
    } else if (fullName.trim().length < 3) {
      errors.fullName = 'Name must be at least 3 characters.';
    }
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = 'Please enter your mobile number.';
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Enter a valid Sri Lankan mobile (e.g. 0712345678 or +94712345678).';
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Please choose a password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!selectedArea) {
      errors.area = 'Please select your area.';
    }
    return errors;
  };

  const canSubmit =
    !loading &&
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    phone.trim().length > 0 &&
    selectedArea !== null &&
    !areasLoading;

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
        areaId: selectedArea!.id,
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
          if (backendFields.password) nextErrors.password = backendFields.password[0];
          if (backendFields.fullName) nextErrors.fullName = backendFields.fullName[0];
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
          placeholder="07X XXX XXXX or +94XXXXXXXXX"
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
        <Text style={styles.sectionTitle}>Your area</Text>

        <Text style={styles.fieldLabel}>Select your area</Text>

        <Pressable
          style={[
            styles.areaSelector,
            fieldErrors.area ? styles.areaSelectorError : null,
          ]}
          onPress={() => {
            setAreaModalVisible(true);
            clearFieldError('area');
          }}
          disabled={areasLoading || areas.length === 0}
        >
          {areasLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.areaSelectorText,
                !selectedArea && styles.areaPlaceholder,
              ]}
            >
              {selectedArea?.name ?? 'Choose your area'}
            </Text>
          )}
          <Text style={styles.dropdownArrow}>▼</Text>
        </Pressable>

        {fieldErrors.area ? (
          <Text style={styles.fieldError}>{fieldErrors.area}</Text>
        ) : null}

        <Modal
          visible={areaModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAreaModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setAreaModalVisible(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(event) => event.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Choose your area</Text>
              {areas.map((area) => (
                <Pressable
                  key={area.id}
                  style={styles.areaOption}
                  onPress={() => {
                    setSelectedArea(area);
                    setAreaModalVisible(false);
                    setGeneralError(null);
                    clearFieldError('area');
                  }}
                >
                  <Text style={styles.areaOptionText}>{area.name}</Text>
                  {selectedArea?.id === area.id ? (
                    <Text style={styles.selectedMark}>✓</Text>
                  ) : null}
                </Pressable>
              ))}
              {areas.length === 0 && !areasLoading ? (
                <Text style={styles.areaPlaceholder}>
                  No areas available. Please try again.
                </Text>
              ) : null}
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
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
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
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 6,
    marginBottom: 16,
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  areaSelector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    backgroundColor: colors.surface,
  },
  areaSelectorError: {
    borderColor: colors.error,
  },
  areaSelectorText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  areaPlaceholder: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
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
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  areaOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  areaOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectedMark: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});