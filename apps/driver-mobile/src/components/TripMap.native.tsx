import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/useAppTheme'
import { MapChrome } from './map/MapChrome'
import type { TripMapProps } from './map/types'

export function TripMap({ path, driver, pickups, trail, live, height = 340 }: TripMapProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const followRef = useRef(true)
  const driverRef = useRef(driver)
  driverRef.current = driver

  function showPickups() {
    followRef.current = false
    const focus = pickups.length > 0 ? pickups : path
    if (focus.length === 0) return
    mapRef.current?.fitToCoordinates(focus, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    })
  }

  function showDriver() {
    followRef.current = true
    mapRef.current?.animateToRegion(
      {
        latitude: driver.latitude,
        longitude: driver.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400,
    )
  }

  useEffect(() => {
    const focus = pickups.length > 0 ? pickups : path
    if (focus.length === 0) return
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(focus, {
        edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
        animated: false,
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [path, pickups])

  useEffect(() => {
    if (!live || !followRef.current) return
    mapRef.current?.animateToRegion(
      {
        latitude: driver.latitude,
        longitude: driver.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400,
    )
  }, [driver.latitude, driver.longitude, live])

  return (
    <MapChrome live={live} onCenter={showDriver} onPickups={showPickups}>
      <View
        style={{
          height,
          borderRadius: theme.radii.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.primarySoft,
        }}
      >
        <MapView
          ref={mapRef}
          accessibilityLabel={t('tripTitle')}
          style={{ width: '100%', height }}
          initialRegion={{
            latitude: driver.latitude,
            longitude: driver.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPanDrag={() => {
            followRef.current = false
          }}
        >
          <Polyline testID="route-line" coordinates={path} strokeColor={theme.colors.secondary} strokeWidth={5} />
          {trail.length > 1 ? (
            <Polyline coordinates={trail} strokeColor={theme.colors.primary} strokeWidth={4} />
          ) : null}
          {pickups.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={stop}
              title={t('pickupLocation', { n: stop.index })}
              pinColor={theme.colors.primary}
            />
          ))}
          <Marker
            testID="latest-marker"
            coordinate={driver}
            title={t('driverLocation')}
            pinColor={theme.colors.warning}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: theme.colors.warning,
                borderWidth: 3,
                borderColor: '#0F172A',
              }}
            />
          </Marker>
        </MapView>
      </View>
    </MapChrome>
  )
}
