
import { Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme/colors';

export function NewComplaintScreen() {
  return (
    <ScreenContainer>
      <View className="mb-5 mt-3">
        <Text
          className="text-[26px] font-bold"
          style={{ color: colors.textPrimary }}
        >
          New complaint
        </Text>

        <Text
          className="mt-1 text-sm"
          style={{ color: colors.textSecondary }}
        >
          Report a waste-related problem in your area
        </Text>
      </View>

      <View
        className="items-center rounded-2xl border p-5"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <Text
          className="mb-1.5 text-base font-bold"
          style={{ color: colors.textPrimary }}
        >
          Coming soon
        </Text>

        <Text
          className="text-center text-[13px] leading-5"
          style={{ color: colors.textSecondary }}
        >
          Pick a category, add a photo, and share your location.
        </Text>
      </View>
    </ScreenContainer>
  );
}
