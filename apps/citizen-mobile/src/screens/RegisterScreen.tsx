import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { ApiError } from '../services/http';
import type { AuthStackParamList } from '../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const PHONE_REGEX = /^(\+94|0)[0-9]{9}$/;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wardDivision, setWardDivision] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phoneValid = PHONE_REGEX.test(phone.trim());
  const canSubmit =
    email.includes('@') &&
    password.length >= 8 &&
    fullName.trim().length > 0 &&
    phoneValid;

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        wardDivision: wardDivision.trim() || undefined,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to create account';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Join EcoCollect to schedule pickups and report issues
        </Text>
      </View>

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

      <TextField
        label="Ward / Division (optional)"
        value={wardDivision}
        onChangeText={setWardDivision}
        placeholder="e.g. Bope"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title="Create account"
        onPress={handleRegister}
        loading={loading}
        disabled={!canSubmit}
      />

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
  header: { marginTop: 12, marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  error: { color: colors.error, marginBottom: 12, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600' },
});