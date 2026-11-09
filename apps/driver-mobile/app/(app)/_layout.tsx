import { View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { NavContext } from '@/components/nav/NavContext'
import { SideNav, useSidebarMode } from '@/components/nav/SideNav'
import { useTripSampling } from '@/hooks/useTripSampling'
import { useSession } from '@/stores/session'
import { colors } from '@/theme/colors'

export default function SignedInLayout() {
  const ready = useSession((state) => state.ready)
  const token = useSession((state) => state.token)
  const sidebar = useSidebarMode()
  useTripSampling()

  if (!ready) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />
  }

  if (!token) {
    return <Redirect href="/login" />
  }

  return (
    <NavContext.Provider value={{ open: sidebar.open, toggle: sidebar.toggle }}>
      <View className="flex-1 flex-row" style={{ backgroundColor: colors.background }}>
        <SideNav open={sidebar.open} onToggle={sidebar.toggle} />
        <View className="flex-1">
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </View>
      </View>
    </NavContext.Provider>
  )
}