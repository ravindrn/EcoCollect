import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { TripMap } from '@/components/TripMap'
import { Banner } from '@/components/ui/Banner'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { EnginePulse } from '@/components/ui/EnginePulse'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAppTheme } from '@/hooks/useAppTheme'
import { fixtureActivityLog, saveActivityLog, segmentMinutes } from '@/services/activity'
import { leavesCorridor, noteDeviation, type DeviationAlert } from '@/services/corridor'
import { engineOnMs, intervalsFromTrackerPower } from '@/services/engineLog'
import { useDriverMap } from '@/hooks/useDriverMap'
import { getMyProfile } from '@/services/profile'
import { fixtureShift } from '@/services/shiftStats'
import { trackerPowerForEmail } from '@/services/todayRoute'
import { useTrip } from '@/stores/trip'

export default function TripScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const active = useTrip((state) => state.active)
  const intervals = useTrip((state) => state.intervals)
  const queueCount = useTrip((state) => state.queueCount)
  const gpsDenied = useTrip((state) => state.gpsDenied)
  const [deviationAlerts, setDeviationAlerts] = useState<DeviationAlert[]>([])
  const [deviationVisible, setDeviationVisible] = useState(false)
  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMyProfile,
  })
  const profile = profileQuery.data
  const tripMap = useDriverMap(profile?.email)
  const trackerIntervals = intervalsFromTrackerPower(profile ? trackerPowerForEmail(profile.email) : [])
  const activity = fixtureActivityLog()
  const shift = fixtureShift()

  useEffect(() => {
    saveActivityLog(fixtureActivityLog())
  }, [])

  function checkDeviation(outside: boolean) {
    const next = noteDeviation(deviationAlerts, outside)
    setDeviationAlerts(next.alerts)
    setDeviationVisible(next.raised || (outside && deviationVisible))
  }

  return (
    <Screen>
      <GradientHeader title={t('tripTitle')} back />
      {deviationVisible ? (
        <Card>
          <Banner tone="danger" message={t('deviationAlert')} />
          <PrimaryButton
            label={t('deviationDismiss')}
            onPress={() => setDeviationVisible(false)}
            style={{ marginTop: theme.spacing.md }}
          />
        </Card>
      ) : null}
      <Card>
        {profileQuery.isPending ? <Skeleton label={t('routeLoading')} lines={2} /> : null}
        {profileQuery.isError ? <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /> : null}
        {tripMap ? (
          <View>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption }}>{t('plannedRoute')}</Text>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label, marginBottom: theme.spacing.sm }}>
              {t('latestPoint')}
            </Text>
            {tripMap.routePending ? <Skeleton label={t('mapLoading')} lines={2} /> : null}
            {tripMap.routeError ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <Banner tone="danger" message={t('mapRoadFailed')} />
                <PrimaryButton label={t('queueRetry')} onPress={tripMap.retryRoute} style={{ marginTop: theme.spacing.md }} />
              </View>
            ) : null}
            {!tripMap.routePending && !tripMap.routeError ? (
              <TripMap
                path={tripMap.path}
                driver={tripMap.driver}
                pickups={tripMap.pickups}
                trail={tripMap.trail}
                live={tripMap.live}
              />
            ) : null}
          </View>
        ) : null}
        {profileQuery.isSuccess && !tripMap ? <EmptyState title={t('routeEmpty')} /> : null}
        {gpsDenied ? <Banner tone="danger" message={t('gpsDenied')} /> : null}
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong, marginTop: theme.spacing.sm }}>
          {t('gpsQueued')}: {queueCount}
        </Text>
        <PrimaryButton
          label={active ? t('tripStop') : t('tripStart')}
          onPress={() => (active ? useTrip.getState().stop() : useTrip.getState().start())}
          style={{ marginTop: theme.spacing.lg }}
        />
        {tripMap && tripMap.path.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={t('deviationOutside')} onPress={() => checkDeviation(leavesCorridor({ latitude: 7, longitude: 80.22 }, tripMap.path))} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={t('deviationInside')} tone="primary" onPress={() => checkDeviation(leavesCorridor(tripMap.path[0], tripMap.path))} />
            </View>
          </View>
        ) : null}
      </Card>
      <Card delay={70}>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>{t('engineLog')}</Text>
        <EnginePulse
          on={intervals.some((interval) => interval.endedAt === null)}
          label={intervals.some((interval) => interval.endedAt === null) ? t('engineOnAction') : t('engineOffAction')}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label={t('engineOnAction')} onPress={() => useTrip.getState().turnEngineOn()} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label={t('engineOffAction')} onPress={() => useTrip.getState().turnEngineOff()} />
          </View>
        </View>
        {intervals.map((interval) => (
          <Text key={`driver-${interval.startedAt}`} style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
            {clock(interval.startedAt)}–{interval.endedAt === null ? t('engineOpen') : clock(interval.endedAt)}
          </Text>
        ))}
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong, marginTop: theme.spacing.md }}>
          {t('engineTotal')}: {engineOnMs(intervals)} {t('unitMs')}
        </Text>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption, marginTop: theme.spacing.lg }}>
          {t('engineSource')}
        </Text>
        {trackerIntervals.map((interval) => (
          <Text key={`tracker-${interval.startedAt}`} style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
            {clock(interval.startedAt)}–{interval.endedAt === null ? t('engineOpen') : clock(interval.endedAt)}
          </Text>
        ))}
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
          {t('engineTotal')}: {engineOnMs(trackerIntervals)} {t('unitMs')}
        </Text>
      </Card>
      <Card delay={120}>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>
          {t('distanceLabel')}: {shift.distanceKm.toFixed(1)} {t('unitKm')}
        </Text>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong, marginTop: theme.spacing.sm }}>
          {t('speedLabel')}: {shift.currentSpeedKmh} {t('unitSpeed')}
        </Text>
        {shift.samples.map((sample) => (
          <View
            key={`${sample.latitude}-${sample.speedKmh}`}
            style={{
              marginTop: theme.spacing.sm,
              borderRadius: theme.radii.sm,
              paddingHorizontal: sample.overspeed ? theme.spacing.md : 0,
              paddingVertical: sample.overspeed ? theme.spacing.sm : 0,
              backgroundColor: sample.overspeed ? theme.colors.warning : 'transparent',
            }}
          >
            <Text style={{ color: sample.overspeed ? theme.colors.onWarning : theme.colors.textPrimary, ...theme.typography.body }}>
              {sample.speedKmh} {t('unitSpeed')}{sample.overspeed ? ` ${t('overspeed')}` : ''}
            </Text>
          </View>
        ))}
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong, marginTop: theme.spacing.md }}>
          {t('fuelLabel')}: {shift.fuelLiters.toFixed(1)} {t('unitLiter')} {t('fuelEstimate')}
        </Text>
      </Card>
      <Card delay={170}>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>{t('activityTitle')}</Text>
        {activity.map((segment) => {
          const idle = segment.kind === 'IDLE'
          const label = segment.kind === 'MOVING' ? t('activityMoving') : idle ? t('activityIdle') : t('activityStop')
          return (
            <View
              key={segment.id}
              style={{
                marginTop: theme.spacing.sm,
                borderRadius: theme.radii.sm,
                paddingHorizontal: idle ? theme.spacing.md : 0,
                paddingVertical: idle ? theme.spacing.sm : 0,
                backgroundColor: idle ? theme.colors.warning : 'transparent',
              }}
            >
              <Text style={{ color: idle ? theme.colors.onWarning : theme.colors.textPrimary, ...theme.typography.body }}>
                {label} {(segment.endedAt - segment.startedAt) / 60000} {t('engineMinutes')}
              </Text>
            </View>
          )
        })}
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong, marginTop: theme.spacing.md }}>
          {segmentMinutes(activity)} {t('engineMinutes')}
        </Text>
      </Card>
    </Screen>
  )
}

function clock(ms: number) {
  return new Date(ms).toISOString().slice(11, 16)
}
