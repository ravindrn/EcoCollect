import type { MapPoint } from './todayRoute'

type RoadResponse = {
  code?: string
  routes?: { geometry?: { coordinates?: [number, number][] } }[]
}

// The fixture stores only the route ends. The public road router snaps those ends
// onto the streets drawn on the map and returns the driving line between them.
export async function roadGeometry(path: MapPoint[]): Promise<MapPoint[]> {
  if (path.length < 2) return path
  const coords = path.map((point) => `${point.longitude},${point.latitude}`).join(';')
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
  )
  if (!response.ok) throw new Error('MAP_FAILED')
  const body = (await response.json()) as RoadResponse
  const coordinates = body.routes?.[0]?.geometry?.coordinates
  if (body.code !== 'Ok' || !coordinates || coordinates.length < 2) throw new Error('MAP_FAILED')
  return coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))
}
