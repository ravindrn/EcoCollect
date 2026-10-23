import { StyleSheet, View } from 'react-native'
import type { MapPoint } from '../services/todayRoute'

type Props = {
  path: MapPoint[]
  latest: MapPoint
}

const SIZE = 280
const PAD = 36

function project(point: MapPoint, points: MapPoint[]) {
  const lats = points.map((item) => item.latitude)
  const lngs = points.map((item) => item.longitude)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = maxLat - minLat || 0.01
  const lngSpan = maxLng - minLng || 0.01
  const inner = SIZE - PAD * 2
  return {
    left: PAD + ((point.longitude - minLng) / lngSpan) * inner,
    top: PAD + (1 - (point.latitude - minLat) / latSpan) * inner,
  }
}

export function TripMap({ path, latest }: Props) {
  const all = [...path, latest]
  const dots: { left: number; top: number }[] = []
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = project(path[index], all)
    const end = project(path[index + 1], all)
    for (let step = 0; step <= 16; step += 1) {
      const t = step / 16
      dots.push({
        left: start.left + (end.left - start.left) * t,
        top: start.top + (end.top - start.top) * t,
      })
    }
  }
  const marker = project(latest, all)

  return (
    <View accessibilityLabel="Trip map" style={styles.map}>
      <View accessibilityLabel="Planned route" testID="route-line">
        {dots.map((dot, index) => (
          <View key={index} style={[styles.lineDot, { left: dot.left, top: dot.top }]} />
        ))}
      </View>
      <View
        accessibilityLabel="Latest point"
        testID="latest-marker"
        style={[styles.marker, { left: marker.left - 12, top: marker.top - 12 }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  map: {
    width: SIZE,
    height: SIZE,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 16,
  },
  lineDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#B45309',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
})
