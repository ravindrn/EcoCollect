
import { forwardRef } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, style, ...rest },
  ref,
) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] font-semibold">
        {label}
      </Text>

      <TextInput
        ref={ref}
        className={`rounded-[10px] border px-[14px] py-3 text-[15px] ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        style={[
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />

      {error ? (
        <Text className="mt-1 text-xs text-red-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
