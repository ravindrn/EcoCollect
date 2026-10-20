
import { useState } from 'react';
import { Text, View } from 'react-native';
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
      <View className="mb-7 mt-6 items-center">
        <View className="mb-3 h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-green-200 bg-[#ECFDF3]">
          <Text className="text-[32px]">🌿</Text>
        </View>

        <Text
          className="mb-[18px] text-sm font-bold"
          style={{ color: colors.primary }}
        >
          EcoCollect
        </Text>

        <Text className="text-[28px] font-extrabold text-slate-900">
          Welcome back
        </Text>

        <Text className="mt-1.5 text-center text-sm text-slate-500">
          Sign in to manage your pickups
        </Text>
      </View>

      <View
        className="rounded-[20px] border p-[18px]"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
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
          title="Sign in"
          onPress={handleLogin}
          loading={loading}
          disabled={!email || !password}
        />
      </View>

      <View className="mb-3 mt-6 flex-row justify-center">
        <Text
          className="text-sm"
          style={{ color: colors.textSecondary }}
        >
          New here?{' '}
        </Text>

        <Text
          className="text-sm font-bold"
          style={{ color: colors.primary }}
          onPress={() => navigation.navigate('Register')}
        >
          Create an account
        </Text>
      </View>
    </ScreenContainer>
  );
}
