import {
  ActivityIndicator,
  StyleSheet,
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
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? 'white' : colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.textPrimary : styles.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: { backgroundColor: colors.primary },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.6 },
  text: { fontSize: 15, fontWeight: '600' },
  textPrimary: { color: 'white' },
  textGhost: { color: colors.primary },
});