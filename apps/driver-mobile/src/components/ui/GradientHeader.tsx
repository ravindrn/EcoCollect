import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { useNav } from '@/components/nav/NavContext'
import { useAppTheme } from '@/hooks/useAppTheme'
import { PressableScale } from './PressableScale'

type Props = {
  title: string
  subtitle?: string
  back?: boolean
  trailing?: ReactNode
}

export function GradientHeader({ title, subtitle, back = false, trailing }: Props) {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const router = useRouter()
  const nav = useNav()
  const gradient = theme.gradients.vertical
  const ink = theme.mode === 'light' ? theme.colors.onPrimary : theme.colors.textPrimary

  return (
    <View
      style={[
        theme.shadows.lg,
        {
          backgroundColor: theme.colors.gradientStart,
          borderBottomLeftRadius: theme.radii.xl,
          borderBottomRightRadius: theme.radii.xl,
          marginBottom: theme.spacing.lg,
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientStart, theme.colors.gradientEnd]}
        locations={[0, 0.82, 1]}
        start={gradient.start}
        end={gradient.end}
        style={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          paddingHorizontal: theme.spacing.screen,
          borderBottomLeftRadius: theme.radii.xl,
          borderBottomRightRadius: theme.radii.xl,
        }}
      >
        {back ? (
          <PressableScale
            accessibilityLabel={t('tripBack')}
            onPress={() => router.back()}
            style={{
              minHeight: theme.touchTarget.minHeight,
              minWidth: theme.touchTarget.minWidth,
              justifyContent: 'center',
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: ink, ...theme.typography.label }}>{t('tripBack')}</Text>
          </PressableScale>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.spacing.md }}>
          {nav ? (
            <PressableScale
              accessibilityLabel={nav.open ? t('menuClose') : t('menuOpen')}
              onPress={nav.toggle}
              style={{
                minHeight: theme.touchTarget.minHeight,
                minWidth: theme.touchTarget.minWidth,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path d="M4 7h16M4 12h16M4 17h16" stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
              </Svg>
            </PressableScale>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={{ color: ink, ...theme.typography.display }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: ink, ...theme.typography.body, marginTop: theme.spacing.xs }}>{subtitle}</Text>
            ) : null}
          </View>
          {trailing}
        </View>
      </LinearGradient>
    </View>
  )
}
