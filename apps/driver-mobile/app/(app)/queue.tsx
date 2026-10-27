import { useCallback, useState } from 'react'
import { Text } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { useAppTheme } from '@/hooks/useAppTheme'
import { offlineQueue, retryOfflineQueue } from '@/services/offlineQueue'

export default function QueueScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [waiting, setWaiting] = useState(offlineQueue())

  useFocusEffect(
    useCallback(() => {
      setWaiting(offlineQueue())
    }, []),
  )

  return (
    <Screen>
      <GradientHeader title={t('queueTitle')} back />
      <Card>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>
          {t('queueCount')}: {waiting.count}
        </Text>
        {waiting.count === 0 ? <EmptyState title={t('queueEmpty')} /> : null}
        {waiting.gps.map((point) => (
          <Text key={point.id} style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
            {t('queueGps')} {point.recordedAt}
          </Text>
        ))}
        {waiting.weightKg !== null ? (
          <Text style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
            {t('queueWeight')}: {waiting.weightKg} {t('unitKg')}
          </Text>
        ) : null}
        {waiting.routeAlerts.map((alert) => (
          <Text key={alert.id} style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
            {t('queueRouteAlert')} {alert.kind === 'OUTSIDE' ? t('deviationOutside') : t('deviationInside')}
          </Text>
        ))}
        {waiting.activity.map((segment) => (
          <Text key={segment.id} style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
            {t('queueActivity')}{' '}
            {segment.kind === 'MOVING' ? t('activityMoving') : segment.kind === 'IDLE' ? t('activityIdle') : t('activityStop')}
          </Text>
        ))}
        <PrimaryButton
          label={t('queueRetry')}
          onPress={() => {
            void retryOfflineQueue().then(() => setWaiting(offlineQueue()))
          }}
          style={{ marginTop: theme.spacing.xl }}
        />
      </Card>
    </Screen>
  )
}
