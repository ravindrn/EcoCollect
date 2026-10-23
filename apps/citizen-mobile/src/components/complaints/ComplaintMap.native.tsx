import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import MapView, {
  Marker,
  type MapPressEvent,
} from 'react-native-maps';

import type { ComplaintLocation } from '../../types/complaint';

type Props = {
  initialLocation?: ComplaintLocation | null;
  onConfirm: (location: ComplaintLocation) => void;
  onCancel: () => void;
};

const DEFAULT_REGION = {
  latitude: 6.0535,
  longitude: 80.221,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export function ComplaintMap({
  initialLocation,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] =
    useState<ComplaintLocation | null>(
      initialLocation ?? null,
    );

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } =
      event.nativeEvent.coordinate;

    setSelected({ latitude, longitude });
  };

  return (
    <View className="flex-1 gap-4 rounded-2xl bg-white p-4">
      <View className="gap-1">
        <Text className="text-xl font-bold text-slate-900">
          Choose Location
        </Text>

        <Text className="text-sm text-slate-500">
          Tap the map to select the complaint location.
        </Text>
      </View>

      <View className="overflow-hidden rounded-2xl border border-slate-200">
        <MapView
          className="h-[350px] w-full"
          initialRegion={{
            ...DEFAULT_REGION,
            ...(initialLocation
              ? {
                  latitude: initialLocation.latitude,
                  longitude: initialLocation.longitude,
                }
              : {}),
          }}
          onPress={handleMapPress}
        >
          {selected && (
            <Marker coordinate={selected} />
          )}
        </MapView>
      </View>

      <View className="rounded-xl bg-emerald-50 p-3">
        <Text className="mb-1 text-sm font-semibold text-emerald-800">
          Selected Coordinates
        </Text>

        <Text className="text-sm text-slate-700">
          {selected
            ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
            : 'No location selected yet'}
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