import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { latestQueuedPoint } from '@/services/gpsQueue'
import { roadGeometry } from '@/services/roadRoute'
import { pickupsAlongPath, todayMapForEmail } from '@/services/todayRoute'
import { useTrip } from '@/stores/trip'

export function useDriverMap(email: string | undefined, vehiclePoint?: { latitude: number; longitude: number } | null) {
  const liveFix = useTrip((state) => state.liveFix)
  const trail = useTrip((state) => state.trail)
  const active = useTrip((state) => state.active)
  const fixture = useMemo(() => (email ? todayMapForEmail(email) : null), [email])
  const anchorKey = fixture?.path.map((point) => `${point.longitude},${point.latitude}`).join(';') ?? ''
  const roadQuery = useQuery({
    queryKey: ['road-route', anchorKey],
    enabled: anchorKey.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: () => roadGeometry(fixture?.path ?? []),
  })
  const roadPath = roadQuery.data

  return useMemo(() => {
    if (!fixture && !vehiclePoint) return null
    const queued = latestQueuedPoint()
    const path = roadPath ?? fixture?.path ?? (vehiclePoint ? [vehiclePoint] : [])
    return {
      path,
      pickups: path.length > 1 ? pickupsAlongPath(path, fixture?.stopCount ?? 1) : [],
      driver: liveFix ?? queued ?? vehiclePoint ?? fixture?.latest ?? path[0],
      trail,
      live: Boolean(active && liveFix),
      routePending: roadQuery.isPending && anchorKey.length > 0,
      routeError: roadQuery.isError,
      retryRoute: () => void roadQuery.refetch(),
    }
  }, [active, anchorKey.length, fixture, liveFix, roadPath, roadQuery.isError, roadQuery.isPending, trail, vehiclePoint])
}
