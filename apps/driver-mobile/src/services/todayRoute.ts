import { loadFixtures } from '@ecocollect/api-contracts'

const seedDriverIds: Record<string , string> = {
    'driver@ecocollect.local' : 'user-driver-1',
}

const weekdayByIndex = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

export type TodayRoute = {
    routeName: string
    tractorName: string
    plannedStart: string
    plannedEnd: string
    stopCount: number
}

export function todayRouteForEmail(email: string, now = new Date()): TodayRoute | null {
    const data = loadFixtures()

    const driverId = seedDriverIds[email] ?? data.users.find((user) => user.email === email)?.id
    if(!driverId) return null

    const route = data.routes.find((item) => item.driverId === driverId)
    if(!route) return null

    const today = weekdayByIndex[now.getDay()]
    if (!(route.weekdays as readonly string[]).includes(today)) return null

    const tractor = data.tractors.find((item) => item.id === route.tractorId)
    return {
        routeName: route.name,
        tractorName: tractor?.name ?? 'Unassigned tractor',
        plannedStart: route.plannedStart,
        plannedEnd: route.plannedEnd,
        stopCount: route.stopCount,
    }  
}

export type MapPoint = {
    latitude: number
    longitude: number
}

export function todayMapForEmail(email: string): { path: MapPoint[]; latest: MapPoint } | null {
    const data = loadFixtures()
    const driverId = seedDriverIds[email] ?? data.users.find((user) => user.email === email)?.id
    if (!driverId) return null

    const route = data.routes.find((item) => item.driverId === driverId)
    if (!route) return null

    const trip = data.trips.find((item) => item.routeId === route.id)
    const points = data.gpsPoints.filter((item) => item.tripId === trip?.id)
    const latestPoint = points[points.length - 1]

    return {
        path: route.path,
        latest: latestPoint
            ? { latitude: latestPoint.latitude, longitude: latestPoint.longitude }
            : route.path[0],
    }
}
