import type {
    ActivitySegment,
    Alert,
    Broadcast,
    Complaint,
    EngineEvent,
    GpsPoint,
    Route,
    Tractor,
    Trip,
    User,
    WeightEntry,
} from './types'

export const users: User[] = [
    { id: 'user-admin-1', name: 'Admin One', email: 'admin@ecocollect.local', role: 'ADMIN', password: 'Admin123!' },
    { id: 'user-citizen-1', name: 'Citizen One', email: 'citizen@ecocollect.local', role: 'CITIZEN', password: 'Citizen123!' },
    { id: 'user-driver-1', name: 'Driver One', email: 'driver1@ecocollect.local', role: 'DRIVER', password: 'Driver123!' },
    { id: 'user-driver-2', name: 'Driver Two', email: 'driver2@ecocollect.local', role: 'DRIVER', password: 'Driver123!' },
    { id: 'user-driver-3', name: 'Driver Three', email: 'driver3@ecocollect.local', role: 'DRIVER', password: 'Driver123!' },
    { id: 'user-driver-4', name: 'Driver Four', email: 'driver4@ecocollect.local', role: 'DRIVER', password: 'Driver123!' },
    { id: 'user-driver-5', name: 'Driver Five', email: 'driver5@ecocollect.local', role: 'DRIVER', password: 'Driver123!' },
    { id: 'user-driver-6', name: 'Driver Six', email: 'driver6@ecocollect.local', role: 'DRIVER', password: 'Driver123!' },
]

export const tractors: Tractor[] = [
    { id: 'tractor-1', name: 'Tractor 1', registrationNumber: 'SP-1001' },
    { id: 'tractor-2', name: 'Tractor 2', registrationNumber: 'SP-1002' },
    { id: 'tractor-3', name: 'Tractor 3', registrationNumber: 'SP-1003' },
    { id: 'tractor-4', name: 'Tractor 4', registrationNumber: 'SP-1004' },
    { id: 'tractor-5', name: 'Tractor 5', registrationNumber: 'SP-1005' },
  ]

const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const
export const routes: Route[] = [1, 2, 3, 4, 5].map((n) => ({
    id: `route-${n}`,
    name: `Route ${n}`,
    tractorId: `tractor-${n}`,
    driverId: `user-driver-${n}`,
    weekdays: [...weekdays],
    plannedStart: '08:00',
    plannedEnd: '12:00',
    stopCount: 20,
    expectedWeightKg: 500,
    path: [
        {latitude: 6.06, longitude: 80.22 },
        {latitude: 6.07, longitude: 80.23 },
    ],
}))

export const trips: Trip[] = [
    {
        id: 'trip-1',
        routeId: 'route-1',
        tractorId: 'tractor-1',
        driverId: 'user-driver-1',
        date: '2026-10-13',
        plannedStart: '2026-10-13T08:00:00.000Z',
        plannedEnd: '2026-10-13T12:00:00.000Z',
        actualStart: '2026-10-13T08:10:00.000Z',
        actualEnd: '2026-10-13T12:20:00.000Z',
    },
]

export const gpsPoints: GpsPoint[] = [
    {
        id: 'gps-1',
        tripId: 'trip-1',
        latitude: 6.06,
        longitude: 80.22,
        speedKmh: 18,
        recordedAt: '2026-10-13T08:15:00.000Z',
    },
]

export const engineEvents: EngineEvent[] = [
    { id: 'engine-1', tripId: 'trip-1', state: 'ON', recordedAt: '2026-10-13T08:10:00.000Z' },
    { id: 'engine-2', tripId: 'trip-1', state: 'OFF', recordedAt: '2026-10-13T12:20:00.000Z' },
]

export const weightEntries: WeightEntry[] = [
    {
        id: 'weight-1',
        tripId: 'trip-1',
        weightKg: 480,
        householdLimitKg: 30,
        recordedAt: '2026-10-13T12:25:00.000Z',
    },
]

export const activitySegments: ActivitySegment[] = [
    {
      id: 'activity-1',
      tripId: 'trip-1',
      kind: 'MOVING',
      startedAt: '2026-10-13T08:10:00.000Z',
      endedAt: '2026-10-13T09:10:00.000Z',
    },
  ]

export const complaints: Complaint[] = [
    {
        id: 'complaint-1',
    area: 'Bope',
    message: 'Collection was missed',
    status: 'OPEN',
    createdAt: '2026-10-13T13:00:00.000Z',
    },
]

export const broadcasts: Broadcast[] = [
    {
        id: 'broadcast-1',
        message: 'Route 1 starts at 08:00',
        driverIds: ['user-driver-1'],
        smsFallback: false,
        sentAt: '2026-10-13T07:30:00.000Z',
    },
]

export const alerts: Alert[] = [
    {
        id: 'alert-1',
        type: 'OVERSPEED',
        tractorId: 'tractor-1',
        routeId: 'route-1',
        recordedAt: '2026-10-13T09:00:00.000Z',
    },
]

export function loadFixtures(){
    return{
        users,
        tractors,
        routes,
        trips,
        gpsPoints,
        engineEvents,
        weightEntries,
        activitySegments,
        complaints,
        broadcasts,
        alerts
    }
}