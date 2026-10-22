import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function TestMapPage() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    console.log('[TestMap] container size at mount:', {
      w: ref.current.clientWidth,
      h: ref.current.clientHeight,
    });

    const map = L.map(ref.current).setView([6.9, 79.9], 13);

   L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19,
}).addTo(map)

    L.marker([6.9, 79.9]).addTo(map).bindPopup('Hello');

    setTimeout(() => {
      console.log('[TestMap] after timeout, invalidating size');
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '600px',
        background: '#e5e7eb',
        border: '2px solid red',
      }}
    />
  );
}