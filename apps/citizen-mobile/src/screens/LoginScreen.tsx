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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to sign in';
      setError(message);
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
        textContentType="password"
        placeholder="••••••••"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title="Sign in"
        onPress={handleLogin}
        loading={loading}
        disabled={!email || !password}
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
  header: { marginTop: 12, marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  error: { color: colors.error, marginBottom: 12, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { color: colors.textSecondary },
  link: { color: colors.primary, fontWeight: '600' },
});