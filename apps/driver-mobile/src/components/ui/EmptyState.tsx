import { Text, View } from 'react-native'
import type { AnimationObject } from 'lottie-react-native'
import emptyState from '../../../assets/lottie/empty-state.json'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LottiePlayer } from './LottiePlayer'

type Props = {
  title: string
  body?: string
}

export function EmptyState({ title, body }: Props) {
  const theme = useAppTheme()

  return (
    <View accessibilityRole="text" style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
      <LottiePlayer source={emptyState as AnimationObject} loop />
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading, textAlign: 'center' }}>{title}</Text>
      {body ? (
        <Text
          style={{
            color: theme.colors.textPrimary,
            ...theme.typography.body,
            textAlign: 'center',
            marginTop: theme.spacing.sm,
          }}
        >
          {body}
        </Text>
      ) : null}
    </View>
  )
}
