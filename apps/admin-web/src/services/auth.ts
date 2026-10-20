import { env } from '../config/env'
import { adminSession } from './session'

type LoginResponse = {
    success: boolean
    data?: {
        token: string
        user: { role: string}
    }
    error?: {message?: string }
}

export async function login(email: string, password: string): Promise<void> {
    const response = await fetch(`${env.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type' : 'application/json', Accept: 'application/json'},
        body: JSON.stringify({ email, password }),
    })

    const body = (await response.json()) as LoginResponse

    if(!response.ok) {
        throw new Error( body.error?.message || 'Sign in failed')
    }

    if(body.data?.user.role !== 'ADMIN' || !body.data.token) {
        throw new Error('Only admins can sign in')
    }

    adminSession.setToken(body.data.token)
}