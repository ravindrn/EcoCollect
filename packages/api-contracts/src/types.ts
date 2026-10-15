export type Role = 'DRIVER' | 'ADMIN' | 'CITIZEN'

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'

export type LatLng = {
    latitude: number
    longitude: number
}

export type User = {
    id: string
    name: string
    email: string
    role: Role
    password: string
}

export type Tractor = {
    id: string
    name: string
    registrationNumber: string
}

export type Route = {
    id: string
    name: string
    tractorId: string
    driverId: string
    weekdays: Weekday[]
    plannedStart: string
    plannedEnd: string
    stopCount: number
    expectedWeightKg: number
    path: LatLng[] 
}

export type GpsPoint = {
    id: string
    tripId: string
    latitude: number
    longitude: number
    speedKmh: number
    recordedAt: string
}

export type EngineEvent = {
    id: string
    tripId: string
    state: 'ON' | 'OFF'
    recordedAt: string    
}

export type Trip = {
    id: string
    routeId: string
    tractorId: string
    driverId: string
    date: string
    plannedStart: string
    plannedEnd: string
    actualStart: string | null
    actualEnd: string | null
}

export type WeightEntry = {
    id: string
    tripId: string
    weightKg: number
    householdLimitKg: number
    recordedAt: string
}

export type ActivitySegment = {
    id: string
    tripId: string
    kind: 'MOVING' | 'SHORT_STOP' | 'IDLE'
    startedAt: string
    endedAt: string    
}

export type Complaint = {
    id: string
    area: string
    message: string
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
    createdAt: string
}

export type Broadcast = {
    id: string
    message: string
    driverIds: string[]
    smsFallback: boolean
    sentAt: string
}

export type Alert = {
    id: string
    type: 'DEVIATION' | 'OVERSPEED' | 'BREAKDOWN'
    tractorId: string
    routeId: string
    recordedAt: string
}