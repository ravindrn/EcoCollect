import { useEffect } from 'react'
import { Text, View } from 'react-native'
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
  on: boolean
  label: string
}

export function EnginePulse({ on, label }: Props) {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  const pulse = useSharedValue(0)

  useEffect(() => {
    if (!on || reducedMotion) {
      pulse.value = withTiming(0, { duration: 180 })
      return
    }
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [on, pulse, reducedMotion])

  const halo = useAnimatedStyle(() => ({
    opacity: on ? 0.45 - pulse.value * 0.35 : 0,
    transform: [{ scale: 1 + pulse.value * 0.85 }],
  }))
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: on ? 1 + pulse.value * 0.12 : 1 }],
  }))
  const color = on ? theme.colors.success : theme.colors.textSecondary

  return (
    <View
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: theme.touchTarget.minHeight, gap: theme.spacing.sm }}
    >
      <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            halo,
            {
              position: 'absolute',
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: color,
            },
          ]}
        />
        <Animated.View
          style={[
            core,
            {
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label }}>
        {label}
      </Text>
    </View>
  )
}
