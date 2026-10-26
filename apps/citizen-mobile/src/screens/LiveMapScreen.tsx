
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';

export function LiveMapScreen() {
  return (
    <View
      className="flex-1 items-center justify-center p-5"
      style={{ backgroundColor: colors.background }}
    >
      <Text
        className="mb-2 text-2xl font-bold"
        style={{ color: colors.primary }}
      >
        Live Map
      </Text>

      <Text
        className="text-center text-sm"
        style={{ color: colors.textMuted }}
      >
        Track waste collection vehicles in real time.
      </Text>
    </View>
  );
}
