import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { TripMap } from '@/components/TripMap'
import { Banner } from '@/components/ui/Banner'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useDriverMap } from '@/hooks/useDriverMap'
import { getMyProfile } from '@/services/profile'
import { todayRouteForEmail } from '@/services/todayRoute'
import { getMyVehicle } from '@/services/vehicle'
import { useTrip } from '@/stores/trip'

export default function HomeScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router = useRouter()
  const tripActive = useTrip((state) => state.active)
  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMyProfile,
  })
  const profile = profileQuery.data
  const vehicleQuery = useQuery({
    queryKey: ['vehicles', 'me'],
    queryFn: getMyVehicle,
  })
  const vehicle = vehicleQuery.data
  const route = profile ? todayRouteForEmail(profile.email) : null
  const tripMap = useDriverMap(profile?.email, vehicle?.lastLocation ?? null)
  const subtitle = profile?.profile?.fullName || profile?.email || t('shellTitle')

  function openTrip() {
    if (!useTrip.getState().active) useTrip.getState().start()
    router.push('/trip')
  }

  return (
    <Screen>
      <GradientHeader title={t('homeGreeting')} subtitle={subtitle} />
      <Card>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption }}>{t('routeTitle')}</Text>
        {profileQuery.isPending ? <Skeleton label={t('routeLoading')} /> : null}
        {profileQuery.isError ? <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /> : null}
        {profileQuery.isSuccess && !route && !vehicle ? <EmptyState title={t('routeEmpty')} body={t('emptyRouteBody')} /> : null}
        {vehicle ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>
              {vehicle.name ?? vehicle.plateNumber}
            </Text>
            <RouteFact label={t('routeTractor')} value={vehicle.plateNumber} />
          </View>
        ) : null}
        {route ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>{route.routeName}</Text>
            <RouteFact label={t('routeTractor')} value={route.tractorName} />
            <RouteFact label={t('plannedWindow')} value={`${route.plannedStart}–${route.plannedEnd}`} />
            <RouteFact label={t('routeStops')} value={String(route.stopCount)} />
            {tripMap?.routePending ? <Skeleton label={t('mapLoading')} lines={2} /> : null}
            {tripMap?.routeError ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <Banner tone="danger" message={t('mapRoadFailed')} />
                <PrimaryButton label={t('queueRetry')} onPress={tripMap.retryRoute} style={{ marginTop: theme.spacing.md }} />
              </View>
            ) : null}
            {tripMap && !tripMap.routePending && !tripMap.routeError ? (
              <TripMap
                path={tripMap.path}
                driver={tripMap.driver}
                pickups={tripMap.pickups}
                trail={tripMap.trail}
                live={tripMap.live}
                height={280}
              />
            ) : null}
          </View>
        ) : null}
      </Card>
      {route || vehicle ? (
        <View style={{ marginHorizontal: theme.spacing.screen, marginBottom: theme.spacing.lg }}>
          <PrimaryButton label={tripActive ? t('tripOpen') : t('tripStart')} onPress={openTrip} />
          <PrimaryButton label={t('pickupsOpen')} onPress={() => router.push('/pickups')} style={{ marginTop: theme.spacing.md }} />
        </View>
      ) : null}
    </Screen>
  )
}

function RouteFact({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme()
  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption }}>{label}</Text>
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong }}>{value}</Text>
    </View>
  )
}

