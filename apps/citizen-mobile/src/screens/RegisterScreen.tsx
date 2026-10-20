
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
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

const PHONE_REGEX = /^(\+94|0)[0-9]{9}$/;

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAreas = async () => {
      try {
        const result = await getAreas();

        if (isMounted) {
          setAreas(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? `Could not load areas: ${err.message}`
              : 'Could not load areas. Please try again.',
          );
        }
      } finally {
        if (isMounted) {
          setAreasLoading(false);
        }
      }
    };

    void loadAreas();

    return () => {
      isMounted = false;
    };
  }, []);

  const phoneValid = PHONE_REGEX.test(phone.trim());
  const canSubmit =
    email.includes('@') &&
    password.length >= 8 &&
    fullName.trim().length > 0 &&
    phoneValid &&
    selectedArea !== null &&
    !areasLoading &&
    areas.length > 0;

  const handleRegister = async () => {
    setError(null);
    setLoading(true);

    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        areaId: selectedArea!.id,
      });
    } catch (err) {
      console.error('REGISTER ERROR:', err);

      const message =
        err instanceof ApiError
          ? `${err.message} (Status: ${err.status})`
          : err instanceof Error
            ? err.message
            : String(err);

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="mb-6 mt-3 items-center">
        <View className="mb-3.5 h-[60px] w-[60px] items-center justify-center rounded-[20px] border border-green-200 bg-[#ECFDF3]">
          <Text className="text-[28px]">♻️</Text>
        </View>

        <Text
          className="text-[28px] font-extrabold"
          style={{ color: colors.textPrimary }}
        >
          Create account
        </Text>

        <Text
          className="mt-1.5 px-3 text-center text-sm leading-5"
          style={{ color: colors.textSecondary }}
        >
          Join EcoCollect to schedule pickups and report issues
        </Text>
      </View>

      <View
        className="rounded-[20px] border p-[18px]"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <Text
          className="mb-3 text-sm font-bold"
          style={{ color: colors.primary }}
        >
          About you
        </Text>

        <TextField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          placeholder="e.g. Nimal Perera"
        />

        <TextField
          label="Mobile number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholder="07X XXX XXXX or +94XXXXXXXXX"
        />

        <View
          className="mb-4 mt-1.5 h-px"
          style={{ backgroundColor: colors.border }}
        />

        <Text
          className="mb-3 text-sm font-bold"
          style={{ color: colors.primary }}
        >
          Sign-in details
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          placeholder="At least 8 characters"
        />

        <View
          className="mb-4 mt-1.5 h-px"
          style={{ backgroundColor: colors.border }}
        />

        <Text
          className="mb-3 text-sm font-bold"
          style={{ color: colors.primary }}
        >
          Your area
        </Text>

        <Text
          className="mb-2 text-[13px] font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Select your area
        </Text>

        <Pressable
          className="mb-4 min-h-[52px] flex-row items-center justify-between rounded-[10px] border px-[14px]"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
          onPress={() => setAreaModalVisible(true)}
          disabled={areasLoading || areas.length === 0}
        >
          {areasLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text
              className="flex-1 text-[15px]"
              style={{
                color: selectedArea
                  ? colors.textPrimary
                  : colors.textSecondary,
              }}
            >
              {selectedArea?.name ?? 'Choose your area'}
            </Text>
          )}

          <Text
            className="ml-3 text-xs"
            style={{ color: colors.textSecondary }}
          >
            ▼
          </Text>
        </Pressable>

        <Modal
          visible={areaModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAreaModalVisible(false)}
        >
          <Pressable
            className="flex-1 justify-center bg-black/45 p-6"
            onPress={() => setAreaModalVisible(false)}
          >
            <Pressable
              className="rounded-2xl p-5"
              style={{ backgroundColor: colors.surface }}
              onPress={(event) => event.stopPropagation()}
            >
              <Text
                className="mb-3 text-lg font-bold"
                style={{ color: colors.textPrimary }}
              >
                Choose your area
              </Text>

              {areas.map((area) => (
                <Pressable
                  key={area.id}
                  className="min-h-12 flex-row items-center justify-between border-b"
                  style={{ borderBottomColor: colors.border }}
                  onPress={() => {
                    setSelectedArea(area);
                    setAreaModalVisible(false);
                    setError(null);
                  }}
                >
                  <Text
                    className="flex-1 text-[15px]"
                    style={{ color: colors.textPrimary }}
                  >
                    {area.name}
                  </Text>

                  {selectedArea?.id === area.id ? (
                    <Text
                      className="ml-3 text-lg font-bold"
                      style={{ color: colors.primary }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              ))}

              {areas.length === 0 && !areasLoading ? (
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  No areas available. Please try again.
                </Text>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>

        {error ? (
          <View className="mb-3.5 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5">
            <Text
              className="text-[13px] leading-[18px]"
              style={{ color: colors.error }}
            >
              {error}
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
        <Text
          className="text-sm"
          style={{ color: colors.textSecondary }}
        >
          Already have an account?{' '}
        </Text>

        <Text
          className="text-sm font-bold"
          style={{ color: colors.primary }}
          onPress={() => navigation.navigate('Login')}
        >
          Sign in
        </Text>
      </View>
    </ScreenContainer>
  );
}
