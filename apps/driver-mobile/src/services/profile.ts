import { env } from '../config/env'
import { getToken } from './session'

export type DriverProfile = {
    id: string
    email: string
    role: string
    profile: { fullName: string } | null
}

type ProfileResponse = {
    success: boolean
    data?: DriverProfile
    error?: { message: string }
}

export async function getMyProfile(): Promise<DriverProfile> {
    const token = await getToken()
    const response = await fetch(`${env.apiBaseUrl}/users/me`,{
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token ?? ''}`,
    },
})

const body = (await response.json()) as ProfileResponse

if (!response.ok || !body.data) {
    throw new Error(body.error?.message ?? 'Could not load profile')
}

return body.data
}