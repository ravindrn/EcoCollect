import { createElement, memo, useEffect, useRef, useState, type RefObject } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Banner } from '@/components/ui/Banner'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAppTheme } from '@/hooks/useAppTheme'
import { mapFocusPoints, type MapPoint } from '@/services/todayRoute'
import { MapChrome } from './map/MapChrome'
import type { TripMapProps } from './map/types'

type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer
  remove: () => void
  setLatLng: (latlng: [number, number]) => void
  bindTooltip: (text: string) => LeafletLayer
}

type LeafletMap = {
  remove: () => void
  on: (event: string, handler: () => void) => void
  invalidateSize: () => void
  fitBounds: (bounds: unknown, options?: object) => void
  panTo: (latlng: [number, number]) => void
  setView: (latlng: [number, number], zoom: number) => void
}

type LeafletApi = {
  map: (el: HTMLElement, options?: object) => LeafletMap
  tileLayer: (url: string, options?: object) => { addTo: (map: LeafletMap) => void }
  polyline: (latlngs: [number, number][], options?: object) => LeafletLayer
  circleMarker: (latlng: [number, number], options?: object) => LeafletLayer
  marker: (latlng: [number, number], options?: object) => LeafletLayer
  divIcon: (options: object) => unknown
  latLngBounds: (latlngs: [number, number][]) => unknown
}

const toLatLng = (point: MapPoint): [number, number] => [point.latitude, point.longitude]

let leafletPromise: Promise<LeafletApi> | null = null

function loadLeaflet(): Promise<LeafletApi> {
  if (typeof document === 'undefined') return Promise.reject(new Error('MAP_FAILED'))
  const host = window as Window & { L?: LeafletApi }
  if (host.L) return Promise.resolve(host.L)
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const cssReady = new Promise<void>((resolve) => {
        if (document.getElementById('leaflet-css')) {
          resolve()
          return
        }
        const css = document.createElement('link')
        css.id = 'leaflet-css'
        css.rel = 'stylesheet'
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        css.onload = () => resolve()
        css.onerror = () => resolve()
        document.head.appendChild(css)
      })
      if (!document.getElementById('ecocollect-map-style')) {
        const style = document.createElement('style')
        style.id = 'ecocollect-map-style'
        style.textContent = [
          '.ecocollect-live-map .leaflet-container { z-index: 0; font-family: inherit; background: #dbe4ea; }',
          '@keyframes ecocollect-pulse { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.65); } 100% { box-shadow: 0 0 0 14px rgba(245,158,11,0); } }',
          '.ecocollect-driver-live { animation: ecocollect-pulse 1.6s ease-out infinite; }',
        ].join('')
        document.head.appendChild(style)
      }
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => {
        void cssReady.then(() => (host.L ? resolve(host.L) : reject(new Error('MAP_FAILED'))))
      }
      script.onerror = () => {
        leafletPromise = null
        script.remove()
        reject(new Error('MAP_FAILED'))
      }
      document.head.appendChild(script)
    })
  }
  return leafletPromise
}

const MapCanvas = memo(function MapCanvas({
  height,
  canvasRef,
}: {
  height: number
  canvasRef: RefObject<HTMLDivElement | null>
}) {
  return createElement('div', {
    ref: canvasRef,
    className: 'ecocollect-live-map',
    style: { height, width: '100%' },
  })
})

function canvasReady(canvas: HTMLDivElement | null) {
  return Boolean(canvas && canvas.isConnected && canvas.clientWidth > 0 && canvas.clientHeight > 0)
}

function safely(run: () => void) {
  try {
    run()
  } catch {
    // Leaflet throws if its container was hidden or already removed.
  }
}

function driverIcon(color: string, live: boolean) {
  const pulse = live ? ' ecocollect-driver-live' : ''
  return `<div class="${pulse.trim()}" style="width:22px;height:22px;border-radius:11px;background:${color};border:3px solid #0F172A"></div>`
}

export function TripMap({ path, driver, pickups, trail, live, height = 340 }: TripMapProps) {
  const theme = useAppTheme()
  const { t, i18n } = useTranslation()
  const labelRef = useRef(t)
  labelRef.current = t
  const canvasRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<LeafletApi | null>(null)
  const routeLayers = useRef<LeafletLayer[]>([])
  const trailLayer = useRef<LeafletLayer | null>(null)
  const driverLayer = useRef<LeafletLayer | null>(null)
  const followRef = useRef(true)
  const fittedPath = useRef('')
  const sawLiveRef = useRef(false)
  const driverRef = useRef(driver)
  driverRef.current = driver
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let map: LeafletMap | null = null
    fittedPath.current = ''
    const stopWheel = (event: WheelEvent) => event.stopPropagation()
    canvas.addEventListener('wheel', stopWheel)

    void loadLeaflet()
      .then((L) => {
        if (cancelled) return
        leafletRef.current = L
        map = L.map(canvas, { zoomControl: true, attributionControl: true })
        map.setView(toLatLng(driverRef.current), 14)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map)
        map.on('dragstart', () => {
          followRef.current = false
        })
        mapRef.current = map
        setStatus('ready')
        requestAnimationFrame(() => safely(() => map?.invalidateSize()))
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      canvas.removeEventListener('wheel', stopWheel)
      safely(() => routeLayers.current.forEach((layer) => layer.remove()))
      routeLayers.current = []
      safely(() => trailLayer.current?.remove())
      trailLayer.current = null
      safely(() => driverLayer.current?.remove())
      driverLayer.current = null
      safely(() => map?.remove())
      mapRef.current = null
    }
  }, [attempt])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    let announced = false
    const observer = new ResizeObserver(() => {
      const ready = canvasReady(canvas)
      if (ready && !announced) {
        announced = true
        setShown((value) => value + 1)
      }
      if (!ready) announced = false
      if (ready) safely(() => mapRef.current?.invalidateSize())
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [attempt])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || status !== 'ready' || !canvasReady(canvasRef.current)) return
    safely(() => routeLayers.current.forEach((layer) => layer.remove()))
    safely(() => {
      const route = L.polyline(path.map(toLatLng), { color: theme.colors.secondary, weight: 5, opacity: 0.95 }).addTo(map)
      const stops = pickups.map((stop) =>
        L.circleMarker(toLatLng(stop), {
          radius: 7,
          color: '#0F172A',
          weight: 2,
          fillColor: theme.colors.primary,
          fillOpacity: 1,
        })
          .bindTooltip(labelRef.current('pickupLocation', { n: stop.index }))
          .addTo(map),
      )
      routeLayers.current = [route, ...stops]
      const pathKey = path.length > 1 ? `${path.length}:${path[0].latitude}:${path[path.length - 1].longitude}` : ''
      if (pathKey && fittedPath.current !== pathKey) {
        const focus = pickups.length > 0 ? pickups : path
        if (focus.length > 0) {
          map.invalidateSize()
          map.fitBounds(L.latLngBounds(focus.map(toLatLng)), { padding: [28, 28], maxZoom: 16 })
        }
        fittedPath.current = pathKey
      }
    })
  }, [path, pickups, shown, status, i18n.language, theme.colors.primary, theme.colors.secondary])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || status !== 'ready' || !canvasReady(canvasRef.current)) return
    safely(() => trailLayer.current?.remove())
    safely(() => {
      trailLayer.current =
        trail.length > 1
          ? L.polyline(trail.map(toLatLng), { color: theme.colors.primary, weight: 4, opacity: 0.9 }).addTo(map)
          : null
    })
  }, [shown, status, theme.colors.primary, trail])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || status !== 'ready' || !canvasReady(canvasRef.current)) return
    const latlng = toLatLng(driver)
    safely(() => driverLayer.current?.remove())
    safely(() => {
      driverLayer.current = L.marker(latlng, {
        icon: L.divIcon({
          className: '',
          html: driverIcon(theme.colors.warning, live),
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        zIndexOffset: 800,
      })
        .bindTooltip(labelRef.current('driverLocation'))
        .addTo(map)
      if (live && !sawLiveRef.current) {
        sawLiveRef.current = true
        followRef.current = mapFocusPoints(path, pickups, driver, 2).includes(driver)
      }
      if (followRef.current && live) map.panTo(latlng)
    })
  }, [driver, live, path, pickups, shown, status, i18n.language, theme.colors.warning])

  function showDriver() {
    const map = mapRef.current
    if (!map || !canvasReady(canvasRef.current)) return
    followRef.current = true
    safely(() => map.setView(toLatLng(driver), 16))
  }

  function showPickups() {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L || !canvasReady(canvasRef.current)) return
    followRef.current = false
    const focus = pickups.length > 0 ? pickups : path
    if (focus.length === 0) return
    safely(() => map.fitBounds(L.latLngBounds(focus.map(toLatLng)), { padding: [28, 28], maxZoom: 16 }))
  }

  return (
    <MapChrome live={live} onCenter={showDriver} onPickups={showPickups}>
      <View
        accessibilityLabel={t('tripTitle')}
        testID="route-line"
        style={{
          height,
          borderRadius: theme.radii.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.primarySoft,
        }}
      >
        <MapCanvas height={height} canvasRef={canvasRef} />
        {status === 'loading' ? (
          <View style={{ position: 'absolute', left: theme.spacing.lg, right: theme.spacing.lg, top: theme.spacing.lg }}>
            <Skeleton label={t('mapLoading')} lines={2} />
          </View>
        ) : null}
      </View>
      {status === 'error' ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Banner tone="danger" message={t('mapFailed')} />
          <PrimaryButton
            label={t('queueRetry')}
            onPress={() => {
              setStatus('loading')
              setAttempt((value) => value + 1)
            }}
            style={{ marginTop: theme.spacing.md }}
          />
        </View>
      ) : null}
      <View testID="latest-marker" accessibilityLabel={t('driverLocation')} />
    </MapChrome>
  )
}
