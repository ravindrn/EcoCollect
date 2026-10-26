import { Text, View, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';

type AppHeaderProps = {
  showNotifications?: boolean;
  onNotificationPress?: () => void;
};

export function AppHeader({
  showNotifications = true,
  onNotificationPress,
}: AppHeaderProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/60 p-3 shadow-sm">
      <View className="flex-1 flex-row items-center">
        {/* Logo tile */}
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm">
          <Text className="text-[26px]">♻️</Text>
        </View>

        {/* Brand */}
        <View className="flex-1">
          <Text
            className="text-[22px] font-extrabold tracking-tight text-slate-900"
            numberOfLines={1}
          >
            Eco<Text className="text-emerald-600">Collect</Text>
          </Text>

          <Text className="mt-0.5 text-xs font-medium text-slate-500">
            Smart Waste Management
          </Text>
        </View>
      </View>

      {showNotifications && (
        <Pressable
          className="relative ml-3 h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm"
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={21} color="#0F172A" />

          <View className="absolute right-2.5 top-2.5 h-[10px] w-[10px] rounded-full border-2 border-white bg-red-500" />
        </Pressable>
      )}
    </View>
  );
}