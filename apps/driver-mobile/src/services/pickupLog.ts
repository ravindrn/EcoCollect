const KEY = 'ecocollect.driver.pickups'

export const pickupReasons = ['BIN_NOT_FOUND', 'BIN_DAMAGED', 'ACCESS_BLOCKED', 'ALREADY_EMPTY', 'OTHER'] as const

export type PickupReason = (typeof pickupReasons)[number]

export type PickupRecord = {
  stopId: string
  status: 'collected' | 'missed'
  reason: PickupReason | null
  note: string | null
}

let memory: PickupRecord[] = []

function readStored(): PickupRecord[] {
  if (typeof localStorage === 'undefined') return memory
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as PickupRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({ ...item, note: item.note ?? null }))
  } catch {
    return []
  }
}

function writeStored(records: PickupRecord[]) {
  memory = records
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(records))
}

export function readPickupLog(): PickupRecord[] {
  return readStored()
}

export function savePickup(record: PickupRecord): PickupRecord[] {
  const next = readStored().filter((item) => item.stopId !== record.stopId)
  next.push(record)
  writeStored(next)
  return next
}
