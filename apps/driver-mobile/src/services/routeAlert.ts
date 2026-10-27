import { getMyVehicle, postRouteAlert, type RouteAlertKind } from './vehicle'

const STORAGE_KEY = 'ecocollect.driver.routeAlertQueue'

export type QueuedRouteAlert = {
  id: string
  kind: RouteAlertKind
  latitude: number
  longitude: number
  routeName: string | null
  recordedAt: string
}

function readQueue(): QueuedRouteAlert[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as QueuedRouteAlert[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(alerts: QueuedRouteAlert[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

export function queuedRouteAlerts(): QueuedRouteAlert[] {
  return readQueue()
}

function remember(alert: Omit<QueuedRouteAlert, 'id'>): void {
  const alerts = readQueue()
  alerts.push({ ...alert, id: `route-${Date.now()}-${alerts.length + 1}` })
  writeQueue(alerts)
}

export async function flushRouteAlerts(online: boolean): Promise<number> {
  const alerts = readQueue()
  if (!online || alerts.length === 0) return alerts.length

  const vehicle = await getMyVehicle().catch(() => null)
  if (!vehicle) return alerts.length

  const remaining: QueuedRouteAlert[] = []
  for (const alert of alerts) {
    try {
      await postRouteAlert(vehicle.id, alert)
    } catch {
      remaining.push(alert)
    }
  }
  writeQueue(remaining)
  return remaining.length
}

export async function sendRouteAlert(alert: Omit<QueuedRouteAlert, 'id'>): Promise<'sent' | 'queued'> {
  const online = typeof navigator !== 'undefined' && navigator.onLine
  if (!online) {
    remember(alert)
    return 'queued'
  }

  const vehicle = await getMyVehicle().catch(() => null)
  if (!vehicle) {
    remember(alert)
    return 'queued'
  }

  try {
    await postRouteAlert(vehicle.id, alert)
    await flushRouteAlerts(true)
    return 'sent'
  } catch {
    remember(alert)
    return 'queued'
  }
}
