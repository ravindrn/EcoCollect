import { Text, type StyleProp, type ViewStyle } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'
import { PressableScale } from './PressableScale'

type Props = {
  label: string
  onPress: () => void
  disabled?: boolean
  tone?: 'primary' | 'danger'
  style?: StyleProp<ViewStyle>
}

export function PrimaryButton({ label, onPress, disabled, tone = 'primary', style }: Props) {
  const theme = useAppTheme()
  const background = tone === 'danger' ? theme.colors.danger : theme.colors.primary
  const ink = tone === 'danger' ? theme.colors.onDanger : theme.colors.onPrimary

  return (
    <PressableScale
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          minHeight: 56,
          borderRadius: theme.radii.md,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.lg,
        },
        theme.shadows.sm,
        style,
      ]}
    >
      <Text style={{ color: ink, ...theme.typography.button }}>{label}</Text>
    </PressableScale>
  )
}
