import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import type { ComplaintLocation } from '../../types/complaint';

type Props = {
  initialLocation?: ComplaintLocation | null;
  onConfirm: (location: ComplaintLocation) => void;
  onCancel: () => void;
};

const DEFAULT_LOCATION: ComplaintLocation = {
  latitude: 6.0535,
  longitude: 80.221,
};

function LocationPicker({
  selected,
  onSelect,
}: {
  selected: ComplaintLocation | null;
  onSelect: (location: ComplaintLocation) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return selected ? (
    <Marker
      position={[selected.latitude, selected.longitude]}
      icon={L.divIcon({
        className: '',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #047857;
            border: 3px solid white;
            box-shadow: 0 2px 8px #0005;
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })}
    />
  ) : null;
}

export function ComplaintMap({
  initialLocation,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] =
    useState<ComplaintLocation | null>(
      initialLocation ?? null,
    );

  const center = selected ?? DEFAULT_LOCATION;

  return (
    <View className="flex-1 gap-4 rounded-2xl bg-white p-4">
      <View className="gap-1">
        <Text className="text-xl font-bold text-slate-900">
          Choose Location
        </Text>

        <Text className="text-sm text-slate-500">
          Click on the map to mark the complaint location.
        </Text>
      </View>

      <View className="h-[350px] overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={[center.latitude, center.longitude]}
          zoom={13}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationPicker
            selected={selected}
            onSelect={setSelected}
          />
        </MapContainer>
      </View>

      <View className="rounded-xl bg-emerald-50 p-3">
        <Text className="mb-1 text-sm font-semibold text-emerald-800">
          Selected Coordinates
        </Text>

        <Text className="text-sm text-slate-700">
          {selected
            ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
            : 'Click the map to select a location'}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onCancel}
          className="flex-1 items-center rounded-xl border border-slate-300 bg-white px-4 py-3"
        >
          <Text className="font-semibold text-slate-700">
            Cancel
          </Text>
        </Pressable>

        <Pressable
          disabled={!selected}
          onPress={() => {
            if (selected) onConfirm(selected);
          }}
          className={`flex-1 items-center rounded-xl px-4 py-3 ${
            selected
              ? 'bg-emerald-700'
              : 'bg-slate-300'
          }`}
        >
          <Text className="font-semibold text-white">
            Confirm Location
          </Text>
        </Pressable>
      </View>
    </View>
  );
}