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

export type PickupStop = MapPoint & {
    id: string
    index: number
}

export function distanceKm(origin: MapPoint, point: MapPoint) {
    const latRad = (((origin.latitude + point.latitude) / 2) * Math.PI) / 180
    const x = (point.longitude - origin.longitude) * 111.32 * Math.cos(latRad)
    const y = (point.latitude - origin.latitude) * 110.57
    return Math.hypot(x, y)
}

// Stops are spaced along a road line. The fixture only stores how many stops the route has.
export function pickupsAlongPath(path: MapPoint[], stopCount: number): PickupStop[] {
    if (path.length === 0 || stopCount < 1) return []
    const count = Math.floor(stopCount)
    const stop = (index: number, latitude: number, longitude: number): PickupStop => ({
        id: `pickup-${index}`,
        index,
        latitude,
        longitude,
    })
    if (count === 1 || path.length === 1) return [stop(1, path[0].latitude, path[0].longitude)]

    const legs = path.slice(0, -1).map((from, index) => ({
        from,
        to: path[index + 1],
        length: distanceKm(from, path[index + 1]),
    }))
    const total = legs.reduce((sum, leg) => sum + leg.length, 0)
    if (total === 0) {
        return Array.from({ length: count }, (_, index) => stop(index + 1, path[0].latitude, path[0].longitude))
    }

    return Array.from({ length: count }, (_, index) => {
        if (index === 0) return stop(1, path[0].latitude, path[0].longitude)
        if (index === count - 1) {
            const end = path[path.length - 1]
            return stop(count, end.latitude, end.longitude)
        }
        const target = (total * index) / (count - 1)
        let walked = 0
        for (const leg of legs) {
            if (walked + leg.length >= target) {
                const span = leg.length === 0 ? 0 : (target - walked) / leg.length
                return stop(
                    index + 1,
                    leg.from.latitude + (leg.to.latitude - leg.from.latitude) * span,
                    leg.from.longitude + (leg.to.longitude - leg.from.longitude) * span,
                )
            }
            walked += leg.length
        }
        const end = path[path.length - 1]
        return stop(index + 1, end.latitude, end.longitude)
    })
}

export function mapFocusPoints(path: MapPoint[], pickups: PickupStop[], driver: MapPoint, withinKm = 25) {
    const routePoints = pickups.length > 0 ? pickups : path
    const near = routePoints.some((point) => distanceKm(point, driver) <= withinKm)
    return near ? [...routePoints, driver] : routePoints
}

export function todayMapForEmail(email: string): { path: MapPoint[]; latest: MapPoint; stopCount: number } | null {
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
        stopCount: route.stopCount,
    }
}

export function trackerPowerForEmail(email: string): { state: 'ON' | 'OFF'; recordedAt: string }[] {
    const data = loadFixtures()
    const driverId = seedDriverIds[email] ?? data.users.find((user) => user.email === email)?.id
    if (!driverId) return []

    const route = data.routes.find((item) => item.driverId === driverId)
    if (!route) return []

    const trip = data.trips.find((item) => item.routeId === route.id)
    if (!trip) return []

    return data.engineEvents
        .filter((event) => event.tripId === trip.id)
        .map((event) => ({ state: event.state, recordedAt: event.recordedAt }))
}
