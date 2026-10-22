import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getLiveVehicles,
  getVehicleHistory,
  type LiveVehicle,
  type VehicleHistory,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { VehicleSidebar } from '../components/VehicleSidebar';
import { colors } from '../theme/colors';

setWorkerUrl(maplibreWorkerUrl);

const REFRESH_MS = 5000;
const MAP_CENTER: [number, number] = [79.9, 6.9];
const MAP_ZOOM = 13;

type HistoryState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; history: VehicleHistory }
  | { kind: 'error'; message: string };

type FilterMode = 'all' | 'moving' | 'stopped';

// ---------- Marker element factories ----------

function makeVehicleElement(
  color: string,
  heading: number | null,
  isSelected: boolean,
): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    position: relative;
    width: ${isSelected ? 48 : 38}px;
    height: ${isSelected ? 48 : 38}px;
    cursor: pointer;
    transition: transform 0.15s ease;
  `;

  const hasHeading = heading != null;

  el.innerHTML = `
    <div style="
      position:absolute; inset: 4px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(15,23,42,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size: ${isSelected ? 20 : 15}px;
    ">🚚</div>
    ${
      hasHeading
        ? `<div style="
            position:absolute;
            top:-6px; left:50%;
            transform: translateX(-50%) rotate(${heading!}deg);
            transform-origin: 50% calc(100% + ${isSelected ? 24 : 19}px);
            font-size: 14px;
            color: ${color};
            text-shadow: 0 1px 2px rgba(255,255,255,0.9);
          ">▲</div>`
        : ''
    }
  `;
  return el;
}

function makeEndpointElement(kind: 'start' | 'end'): HTMLDivElement {
  const el = document.createElement('div');
  const bg = kind === 'start' ? '#15803D' : '#B91C1C';
  const label = kind === 'start' ? 'S' : 'E';
  el.style.cssText = `
    width: 26px; height: 26px; border-radius: 50%;
    background: ${bg}; color: white;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(15,23,42,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800;
  `;
  el.textContent = label;
  return el;
}

// ---------- Main page ----------

export function LiveMapPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState>({ kind: 'idle' });
  const [filter, setFilter] = useState<FilterMode>('all');

  // Time slider: 0 = oldest, 100 = now
  const [timePercent, setTimePercent] = useState(100);

  const filteredVehicles = useMemo(() => {
    if (filter === 'moving') return vehicles.filter((v) => v.isMoving);
    if (filter === 'stopped') return vehicles.filter((v) => !v.isMoving);
    return vehicles;
  }, [vehicles, filter]);

  // ---------- Map setup ----------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    setTimeout(() => map.resize(), 300);
    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      startMarkerRef.current = null;
      endMarkerRef.current = null;
    };
  }, []);

  // ---------- Poll live vehicles ----------
  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const list = await getLiveVehicles();
        if (cancelled) return;
        setVehicles(list);
        setError(null);
        setLastRefresh(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load vehicles',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchLive();
    const timer = window.setInterval(fetchLive, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // ---------- Update vehicle markers ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    filteredVehicles.forEach((v) => {
      if (!v.lastLocation) return;
      seen.add(v.id);
      const { latitude, longitude, heading } = v.lastLocation;
      const color = v.isMoving ? colors.success : colors.textMuted;
      const isSelected = v.id === selectedId;
      const key = `${v.id}|${isSelected}|${heading ?? 'x'}|${color}`;

      const existing = markersRef.current.get(v.id);
      if (existing) {
        // Check if we need to recreate the element (heading/selected changed)
        const el = existing.getElement();
        const currentKey = el.getAttribute('data-key');
        if (currentKey !== key) {
          const newEl = makeVehicleElement(color, heading, isSelected);
          newEl.setAttribute('data-key', key);
          newEl.addEventListener('click', () => {
            setSelectedId((current) => (current === v.id ? null : v.id));
          });
          existing.remove();
          const marker = new maplibregl.Marker({ element: newEl })
            .setLngLat([longitude, latitude])
            .addTo(map);
          markersRef.current.set(v.id, marker);
        } else {
          existing.setLngLat([longitude, latitude]);
        }
      } else {
        const el = makeVehicleElement(color, heading, isSelected);
        el.setAttribute('data-key', key);
        el.addEventListener('click', () => {
          setSelectedId((current) => (current === v.id ? null : v.id));
        });
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
        markersRef.current.set(v.id, marker);
      }
    });

    // Remove markers for vehicles filtered out
    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [filteredVehicles, selectedId]);

  // ---------- Fetch history when selectedId changes ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old trail and endpoints
    if (map.getLayer('route-trail')) map.removeLayer('route-trail');
    if (map.getSource('route-trail')) map.removeSource('route-trail');
    startMarkerRef.current?.remove();
    startMarkerRef.current = null;
    endMarkerRef.current?.remove();
    endMarkerRef.current = null;

    if (!selectedId) {
      setHistory({ kind: 'idle' });
      setTimePercent(100);
      return;
    }

    let cancelled = false;
    setHistory({ kind: 'loading' });
    setTimePercent(100);

    (async () => {
      try {
        const h = await getVehicleHistory(selectedId, { limit: 500 });
        if (cancelled) return;
        setHistory({ kind: 'ok', history: h });

        if (h.points.length >= 2 && map) {
          const coords = h.points.map((p) => [p.longitude, p.latitude]);

          map.addSource('route-trail', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: coords },
            },
          });

          map.addLayer({
            id: 'route-trail',
            type: 'line',
            source: 'route-trail',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': colors.primary,
              'line-width': 4,
              'line-opacity': 0.9,
            },
          });

          // Start marker (green S)
          const first = h.points[0]!;
          startMarkerRef.current = new maplibregl.Marker({
            element: makeEndpointElement('start'),
          })
            .setLngLat([first.longitude, first.latitude])
            .addTo(map);

          // End marker (red E)
          const last = h.points[h.points.length - 1]!;
          endMarkerRef.current = new maplibregl.Marker({
            element: makeEndpointElement('end'),
          })
            .setLngLat([last.longitude, last.latitude])
            .addTo(map);

          const bounds = new maplibregl.LngLatBounds();
          coords.forEach((c) => bounds.extend(c as [number, number]));
          map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
        }
      } catch (err) {
        if (!cancelled) {
          setHistory({
            kind: 'error',
            message:
              err instanceof ApiError ? err.message : 'Failed to load history',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // ---------- Time slider effect ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (history.kind !== 'ok' || history.history.points.length < 2) {
      // Show full trail when slider is at 100
      if (map.getLayer('route-trail')) {
        map.setPaintProperty('route-trail', 'line-opacity', 0.9);
      }
      if (map.getLayer('route-trail-partial')) {
        map.removeLayer('route-trail-partial');
      }
      if (map.getSource('route-trail-partial')) {
        map.removeSource('route-trail-partial');
      }
      return;
    }

    const points = history.history.points;
    const cutoff = Math.max(
      1,
      Math.round((timePercent / 100) * points.length),
    );
    const visible = points.slice(0, cutoff);
    const coords = visible.map((p) => [p.longitude, p.latitude]);

    if (map.getSource('route-trail-partial')) {
      (map.getSource('route-trail-partial') as maplibregl.GeoJSONSource)
        .setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords as [number, number][] },
        });
    } else {
      map.addSource('route-trail-partial', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords as [number, number][] },
        },
      });
      map.addLayer({
        id: 'route-trail-partial',
        type: 'line',
        source: 'route-trail-partial',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#F97316',
          'line-width': 5,
          'line-opacity': 0.95,
        },
      });
    }

    // Move the end marker to the visible end
    if (endMarkerRef.current && visible.length > 0) {
      const last = visible[visible.length - 1]!;
      endMarkerRef.current.setLngLat([last.longitude, last.latitude]);
    }
  }, [timePercent, history]);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    const valid = filteredVehicles.filter((v) => v.lastLocation);
    if (valid.length === 0) {
      map.setCenter(MAP_CENTER);
      map.setZoom(MAP_ZOOM);
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    valid.forEach((v) => {
      bounds.extend([v.lastLocation!.longitude, v.lastLocation!.latitude]);
    });
    map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
  };

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <VehicleSidebar
        vehicles={filteredVehicles}
        selectedId={selectedId}
        onSelect={(id) =>
          setSelectedId((current) => (current === id ? null : id))
        }
        loading={loading}
        lastRefresh={lastRefresh}
        onResetView={resetView}
        filter={filter}
        onFilterChange={setFilter}
      />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'rgba(255,255,255,0.95)',
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            color: colors.textPrimary,
            zIndex: 1000,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(15,23,42,0.1)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: colors.success,
              }}
            />
            Moving
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: colors.textMuted,
              }}
            />
            Stopped
          </span>
        </div>

        {/* Time slider */}
        {history.kind === 'ok' && history.history.points.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.97)',
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: '12px 18px',
              width: 'min(560px, 70%)',
              zIndex: 1000,
              boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              <span>Route playback</span>
              <span style={{ fontWeight: 700, color: colors.primary }}>
                {(() => {
                  const points = history.history.points;
                  const cutoff = Math.max(
                    1,
                    Math.round((timePercent / 100) * points.length),
                  );
                  const p = points[cutoff - 1]!;
                  return new Date(p.recordedAt).toLocaleTimeString();
                })()}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={timePercent}
              onChange={(e) => setTimePercent(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: colors.primary,
                cursor: 'pointer',
              }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              background: colors.errorSoft,
              border: '1px solid #FECACA',
              color: colors.error,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              zIndex: 1000,
            }}
          >
            {error}
          </div>
        )}

        {history.kind === 'ok' && history.history.points.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.97)',
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 14,
              fontSize: 13,
              color: colors.textPrimary,
              minWidth: 220,
              zIndex: 1000,
              boxShadow: '0 4px 16px rgba(15,23,42,0.1)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {history.history.plateNumber}
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              {history.history.name}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>
              {history.history.points.length} points · route history
            </div>
            <div
              style={{ marginTop: 4, fontSize: 11, color: colors.textMuted }}
            >
              {new Date(
                history.history.points[0]!.recordedAt,
              ).toLocaleTimeString()}{' '}
              →{' '}
              {new Date(
                history.history.points[
                  history.history.points.length - 1
                ]!.recordedAt,
              ).toLocaleTimeString()}
            </div>
          </div>
        )}

        {history.kind === 'loading' && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              background: 'rgba(255,255,255,0.95)',
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              color: colors.textSecondary,
              zIndex: 1000,
            }}
          >
            Loading route history…
          </div>
        )}
      </div>
    </div>
  );
}