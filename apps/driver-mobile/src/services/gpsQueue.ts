const STORAGE_KEY = 'ecocollect.driver.gpsQueue'

export type QueuedGpsPoint = {
  id: string
  latitude: number
  longitude: number
  speedKmh: number | null
  recordedAt: string
}

export class GpsDeniedError extends Error {
  constructor() {
    super('DENIED')
    this.name = 'GpsDeniedError'
  }
}

type Fix = {
  latitude: number
  longitude: number
  speedKmh: number | null
}

function readQueue(): QueuedGpsPoint[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as QueuedGpsPoint[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(points: QueuedGpsPoint[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points))
}

export function queuedPointCount(): number {
  return readQueue().length
}

export function latestQueuedPoint(): { latitude: number; longitude: number } | null {
  const points = readQueue()
  const last = points[points.length - 1]
  return last ? { latitude: last.latitude, longitude: last.longitude } : null
}

export function enqueueFix(fix: Fix): number {
  const points = readQueue()
  points.push({
    id: `gps-${Date.now()}`,
    latitude: fix.latitude,
    longitude: fix.longitude,
    speedKmh: fix.speedKmh,
    recordedAt: new Date().toISOString(),
  })
  writeQueue(points)
  return points.length
}

export function flushQueue(online: boolean): number {
  if (!online) return readQueue().length
  writeQueue([])
  return 0
}

export function watchFixes(onFix: (fix: Fix) => void, onError: (error: unknown) => void): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError(new GpsDeniedError())
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(
    (position) => {
      const speed = position.coords.speed
      onFix({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speedKmh: typeof speed === 'number' ? Math.round(speed * 3.6) : null,
      })
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) onError(new GpsDeniedError())
      else onError(error)
    },
    { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}

export function readCurrentFix(): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GpsDeniedError())
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const speed = position.coords.speed
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speedKmh: typeof speed === 'number' ? Math.round(speed * 3.6) : null,
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) reject(new GpsDeniedError())
        else reject(error)
      },
      { enableHighAccuracy: false, maximumAge: 20000, timeout: 8000 },
    )
  })
}
