import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from '@/hooks/useAppTheme'

type Props = {
  children: ReactNode
  scroll?: boolean
}

export function Screen({ children, scroll = true }: Props) {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const bottom = insets.bottom + theme.spacing.xxl

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottom }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingBottom: bottom }}>{children}</View>
      )}
    </View>
  )
}
