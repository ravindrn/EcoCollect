
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors } from '../theme/colors';

type Props = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

export function PrimaryButton({
  title,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      className={`min-h-12 items-center justify-center rounded-[10px] py-[14px] ${
        isPrimary
          ? 'bg-emerald-600'
          : 'border border-emerald-600 bg-transparent'
      } ${(disabled || loading) ? 'opacity-60' : ''}`}
      style={style}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? 'white' : colors.primary}
        />
      ) : (
        <Text
          className={`text-[15px] font-semibold ${
            isPrimary ? 'text-white' : 'text-emerald-600'
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
