import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { latestQueuedPoint } from '@/services/gpsQueue'
import type { DriverStop } from '@/services/myRoute'
import { roadGeometry } from '@/services/roadRoute'
import type { PickupStop } from '@/services/todayRoute'
import { useTrip } from '@/stores/trip'

export function useDriverMap(
  stops: DriverStop[],
  vehiclePoint?: { latitude: number; longitude: number } | null,
) {
  const liveFix = useTrip((state) => state.liveFix)
  const trail = useTrip((state) => state.trail)
  const active = useTrip((state) => state.active)
  const points = useMemo(
    () =>
      stops
        .filter((stop) => stop.latitude != null && stop.longitude != null)
        .sort((left, right) => left.order - right.order)
        .map((stop) => ({
          latitude: stop.latitude as number,
          longitude: stop.longitude as number,
        })),
    [stops],
  )
  const anchorKey = points.map((point) => `${point.longitude},${point.latitude}`).join(';')
  const roadQuery = useQuery({
    queryKey: ['road-route', anchorKey],
    enabled: points.length > 1,
    staleTime: 60 * 60 * 1000,
    queryFn: () => roadGeometry(points),
  })
  const roadPath = roadQuery.data

  return useMemo(() => {
    if (stops.length === 0 && !vehiclePoint) return null
    const queued = latestQueuedPoint()
    const path = points.length > 1 ? (roadPath ?? points) : []
    const pickups: PickupStop[] = stops
      .filter((stop) => stop.latitude != null && stop.longitude != null)
      .sort((left, right) => left.order - right.order)
      .map((stop) => ({
        id: stop.id,
        index: stop.order,
        latitude: stop.latitude as number,
        longitude: stop.longitude as number,
      }))
    const driver = liveFix ?? queued ?? vehiclePoint ?? path[0] ?? pickups[0]
    if (!driver) return null
    return {
      path,
      pickups,
      driver,
      trail,
      live: Boolean(active && liveFix),
      routePending: roadQuery.isPending && points.length > 1,
      routeError: roadQuery.isError,
      retryRoute: () => void roadQuery.refetch(),
    }
  }, [
    active,
    liveFix,
    points.length,
    roadPath,
    roadQuery.isError,
    roadQuery.isPending,
    stops,
    trail,
    vehiclePoint,
  ])
}