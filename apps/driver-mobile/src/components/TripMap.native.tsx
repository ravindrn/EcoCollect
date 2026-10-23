import MapView, { Marker, Polyline } from 'react-native-maps'
import type { MapPoint } from '../services/todayRoute'

type Props = {
  path: MapPoint[]
  latest: MapPoint
}

export function TripMap({ path, latest }: Props) {
  return (
    <MapView
      accessibilityLabel="Trip map"
      style={{ width: '100%', height: 280, marginBottom: 16 }}
      initialRegion={{
        latitude: latest.latitude,
        longitude: latest.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }}
    >
      <Polyline testID="route-line" coordinates={path} strokeColor="#0F766E" strokeWidth={4} />
      <Marker testID="latest-marker" coordinate={latest} title="Latest point" />
    </MapView>
  )
}
