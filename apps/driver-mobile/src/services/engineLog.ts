export type EngineInterval = {
  startedAt: number
  endedAt: number | null
}

export function engineOn(intervals: EngineInterval[], now: number): EngineInterval[] {
  if (intervals.some((interval) => interval.endedAt === null)) return intervals
  return [...intervals, { startedAt: now, endedAt: null }]
}

export function engineOff(intervals: EngineInterval[], now: number): EngineInterval[] {
  const openIndex = intervals.findIndex((interval) => interval.endedAt === null)
  if (openIndex === -1) return intervals
  return intervals.map((interval, index) =>
    index === openIndex ? { ...interval, endedAt: now } : interval,
  )
}

export type TrackerPowerEvent = {
  state: 'ON' | 'OFF'
  recordedAt: string
}

export function intervalsFromTrackerPower(events: TrackerPowerEvent[]): EngineInterval[] {
  const ordered = [...events].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
  return ordered.reduce<EngineInterval[]>((intervals, event) => {
    const at = Date.parse(event.recordedAt)
    return event.state === 'ON' ? engineOn(intervals, at) : engineOff(intervals, at)
  }, [])
}

export function engineOnMs(intervals: EngineInterval[]): number {
  return intervals.reduce((total, interval) => {
    if (interval.endedAt === null) return total
    return total + (interval.endedAt - interval.startedAt)
  }, 0)
}
