import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from '@/hooks/useAppTheme'

type Props = {
  label: string
  lines?: number
}

export function Skeleton({ label, lines = 3 }: Props) {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  const opacity = useSharedValue(0.45)

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.7
      return
    }
    opacity.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [opacity, reducedMotion])

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const widths = ['100%', '78%', '52%'] as const

  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
      {Array.from({ length: lines }, (_, index) => (
        <Animated.View
          key={index}
          style={[
            animated,
            {
              height: index === 0 ? 22 : 14,
              width: widths[index % widths.length],
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.primarySoft,
            },
          ]}
        />
      ))}
    </View>
  )
}
