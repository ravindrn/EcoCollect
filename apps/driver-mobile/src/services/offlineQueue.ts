import { syncActivitylog, type ActivitySegment } from './activity'
import { flushQueue, type QueuedGpsPoint } from './gpsQueue'
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
  const weightKg = readWeightDraft()
  return {
    gps,
    activity,
    weightKg,
    count: gps.length + activity.length + (weightKg === null ? 0 : 1),
  }
}

export function retryOfflineQueue(): number {
  const online = typeof navigator !== 'undefined' && navigator.onLine
  flushQueue(online)
  syncActivitylog(online)
  clearWeightDraft(online)
  return offlineQueue().count
}