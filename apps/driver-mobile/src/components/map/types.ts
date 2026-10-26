import type { MapPoint, PickupStop } from '@/services/todayRoute'

export type TripMapProps = {
  path: MapPoint[]
  driver: MapPoint
  pickups: PickupStop[]
  trail: MapPoint[]
  live: boolean
  height?: number
}
