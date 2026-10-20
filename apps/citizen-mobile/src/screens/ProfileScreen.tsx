
import { Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  const initial = (user?.fullName || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <ScreenContainer>
      <View className="mb-6 mt-4 items-center">
        <View
          className="mb-3 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-[34px] font-bold text-white">
            {initial}
          </Text>
        </View>

        <Text
          className="text-xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          {user?.fullName ?? 'EcoCollect Citizen'}
        </Text>

        <Text
          className="mt-1 text-sm"
          style={{ color: colors.textSecondary }}
        >
          {user?.email}
        </Text>
      </View>

      <View
        className="rounded-2xl border p-[18px]"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <Text
          className="mb-1 text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          Role
        </Text>

        <Text
          className="mb-3.5 text-[15px]"
          style={{ color: colors.textPrimary }}
        >
          {user?.role}
        </Text>

        <View
          className="my-3 h-px"
          style={{ backgroundColor: colors.border }}
        />

        <Text
          className="mb-1 text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          Account ID
        </Text>

        <Text
          className="text-xs"
          style={{
            color: colors.textSecondary,
            fontFamily: 'monospace',
          }}
        >
          {user?.id}
        </Text>
      </View>

      <View className="flex-1" />

      <PrimaryButton
        title="Sign out"
        variant="ghost"
        onPress={signOut}
      />
    </ScreenContainer>
  );
}
