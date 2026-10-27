import { syncActivitylog, type ActivitySegment } from './activity'
import { flushQueue, type QueuedGpsPoint } from './gpsQueue'
import { flushRouteAlerts, queuedRouteAlerts } from './routeAlert'
import { clearWeightDraft, readWeightDraft } from './weightDraft'

const GPS_KEY = 'ecocollect.driver.gpsQueue'
const ACTIVITY_KEY = 'ecocollect.driver.activityLog'

function readJson<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function offlineQueue() {
  const gps = readJson<QueuedGpsPoint>(GPS_KEY)
  const activity = readJson<ActivitySegment>(ACTIVITY_KEY)
  const routeAlerts = queuedRouteAlerts()
  const weightKg = readWeightDraft()
  return {
    gps,
    activity,
    routeAlerts,
    weightKg,
    count: gps.length + activity.length + routeAlerts.length + (weightKg === null ? 0 : 1),
  }
}

export async function retryOfflineQueue(): Promise<number> {
  const online = typeof navigator !== 'undefined' && navigator.onLine
  await flushQueue(online)
  if (online) await flushRouteAlerts(true)
  syncActivitylog(online)
  clearWeightDraft(online)
  return offlineQueue().count
}