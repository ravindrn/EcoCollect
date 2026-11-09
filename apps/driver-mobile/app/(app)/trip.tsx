import { useCallback, useEffect, useRef, useState } from 'react'
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
import { fixtureActivityLog, saveActivityLog, segmentMinutes } from '@/services/activity'
import { leavesCorridor, noteDeviation, type CorridorPoint, type DeviationAlert } from '@/services/corridor'
import { engineOnMs, intervalsFromTrackerPower } from '@/services/engineLog'
import { useDriverMap } from '@/hooks/useDriverMap'
import { getMyRoute } from '@/services/myRoute'
import { getMyProfile } from '@/services/profile'
import { sendRouteAlert } from '@/services/routeAlert'
import { getMyVehicle } from '@/services/vehicle'
import { fixtureShift } from '@/services/shiftStats'
import { trackerPowerForEmail } from '@/services/todayRoute'
import { useTrip } from '@/stores/trip'
import { colors } from '@/theme/colors'

export default function TripScreen() {
  const { t } = useTranslation()
  const active = useTrip((state) => state.active)
  const intervals = useTrip((state) => state.intervals)
  const queueCount = useTrip((state) => state.queueCount)
  const gpsDenied = useTrip((state) => state.gpsDenied)
  const liveFix = useTrip((state) => state.liveFix)
  const [routeNotice, setRouteNotice] = useState<{ tone: 'danger' | 'success'; message: string } | null>(null)
  const alertsRef = useRef<DeviationAlert[]>([])
  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMyProfile,
  })
  const profile = profileQuery.data
  const vehicleQuery = useQuery({
    queryKey: ['vehicles', 'me'],
    queryFn: getMyVehicle,
  })
  const routeQuery = useQuery({ queryKey: ['routes', 'me'], queryFn: getMyRoute })
  const tripMap = useDriverMap(routeQuery.data?.stops ?? [], vehicleQuery.data?.lastLocation ?? null)
  const trackerIntervals = intervalsFromTrackerPower(profile ? trackerPowerForEmail(profile.email) : [])
  const activity = fixtureActivityLog()
  const shift = fixtureShift()

  useEffect(() => {
    saveActivityLog(fixtureActivityLog())
  }, [])

  const checkDeviation = useCallback((outside: boolean, point: CorridorPoint) => {
    const next = noteDeviation(alertsRef.current, outside)
    alertsRef.current = next.alerts
    if (!next.status) return
    const base = next.status === 'OUTSIDE' ? t('deviationAlert') : t('deviationBack')
    const routeName = routeQuery.data?.routeName ?? null
    void sendRouteAlert({
      kind: next.status,
      latitude: point.latitude,
      longitude: point.longitude,
      routeName,
      recordedAt: new Date().toISOString(),
    }).then((delivery) => {
      setRouteNotice({
        tone: next.status === 'OUTSIDE' ? 'danger' : 'success',
        message: delivery === 'queued' ? `${base}. ${t('deviationQueued')}` : base,
      })
    })
  }, [routeQuery.data?.routeName, t])

  useEffect(() => {
    if (!active || !liveFix || !tripMap || tripMap.path.length < 2) return
    checkDeviation(leavesCorridor(liveFix, tripMap.path), liveFix)
  }, [active, liveFix, tripMap, checkDeviation])

  const engineOn = intervals.some((interval) => interval.endedAt === null)

  return (
    <Screen>
      <GradientHeader title={t('tripTitle')} back />
      {routeNotice ? (
        <Card>
          <Banner tone={routeNotice.tone} message={routeNotice.message} />
          <PrimaryButton
            label={t('deviationDismiss')}
            onPress={() => setRouteNotice(null)}
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : null}
      <Card>
        {profileQuery.isPending ? <Skeleton label={t('routeLoading')} lines={2} /> : null}
        {profileQuery.isError ? <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /> : null}
        {tripMap ? (
          <View>
            <Text
              className="text-xs uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              {t('plannedRoute')}
            </Text>
            <Text className="mb-2 mt-1 text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
              {t('latestPoint')}
            </Text>
            {tripMap.routePending ? <Skeleton label={t('mapLoading')} lines={2} /> : null}
            {tripMap.routeError ? (
              <View className="mt-3">
                <Banner tone="danger" message={t('mapRoadFailed')} />
                <PrimaryButton label={t('queueRetry')} onPress={tripMap.retryRoute} style={{ marginTop: 12 }} />
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
        <Text className="mt-2 text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
          {t('gpsQueued')}: {queueCount}
        </Text>
        <PrimaryButton
          label={active ? t('tripStop') : t('tripStart')}
          onPress={() => (active ? useTrip.getState().stop() : useTrip.getState().start())}
          style={{ marginTop: 16 }}
        />
      </Card>
      <Card delay={70}>
        <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {t('engineLog')}
        </Text>
        <EnginePulse
          on={engineOn}
          label={engineOn ? t('engineOnAction') : t('engineOffAction')}
        />
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1">
            <PrimaryButton label={t('engineOnAction')} onPress={() => useTrip.getState().turnEngineOn()} />
          </View>
          <View className="flex-1">
            <PrimaryButton label={t('engineOffAction')} onPress={() => useTrip.getState().turnEngineOff()} />
          </View>
        </View>
        {intervals.map((interval) => (
          <Text key={`driver-${interval.startedAt}`} className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
            {clock(interval.startedAt)}–{interval.endedAt === null ? t('engineOpen') : clock(interval.endedAt)}
          </Text>
        ))}
        <Text className="mt-3 text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
          {t('engineTotal')}: {engineOnMs(intervals)} {t('unitMs')}
        </Text>

        <View className="my-4 h-px" style={{ backgroundColor: colors.border }} />

        <Text
          className="text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          {t('engineSource')}
        </Text>
        {trackerIntervals.map((interval) => (
          <Text key={`tracker-${interval.startedAt}`} className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
            {clock(interval.startedAt)}–{interval.endedAt === null ? t('engineOpen') : clock(interval.endedAt)}
          </Text>
        ))}
        <Text className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
          {t('engineTotal')}: {engineOnMs(trackerIntervals)} {t('unitMs')}
        </Text>
      </Card>
      <Card delay={120}>
        <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {t('distanceLabel')}: {shift.distanceKm.toFixed(1)} {t('unitKm')}
        </Text>
        <Text className="mt-2 text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
          {t('speedLabel')}: {shift.currentSpeedKmh} {t('unitSpeed')}
        </Text>
        {shift.samples.map((sample) => (
          <View
            key={`${sample.latitude}-${sample.speedKmh}`}
            className={sample.overspeed ? 'mt-2 rounded-lg px-3 py-2' : 'mt-2 rounded-lg'}
            style={{ backgroundColor: sample.overspeed ? colors.warning : 'transparent' }}
          >
            <Text
              className="text-[15px]"
              style={{ color: sample.overspeed ? '#FFFFFF' : colors.textSecondary }}
            >
              {sample.speedKmh} {t('unitSpeed')}{sample.overspeed ? ` ${t('overspeed')}` : ''}
            </Text>
          </View>
        ))}
        <Text className="mt-3 text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
          {t('fuelLabel')}: {shift.fuelLiters.toFixed(1)} {t('unitLiter')} {t('fuelEstimate')}
        </Text>
      </Card>
      <Card delay={170}>
        <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {t('activityTitle')}
        </Text>
        {activity.map((segment) => {
          const idle = segment.kind === 'IDLE'
          const label = segment.kind === 'MOVING' ? t('activityMoving') : idle ? t('activityIdle') : t('activityStop')
          return (
            <View
              key={segment.id}
              className={idle ? 'mt-2 rounded-lg px-3 py-2' : 'mt-2 rounded-lg'}
              style={{ backgroundColor: idle ? colors.warning : 'transparent' }}
            >
              <Text
                className="text-[15px]"
                style={{ color: idle ? '#FFFFFF' : colors.textSecondary }}
              >
                {label} {(segment.endedAt - segment.startedAt) / 60000} {t('engineMinutes')}
              </Text>
            </View>
          )
        })}
        <Text className="mt-3 text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
          {segmentMinutes(activity)} {t('engineMinutes')}
        </Text>
      </Card>
    </Screen>
  )
}

function clock(ms: number) {
  return new Date(ms).toISOString().slice(11, 16)
}