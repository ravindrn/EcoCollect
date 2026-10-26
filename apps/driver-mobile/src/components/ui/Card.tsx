import type { ReactNode } from 'react'
import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated'
import { useAppTheme } from '@/hooks/useAppTheme'

type Props = {
  children: ReactNode
  delay?: number
}

export function Card({ children, delay = 0 }: Props) {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  const wash = theme.gradients.horizontal

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInUp.delay(delay).duration(420)}
      style={[
        theme.shadows.md,
        {
          marginHorizontal: theme.spacing.screen,
          marginBottom: theme.spacing.lg,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <View
        style={{
          overflow: 'hidden',
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.card,
          borderWidth: theme.strokes.strong,
          borderColor: theme.colors.border,
        }}
      >
        <LinearGradient colors={wash.colors} start={wash.start} end={wash.end} style={{ height: 4 }} />
        <View style={{ padding: theme.spacing.card }}>{children}</View>
      </View>
    </Animated.View>
  )
}
