
import { Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';

export function ComplaintsScreen() {
  return (
    <ScreenContainer>
      <View className="mb-5 mt-3">
        <Text className="text-[26px] font-bold text-slate-900">
          My complaints
        </Text>

        <Text className="mt-1 text-sm text-slate-500">
          Track reports you've submitted
        </Text>
      </View>

      <View className="items-center rounded-2xl border border-gray-200 bg-white p-5">
        <Text className="mb-1.5 text-base font-bold text-slate-900">
          Coming soon
        </Text>

        <Text className="text-center text-[13px] leading-5 text-slate-500">
          Your complaints and their statuses will appear here.
        </Text>
      </View>
    </ScreenContainer>
  );
}
