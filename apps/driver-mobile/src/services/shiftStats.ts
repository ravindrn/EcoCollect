import { fixtureTrack, overspeedLimitKmh } from '../config/track'

export type TrackSample = {
  latitude: number
  longitude: number
  speedKmh: number
}

const earthRadiusKm = 6371

function haversineKm(a: TrackSample, b: TrackSample): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h))
}

export function trackDistanceKm(samples: TrackSample[]): number {
  let total = 0
  for (let index = 1; index < samples.length; index += 1) {
    total += haversineKm(samples[index - 1], samples[index])
  }
  return total
}

export function isOverspeed(speedKmh: number, limitKmh = overspeedLimitKmh): boolean {
  return speedKmh > limitKmh
}

export function fuelEstimateLiters(distanceKm: number): number {
  return distanceKm / 8
}

export function fixtureShift() {
  const distanceKm = trackDistanceKm(fixtureTrack)
  return {
    samples: fixtureTrack.map((sample) => ({
      ...sample,
      overspeed: isOverspeed(sample.speedKmh),
    })),
    distanceKm,
    currentSpeedKmh: fixtureTrack[fixtureTrack.length - 1]?.speedKmh ?? 0,
    fuelLiters: fuelEstimateLiters(distanceKm),
  }
}
