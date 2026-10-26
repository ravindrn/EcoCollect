import { Text, View } from 'react-native'
import type { AnimationObject } from 'lottie-react-native'
import successCheck from '../../../assets/lottie/success-check.json'
import { useAppTheme } from '@/hooks/useAppTheme'
import { LottiePlayer } from './LottiePlayer'

type Props = {
  message: string
}

export function SuccessCheck({ message }: Props) {
  const theme = useAppTheme()

  return (
    <View accessibilityLabel={message} style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
      <LottiePlayer source={successCheck as AnimationObject} loop={false} size={140} />
      <View
        style={{
          alignSelf: 'stretch',
          backgroundColor: theme.colors.success,
          borderRadius: theme.radii.md,
          padding: theme.spacing.md,
        }}
      >
        <Text style={{ color: theme.colors.onSuccess, ...theme.typography.bodyStrong, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View>
  )
}
