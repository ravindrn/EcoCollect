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
import { useAppTheme } from '@/hooks/useAppTheme'
import { getMyProfile } from '@/services/profile'
import { signOut } from '@/services/signOut'
import { usePreferences } from '@/stores/preferences'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
            {profile.profile?.fullName ? (
              <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>{profile.profile.fullName}</Text>
            ) : (
              <Text style={{ color: theme.colors.textPrimary, ...theme.typography.body }}>{t('profileMissing')}</Text>
            )}
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption, marginTop: theme.spacing.md }}>
              {t('email')}
            </Text>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong }}>{profile.email}</Text>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption, marginTop: theme.spacing.md }}>
              {t('profileRole')}
            </Text>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong }}>
              {profile.role === 'DRIVER' ? t('roleDriver') : profile.role}
            </Text>
          </View>
        ) : null}
      </Card>
      <Card delay={80}>
        <LanguageChoices />
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption, marginBottom: theme.spacing.sm }}>
          {t('appearance')}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <ModeChoice label={t('lightMode')} selected={mode === 'light'} onPress={() => setMode('light')} />
          <ModeChoice label={t('darkMode')} selected={mode === 'dark'} onPress={() => setMode('dark')} />
        </View>
      </Card>
      <View style={{ marginHorizontal: theme.spacing.screen }}>
        <PrimaryButton label={t('signOut')} tone="danger" onPress={() => void onSignOut()} />
      </View>
    </Screen>
  )
}

function ModeChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme()
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: theme.touchTarget.minHeight,
        minWidth: theme.touchTarget.minWidth,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.md,
        borderWidth: theme.strokes.strong,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label }}>{label}</Text>
    </PressableScale>
  )
}
