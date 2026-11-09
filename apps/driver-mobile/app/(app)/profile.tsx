import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LanguageChoices } from '@/components/LanguageChoices'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { PressableScale } from '@/components/ui/PressableScale'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { Skeleton } from '@/components/ui/Skeleton'
import { getMyProfile } from '@/services/profile'
import { signOut } from '@/services/signOut'
import { usePreferences } from '@/stores/preferences'
import { colors } from '@/theme/colors'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const mode = usePreferences((state) => state.mode)
  const setMode = usePreferences((state) => state.setMode)
  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMyProfile,
  })
  const profile = profileQuery.data

  async function onSignOut() {
    await signOut()
    router.replace('/login')
  }

  const initial = (profile?.profile?.fullName || profile?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <Screen>
      <GradientHeader title={t('profileTitle')} back />
      <Card>
        {profileQuery.isPending ? <Skeleton label={t('loading')} /> : null}
        {profileQuery.isError ? (
          <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} />
        ) : null}
        {profile ? (
          <View>
            <View className="mb-4 items-center">
              <View
                className="mb-3 h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-[34px] font-bold text-white">{initial}</Text>
              </View>
              {profile.profile?.fullName ? (
                <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {profile.profile.fullName}
                </Text>
              ) : (
                <Text className="text-[15px]" style={{ color: colors.textSecondary }}>
                  {t('profileMissing')}
                </Text>
              )}
            </View>

            <View className="my-3 h-px" style={{ backgroundColor: colors.border }} />

            <Text
              className="mb-1 text-xs uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              {t('email')}
            </Text>
            <Text className="mb-3.5 text-[15px]" style={{ color: colors.textPrimary }}>
              {profile.email}
            </Text>

            <View className="my-3 h-px" style={{ backgroundColor: colors.border }} />

            <Text
              className="mb-1 text-xs uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              {t('profileRole')}
            </Text>
            <Text className="text-[15px]" style={{ color: colors.textPrimary }}>
              {profile.role === 'DRIVER' ? t('roleDriver') : profile.role}
            </Text>
          </View>
        ) : null}
      </Card>
      <Card delay={80}>
        <LanguageChoices />
        <Text
          className="mb-2 text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          {t('appearance')}
        </Text>
        <View className="flex-row gap-2">
          <ModeChoice label={t('lightMode')} selected={mode === 'light'} onPress={() => setMode('light')} />
          <ModeChoice label={t('darkMode')} selected={mode === 'dark'} onPress={() => setMode('dark')} />
        </View>
      </Card>
      <View className="mx-4">
        <PrimaryButton label={t('signOut')} tone="danger" onPress={() => void onSignOut()} />
      </View>
    </Screen>
  )
}

function ModeChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  // PressableScale keeps a plain `style` prop (its className support is unknown).
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 48,
        minWidth: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryLight : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: selected ? colors.primary : colors.textPrimary }}
      >
        {label}
      </Text>
    </PressableScale>
  )
}