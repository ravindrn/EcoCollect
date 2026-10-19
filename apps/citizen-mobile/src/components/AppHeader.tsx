
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
    <View className="mb-6 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center">
        <View className="mr-3 h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#ECFDF3]">
          <Text className="text-[27px]">♻️</Text>
        </View>

        <View className="flex-1">
          <Text className="text-[21px] font-bold text-slate-900">
            EcoCollect
          </Text>

          <Text className="mt-[3px] text-xs text-slate-500">
            Smart Waste Management
          </Text>
        </View>
      </View>

      {showNotifications && (
        <Pressable
          className="relative ml-3 h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white"
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={22} color="#0F172A" />

          <View className="absolute right-2 top-2 h-[9px] w-[9px] rounded-full border border-white bg-red-500" />
        </Pressable>
      )}
    </View>
  );
}
