import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { ApiError } from '../services/http';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ route, navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const params = (route.params ?? {}) as {
    justRegistered?: boolean;
    email?: string;
  };

  useEffect(() => {
    if (params.justRegistered) {
      setSuccessMessage('Account created. Please sign in.');
      if (params.email) setEmail(params.email);
    }
  }, [params.justRegistered, params.email]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Please enter your email.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Please enter your password.';
    }
    return errors;
  };

  const handleLogin = async () => {
    setGeneralError(null);
    setSuccessMessage(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setGeneralError('Incorrect email or password. Please try again.');
      } else if (err instanceof ApiError) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to EcoCollect</Text>
      </View>

      {successMessage ? (
        <View style={styles.successBox}>
          <Text style={styles.success}>{successMessage}</Text>
        </View>
      ) : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (fieldErrors.email) {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }
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
          if (fieldErrors.password) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        secureTextEntry
        placeholder="••••••••"
        error={fieldErrors.password}
      />

      {generalError ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{generalError}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title="Sign in"
        onPress={handleLogin}
        loading={loading}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New here? </Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('Register')}
        >
          Create an account
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  successBox: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  success: { color: colors.success, fontSize: 13, lineHeight: 18 },
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
    marginTop: 20,
  },
  footerText: { color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600' },
});