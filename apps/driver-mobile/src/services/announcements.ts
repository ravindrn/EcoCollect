import { env } from '../config/env'

export type Announcement = {
    id: string
    title: string
    description: string
    priority: 'NORMAL' | 'IMPORTANT' | 'URGENT'
    publishedAt: string | null 
}

type AnnouncementResponse = {
    success: boolean
    data?: Announcement[]
    error?: { message?: string }
}

export async function getPublishedAnnouncements(): Promise<Announcement[]> {
    const response = await fetch (`${env.apiBaseUrl}/announcements`, {
        headers: { Accept: 'application/json' },
    })

    const body = (await response.json()) as AnnouncementResponse

    if (!response.ok) {
        throw new Error(body.error?.message ?? 'Could not load announcements')
    }

    return body.data ?? []
}