import { fixtureShiftPower, fixtureShiftSamples, idleAfterMs, idleSpeedKmh } from '../config/activity'
import { intervalsFromTrackerPower, type EngineInterval } from './engineLog'

export type ActivityKind = 'MOVING' | 'SHORT_STOP' | 'IDLE'

export type ActivitySegment = {
  id: string
  kind: ActivityKind
  startedAt: number
  endedAt: number
}

type Sample = { recordedAt: string; speedKmh: number }

const STORAGE_KEY = 'ecocollect.driver.activityLog'

function engineIsOn(intervals: EngineInterval[], at: number): boolean {
  return intervals.some(
    (interval) => interval.startedAt <= at && (interval.endedAt === null || at < interval.endedAt),
  )
}

export function classifyShift(
  samples: Sample[],
  power: { state: 'ON' | 'OFF'; recordedAt: string }[],
): ActivitySegment[] {
  const intervals = intervalsFromTrackerPower(power)
  const ordered = [...samples].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  const raw: ActivitySegment[] = []

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const startedAt = Date.parse(ordered[index].recordedAt)
    const endedAt = Date.parse(ordered[index + 1].recordedAt)
    const duration = endedAt - startedAt
    const moving = ordered[index].speedKmh > idleSpeedKmh
    let kind: ActivityKind = 'SHORT_STOP'
    if (moving) kind = 'MOVING'
    else if (engineIsOn(intervals, startedAt) && duration >= idleAfterMs) kind = 'IDLE'

    const previous = raw[raw.length - 1]
    if (previous && previous.kind === kind && previous.endedAt === startedAt) {
      previous.endedAt = endedAt
    } else {
      raw.push({ id: `activity-${raw.length + 1}`, kind, startedAt, endedAt })
    }
  }

  return raw
}

export function segmentMinutes(segments: ActivitySegment[]): number {
  return segments.reduce((total, segment) => total + (segment.endedAt - segment.startedAt), 0) / 60000
}

export function saveActivityLog(segments: ActivitySegment[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(segments))
}

export function syncActivitylog(online: boolean): ActivitySegment[] {
  if (typeof localStorage === 'undefined') return []
  if (!online) {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ActivitySegment[]) : []
  }
  localStorage.removeItem(STORAGE_KEY)
  return []
}

export function fixtureActivityLog(): ActivitySegment[] {
  return classifyShift(fixtureShiftSamples, fixtureShiftPower)
}
