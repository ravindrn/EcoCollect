import { View } from 'react-native'
import LottieView, { type AnimationObject } from 'lottie-react-native'
import { useReducedMotion } from 'react-native-reanimated'

type Props = {
  source: AnimationObject
  loop: boolean
  size?: number
}

export function LottiePlayer({ source, loop, size = 180 }: Props) {
  const reducedMotion = useReducedMotion()
  const frame = { width: size, height: size }

  return (
    <View style={{ alignItems: 'center' }}>
      <LottieView
        source={source}
        autoPlay={!reducedMotion}
        loop={loop && !reducedMotion}
        style={frame}
        webStyle={frame}
      />
    </View>
  )
}
