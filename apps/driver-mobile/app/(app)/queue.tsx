import { useCallback, useState } from 'react'
import { Text } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { offlineQueue, retryOfflineQueue } from '@/services/offlineQueue'
import { colors } from '@/theme/colors'

export default function QueueScreen() {
  const { t } = useTranslation()
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
        <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {t('queueCount')}: {waiting.count}
        </Text>
        {waiting.count === 0 ? <EmptyState title={t('queueEmpty')} /> : null}
        {waiting.gps.map((point) => (
          <Text key={point.id} className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
            {t('queueGps')} {point.recordedAt}
          </Text>
        ))}
        {waiting.weightKg !== null ? (
          <Text className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
            {t('queueWeight')}: {waiting.weightKg} {t('unitKg')}
          </Text>
        ) : null}
        {waiting.routeAlerts.map((alert) => (
          <Text key={alert.id} className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
            {t('queueRouteAlert')} {alert.kind === 'OUTSIDE' ? t('deviationOutside') : t('deviationInside')}
          </Text>
        ))}
        {waiting.activity.map((segment) => (
          <Text key={segment.id} className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
            {t('queueActivity')}{' '}
            {segment.kind === 'MOVING' ? t('activityMoving') : segment.kind === 'IDLE' ? t('activityIdle') : t('activityStop')}
          </Text>
        ))}
        <PrimaryButton
          label={t('queueRetry')}
          onPress={() => {
            void retryOfflineQueue().then(() => setWaiting(offlineQueue()))
          }}
          style={{ marginTop: 24 }}
        />
      </Card>
    </Screen>
  )
}