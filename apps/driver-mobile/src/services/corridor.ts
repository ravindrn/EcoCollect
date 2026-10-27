export const corridorKm = 0.5

export type CorridorPoint = { latitude: number; longitude: number }

function toLocalKm(origin: CorridorPoint, point: CorridorPoint) {
  const latRad = (origin.latitude * Math.PI) / 180
  return {
    x: (point.longitude - origin.longitude) * 111.32 * Math.cos(latRad),
    y: (point.latitude - origin.latitude) * 110.57,
  }
}

function distanceToSegmentKm(point: CorridorPoint, start: CorridorPoint, end: CorridorPoint) {
  const here = toLocalKm(start, point)
  const finish = toLocalKm(start, end)
  const lengthSquared = finish.x * finish.x + finish.y * finish.y
  if (lengthSquared === 0) return Math.hypot(here.x, here.y)
  const progress = Math.max(0, Math.min(1, (here.x * finish.x + here.y * finish.y) / lengthSquared))
  return Math.hypot(here.x - finish.x * progress, here.y - finish.y * progress)
}

export function distanceToPathKm(point: CorridorPoint, path: CorridorPoint[]) {
  if (path.length === 0) return Number.POSITIVE_INFINITY
  if (path.length === 1) return distanceToSegmentKm(point, path[0], path[0])
  let nearest = Number.POSITIVE_INFINITY
  for (let index = 0; index < path.length - 1; index += 1) {
    nearest = Math.min(nearest, distanceToSegmentKm(point, path[index], path[index + 1]))
  }
  return nearest
}

export function leavesCorridor(point: CorridorPoint, path: CorridorPoint[], widthKm = corridorKm) {
  return distanceToPathKm(point, path) > widthKm
}

export type DeviationAlert = { id: string; open: boolean }

export type RouteStatus = 'OUTSIDE' | 'INSIDE'

export function noteDeviation(alerts: DeviationAlert[], outside: boolean) {
  const wasOutside = alerts.some((alert) => alert.open)
  if (!outside) {
    if (wasOutside) {
      return {
        alerts: alerts.map((alert) => ({ ...alert, open: false })),
        raised: true,
        status: 'INSIDE' as const,
      }
    }
    if (alerts.length === 0) {
      return {
        alerts: [{ id: 'deviation-1', open: false }],
        raised: true,
        status: 'INSIDE' as const,
      }
    }
    return { alerts, raised: false, status: null }
  }
  if (wasOutside) return { alerts, raised: false, status: null }
  return {
    alerts: [...alerts, { id: `deviation-${alerts.length + 1}`, open: true }],
    raised: true,
    status: 'OUTSIDE' as const,
  }
}
