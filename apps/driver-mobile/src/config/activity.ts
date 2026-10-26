export const idleSpeedKmh = 5
export const idleAfterMs = 10 * 60 * 1000

// Shift length: 60 min. Expected segments: 20 moving, 5 short stop, 20 idle, 15 moving.
export const fixtureShiftSamples = [
  { recordedAt: '2026-10-13T08:00:00.000Z', speedKmh: 18 },
  { recordedAt: '2026-10-13T08:20:00.000Z', speedKmh: 0 },
  { recordedAt: '2026-10-13T08:25:00.000Z', speedKmh: 0 },
  { recordedAt: '2026-10-13T08:45:00.000Z', speedKmh: 30 },
  { recordedAt: '2026-10-13T09:00:00.000Z', speedKmh: 30 },
]

export const fixtureShiftPower = [
  { state: 'ON' as const, recordedAt: '2026-10-13T08:00:00.000Z' },
  { state: 'OFF' as const, recordedAt: '2026-10-13T09:00:00.000Z' },
]
