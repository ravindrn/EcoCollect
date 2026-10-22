import { env } from '../config/env'
import { adminSession } from './session'

export type Announcement = {
    id: string
    title: string
    description: string
    priority: 'NORMAL' | 'IMPORTANT' | 'URGENT'
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

type AnnouncementResponse = {
    success: boolean
    data?: Announcement
    error?: { message?: string }
}

type AnnouncementlistResponse = {
    success: boolean
    data?: Announcement[]
    error?: { message: string }
}

function authHeaders(): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSession.getToken() ?? ''}`,
    }
}

export async function createAnnouncement(
    title: string,
    description: string,
): Promise<Announcement> {
    const response = await fetch(`${env.apiBaseUrl}/announcements`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, priority: 'NORMAL' }),
    })

    const body = (await response.json()) as AnnouncementResponse
    if (!response.ok || !body.data) {
        throw new Error(body.error?.message ?? 'Could not create announcement')
    }

    return body.data
}

export async function publishAnnouncement(id: string): Promise<Announcement> {
    const response = await fetch(`${env.apiBaseUrl}/announcements/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'PUBLISHED'}),
    })

    const body = (await response.json()) as AnnouncementResponse
    if (!response.ok || !body.data) {
        throw new Error(body.error?.message ?? 'Could not publish announcement')
    }
    return body.data
}

export async function getPublishedAnnouncements(): Promise<Announcement[]> {
    const response = await fetch(`${env.apiBaseUrl}/announcements`, {
        headers: { Accept: 'application/json'},
    })

    const body = (await response.json()) as AnnouncementlistResponse
    if (!response.ok) {
        throw new Error(body.error?.message ?? 'Could not load announcements')
    }
    return body.data ?? []
}