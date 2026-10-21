import { env } from '../config/env'

export type Area = { 
    id: string
    name: string
}

type AreasResponse = {
    success: boolean
    data?: Area[]
    error?: { message: string }
}

export async function getAreas(): Promise<Area[]> {
    const response = await fetch(`${env.apiBaseUrl}/areas`, {
        headers: { Accept: 'application/json' },
    })
    const body = (await response.json()) as AreasResponse

    if (!response.ok) {
        throw new Error(body.error?.message ?? 'Could not load areas')
    }

    return body.data ?? []

}