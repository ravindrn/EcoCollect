import { useEffect } from 'react'
import { gpsSampleIntervalMs } from '@/config/gps'
import { GpsDeniedError, enqueueFix, flushQueue, readCurrentFix, watchFixes } from '@/services/gpsQueue'
import { useTrip } from '@/stores/trip'

export function useTripSampling() {
  const active = useTrip((state) => state.active)

  useEffect(() => {
    if (!active) return

    let lastFix: { latitude: number; longitude: number; speedKmh: number | null } | null = null
    let lastEnqueue = 0

    const remember = (fix: { latitude: number; longitude: number; speedKmh: number | null }, enqueue: boolean) => {
      lastFix = fix
      useTrip.getState().setLiveFix(fix)
      useTrip.getState().setGpsDenied(false)
      if (!enqueue) return
      const online = typeof navigator !== 'undefined' && navigator.onLine
      const count = enqueueFix(fix)
      useTrip.getState().setQueueCount(online ? flushQueue(true) : count)
      lastEnqueue = Date.now()
    }

    const onFix = (fix: { latitude: number; longitude: number; speedKmh: number | null }) => {
      remember(fix, Date.now() - lastEnqueue >= gpsSampleIntervalMs)
    }

    const onError = (error: unknown) => {
      if (error instanceof GpsDeniedError) {
        useTrip.getState().setGpsDenied(true)
        useTrip.getState().stop()
        return
      }
      if (lastFix && Date.now() - lastEnqueue >= gpsSampleIntervalMs) remember(lastFix, true)
    }

    void readCurrentFix().then(onFix).catch(onError)
    const stopWatch = watchFixes(onFix, onError)
    const timer = setInterval(() => {
      if (lastFix) remember(lastFix, true)
    }, gpsSampleIntervalMs)
    const onOnline = () => useTrip.getState().setQueueCount(flushQueue(true))
    if (typeof window !== 'undefined') window.addEventListener('online', onOnline)

    return () => {
      stopWatch()
      clearInterval(timer)
      if (typeof window !== 'undefined') window.removeEventListener('online', onOnline)
    }
  }, [active])
}
