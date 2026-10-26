import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { useAppTheme } from '@/hooks/useAppTheme'

type Props = {
  live: boolean
  children: ReactNode
  onCenter: () => void
  onPickups: () => void
}

export function MapChrome({ live, children, onCenter, onPickups }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      {children}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, marginTop: theme.spacing.md }}>
        <LegendDot color={theme.colors.warning} label={t('driverLocation')} />
        <LegendDot color={theme.colors.primary} label={t('pickupLegend')} />
        {live ? (
          <Text style={{ color: theme.colors.success, ...theme.typography.bodyStrong }}>{t('mapLive')}</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label={t('mapCenter')} onPress={onCenter} />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton label={t('mapPickups')} onPress={onPickups} />
        </View>
      </View>
    </View>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const theme = useAppTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, minHeight: theme.spacing.touch }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: theme.colors.textPrimary,
        }}
      />
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label }}>{label}</Text>
    </View>
  )
}
