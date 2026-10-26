import { create } from 'zustand'
import { engineOff, engineOn, type EngineInterval } from '@/services/engineLog'
import type { MapPoint } from '@/services/todayRoute'

type TripState = {
  active: boolean
  intervals: EngineInterval[]
  queueCount: number
  gpsDenied: boolean
  liveFix: MapPoint | null
  trail: MapPoint[]
  start: () => void
  stop: () => void
  turnEngineOn: () => void
  turnEngineOff: () => void
  setQueueCount: (count: number) => void
  setGpsDenied: (denied: boolean) => void
  setLiveFix: (fix: MapPoint) => void
  reset: () => void
}

function samePoint(left: MapPoint | undefined, right: MapPoint) {
  if (!left) return false
  return Math.abs(left.latitude - right.latitude) < 0.00001 && Math.abs(left.longitude - right.longitude) < 0.00001
}

export const useTrip = create<TripState>((set) => ({
  active: false,
  intervals: [],
  queueCount: 0,
  gpsDenied: false,
  liveFix: null,
  trail: [],
  start: () => set({ active: true, gpsDenied: false, liveFix: null, trail: [] }),
  stop: () => set({ active: false }),
  turnEngineOn: () => set((state) => ({ intervals: engineOn(state.intervals, Date.now()) })),
  turnEngineOff: () => set((state) => ({ intervals: engineOff(state.intervals, Date.now()) })),
  setQueueCount: (queueCount) => set({ queueCount }),
  setGpsDenied: (gpsDenied) => set({ gpsDenied }),
  setLiveFix: (fix) =>
    set((state) => {
      const point = { latitude: fix.latitude, longitude: fix.longitude }
      const last = state.trail[state.trail.length - 1]
      return {
        liveFix: point,
        trail: samePoint(last, point) ? state.trail : [...state.trail, point].slice(-80),
      }
    }),
  reset: () => set({ active: false, intervals: [], queueCount: 0, gpsDenied: false, liveFix: null, trail: [] }),
}))
