import { Text, View } from 'react-native'
import { useAppTheme } from '@/hooks/useAppTheme'

type Tone = 'danger' | 'success' | 'warning' | 'secondary'

type Props = {
  tone: Tone
  message: string
}

export function Banner({ tone, message }: Props) {
  const theme = useAppTheme()
  const fill = theme.colors[tone]
  const ink =
    tone === 'danger'
      ? theme.colors.onDanger
      : tone === 'success'
        ? theme.colors.onSuccess
        : tone === 'warning'
          ? theme.colors.onWarning
          : theme.colors.onSecondary

  return (
    <View
      style={{
        backgroundColor: fill,
        borderRadius: theme.radii.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.md,
      }}
    >
      <Text style={{ color: ink, ...theme.typography.bodyStrong }}>{message}</Text>
    </View>
  )
}
