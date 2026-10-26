import { View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { NavContext } from '@/components/nav/NavContext'
import { SideNav, useSidebarMode } from '@/components/nav/SideNav'
import { useAppTheme } from '@/hooks/useAppTheme'
import { useTripSampling } from '@/hooks/useTripSampling'
import { useSession } from '@/stores/session'

export default function SignedInLayout() {
  const ready = useSession((state) => state.ready)
  const token = useSession((state) => state.token)
  const theme = useAppTheme()
  const sidebar = useSidebarMode()
  useTripSampling()

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
  }

  if (!token) {
    return <Redirect href="/login" />
  }

  return (
    <NavContext.Provider value={{ open: sidebar.open, toggle: sidebar.toggle }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.colors.background }}>
        <SideNav open={sidebar.open} onToggle={sidebar.toggle} />
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </View>
      </View>
    </NavContext.Provider>
  )
}
