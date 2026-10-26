import { useEffect, useRef, useState } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { usePathname, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PressableScale } from '@/components/ui/PressableScale'
import { useAppTheme } from '@/hooks/useAppTheme'
import { signOut } from '@/services/signOut'

const WIDE = 840
const RAIL = 76
const DRAWER = 280

type Item = {
  href: '/' | '/inbox' | '/weight' | '/queue' | '/trip' | '/profile'
  label: string
  icon: 'home' | 'inbox' | 'weight' | 'queue' | 'trip' | 'profile'
}

export function SideNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const wide = width >= WIDE
  const progress = useSharedValue(open ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 240 })
  }, [open, progress])

  const panel = useAnimatedStyle(() => ({
    width: wide ? RAIL + progress.value * (DRAWER - RAIL) : DRAWER,
    transform: wide ? [] : [{ translateX: (progress.value - 1) * DRAWER }],
  }))
  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }))

  const items: Item[] = [
    { href: '/', label: t('navHome'), icon: 'home' },
    { href: '/inbox', label: t('inboxTitle'), icon: 'inbox' },
    { href: '/weight', label: t('weightTitle'), icon: 'weight' },
    { href: '/queue', label: t('queueTitle'), icon: 'queue' },
    { href: '/trip', label: t('tripTitle'), icon: 'trip' },
    { href: '/profile', label: t('profileTitle'), icon: 'profile' },
  ]
  const ink = theme.colors.textPrimary

  async function leave() {
    await signOut()
    router.replace('/login')
  }

  return (
    <>
      {!wide && open ? (
        <Pressable
          accessibilityLabel={t('menuClose')}
          onPress={onToggle}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: theme.colors.textPrimary,
            opacity: 0.35,
            zIndex: 20,
          }}
        />
      ) : null}
      <Animated.View
        style={[
          panel,
          theme.shadows.lg,
          {
            position: wide ? 'relative' : 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 30,
            backgroundColor: theme.colors.card,
            overflow: 'hidden',
            borderRightWidth: theme.strokes.strong,
            borderRightColor: theme.colors.border,
            paddingTop: insets.top + theme.spacing.sm,
            paddingBottom: insets.bottom + theme.spacing.md,
          },
        ]}
      >
        <LinearGradient
          colors={theme.gradients.vertical.colors}
          start={theme.gradients.vertical.start}
          end={theme.gradients.vertical.end}
          style={{ height: 4, marginBottom: theme.spacing.sm }}
        />
        <PressableScale
          accessibilityLabel={open ? t('menuClose') : t('menuOpen')}
          onPress={onToggle}
          style={{
            minHeight: theme.touchTarget.minHeight,
            minWidth: theme.touchTarget.minWidth,
            marginHorizontal: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
            borderRadius: theme.radii.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
          }}
        >
          <MenuMark color={ink} />
          <Animated.Text numberOfLines={1} style={[labelStyle, { color: ink, ...theme.typography.label, flex: 1 }]}>
            {t('menuClose')}
          </Animated.Text>
        </PressableScale>
        <View style={{ flex: 1 }}>
          {items.map((item) => {
            const selected = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <PressableScale
                key={item.href}
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
                onPress={() => router.push(item.href)}
                style={{
                  minHeight: theme.touchTarget.minHeight,
                  marginHorizontal: theme.spacing.sm,
                  marginBottom: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radii.md,
                  borderWidth: theme.strokes.strong,
                  borderColor: selected ? theme.colors.primary : 'transparent',
                  backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <NavIcon name={item.icon} color={ink} />
                <Animated.Text numberOfLines={1} style={[labelStyle, { color: ink, ...theme.typography.label, flex: 1 }]}>
                  {item.label}
                </Animated.Text>
              </PressableScale>
            )
          })}
        </View>
        <PressableScale
          accessibilityLabel={t('signOut')}
          onPress={() => void leave()}
          style={{
            minHeight: theme.touchTarget.minHeight,
            marginHorizontal: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.danger,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: open ? 'flex-start' : 'center',
            gap: theme.spacing.sm,
          }}
        >
          <NavIcon name="out" color={theme.colors.onDanger} />
          <Animated.Text numberOfLines={1} style={[labelStyle, { color: theme.colors.onDanger, ...theme.typography.label, flex: 1 }]}>
            {t('signOut')}
          </Animated.Text>
        </PressableScale>
      </Animated.View>
    </>
  )
}

export function useSidebarMode() {
  const { width } = useWindowDimensions()
  const wide = width >= WIDE
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const [open, setOpen] = useState(wide)

  useEffect(() => {
    setOpen(wide)
  }, [wide])

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    if (!wide) setOpen(false)
  }, [pathname, wide])

  return { open, toggle: () => setOpen((value) => !value) }
}

function MenuMark({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  )
}

function NavIcon({ name, color }: { name: Item['icon'] | 'out'; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {name === 'home' ? <Path d="M4 11 L12 4 L20 11 V20 H15 V14 H9 V20 H4 Z" fill={color} /> : null}
      {name === 'inbox' ? <Path d="M4 6 H20 V16 H15 L12 19 L9 16 H4 Z" fill={color} /> : null}
      {name === 'weight' ? (
        <>
          <Circle cx={12} cy={8} r={3} fill={color} />
          <Path d="M6 20 H18 L16 11 H8 Z" fill={color} />
        </>
      ) : null}
      {name === 'queue' ? (
        <>
          <Rect x={5} y={5} width={14} height={3} rx={1.5} fill={color} />
          <Rect x={5} y={11} width={14} height={3} rx={1.5} fill={color} />
          <Rect x={5} y={17} width={10} height={3} rx={1.5} fill={color} />
        </>
      ) : null}
      {name === 'trip' ? <Path d="M12 3 C8 3 6 6.5 6 9.5 C6 14 12 21 12 21 C12 21 18 14 18 9.5 C18 6.5 16 3 12 3 Z M12 8 A2 2 0 1 0 12 12 A2 2 0 1 0 12 8 Z" fill={color} /> : null}
      {name === 'profile' ? (
        <>
          <Circle cx={12} cy={8} r={3.2} fill={color} />
          <Path d="M5 19 C6 15 9 13.5 12 13.5 C15 13.5 18 15 19 19 Z" fill={color} />
        </>
      ) : null}
      {name === 'out' ? <Path d="M10 4 H6 V20 H10 M10 12 H20 M16 8 L20 12 L16 16" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </Svg>
  )
}
