import { loadFixtures } from '@ecocollect/api-contracts'

const seedDriverIds: Record<string , string> = {
    'driver@ecocollect.local' : 'user-driver-1',
}

export type TodayRoute = {
    routeName: string
    tractorName: string
    plannedStart: string
    plannedEnd: string
    stopCount: number
}

export function todayRouteForEmail(email: string): TodayRoute | null {
    const data = loadFixtures()

    const driverId = seedDriverIds[email] ?? data.users.find((user) => user.email === email)?.id
    if(!driverId) return null

    const route = data.routes.find((item) => item.driverId === driverId)
    if(!route) return null

    const tractor = data.tractors.find((item) => item.id === route.tractorId)
    return {
        routeName: route.name,
        tractorName: tractor?.name ?? 'Unassigned tractor',
        plannedStart: route.plannedStart,
        plannedEnd: route.plannedEnd,
        stopCount: route.stopCount,
    }  
}