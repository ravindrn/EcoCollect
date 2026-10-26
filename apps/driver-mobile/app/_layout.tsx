import '@/i18n'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { useAppTheme } from '@/hooks/useAppTheme'
import { queryClient } from '@/services/queryClient'
import { usePreferences } from '@/stores/preferences'
import { useSession } from '@/stores/session'

function RootNavigator() {
  const ready = useSession((state) => state.ready)
  const theme = useAppTheme()

  useEffect(() => {
    void (async () => {
      await usePreferences.getState().hydrate()
      await useSession.getState().hydrate()
    })()
  }, [])

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppErrorBoundary>
            <RootNavigator />
          </AppErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
