import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>
}

export function PressableScale({ style, disabled, onPressIn, onPressOut, ...props }: Props) {
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) scale.value = withSpring(0.96, { damping: 18, stiffness: 320 })
        onPressIn?.(event)
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 })
        onPressOut?.(event)
      }}
      style={[animated, style, disabled ? { opacity: 0.45 } : null]}
    />
  )
}
