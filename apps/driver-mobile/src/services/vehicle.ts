import { env } from '../config/env'
import { getToken } from './session'

export type VehicleLocation = {
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  recordedAt: string
}

export type DriverVehicle = {
  id: string
  plateNumber: string
  name: string | null
  lastLocation: VehicleLocation | null
}

type VehicleResponse = {
  success: boolean
  data?: DriverVehicle | null
  error?: { message?: string }
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken()
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? ''}`,
  }
}

export async function getMyVehicle(): Promise<DriverVehicle | null> {
  const response = await fetch(`${env.apiBaseUrl}/vehicles/me`, {
    headers: await authHeaders(),
  })
  const body = (await response.json()) as VehicleResponse
  if (!response.ok) {
    throw new Error(body.error?.message ?? 'LOAD_FAILED')
  }
  return body.data ?? null
}

export type RouteAlertKind = 'OUTSIDE' | 'INSIDE'

export async function postRouteAlert(
  vehicleId: string,
  alert: {
    kind: RouteAlertKind
    latitude: number
    longitude: number
    routeName: string | null
    recordedAt: string
  },
): Promise<void> {
  const response = await fetch(`${env.apiBaseUrl}/vehicles/${vehicleId}/route-alerts`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(alert),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as VehicleResponse | null
    throw new Error(body?.error?.message ?? 'ALERT_FAILED')
  }
}

export async function pingVehicle(
  vehicleId: string,
  point: { latitude: number; longitude: number; speedKmh: number | null },
): Promise<void> {
  const response = await fetch(`${env.apiBaseUrl}/vehicles/${vehicleId}/ping`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      latitude: point.latitude,
      longitude: point.longitude,
      ...(point.speedKmh != null ? { speed: point.speedKmh } : {}),
    }),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as VehicleResponse | null
    throw new Error(body?.error?.message ?? 'PING_FAILED')
  }
}
