import { env } from '../config/env'
import { getToken } from './session'

export type DriverStop = {
    id: string
    order: number
    placeId: string
    name: string
    latitude: number | null
    longitude: number | null
}

export type DriverRoute = {
    routeId: string
    routeName: string
    startTime: string
    vehicle: { id: string; plateNumber: string; name: string | null }
    stops: DriverStop[]
}

export async function getMyRoute(): Promise<DriverRoute | null> {
    const token = await getToken()
    const response = await fetch(`${env.apiBaseUrl}/routes/me`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
        },
    })

    const body = (await response.json()) as { data?: DriverRoute | null; error?: { message?: string } }
    if (!response.ok) throw new Error (body.error?.message ?? 'LOAD_FAILED')
    return body.data ?? null
}
