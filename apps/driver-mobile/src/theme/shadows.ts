import type { ViewStyle } from 'react-native'
import { colors, type ThemeMode } from './colors'

export const elevationLevels = ['none', 'sm', 'md', 'lg'] as const

export type Elevation = (typeof elevationLevels)[number]

export type ThemeShadows = Record<Elevation, ViewStyle>

type ShadowSpec = {
  offsetY: number
  opacity: number
  radius: number
  elevation: number
}

const specs: Record<Exclude<Elevation, 'none'>, ShadowSpec> = {
  sm: { offsetY: 2, opacity: 0.08, radius: 8, elevation: 1 },
  md: { offsetY: 6, opacity: 0.1, radius: 16, elevation: 3 },
  lg: { offsetY: 12, opacity: 0.14, radius: 28, elevation: 6 },
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const none: ViewStyle = {
  boxShadow: '0px 0px 0px rgba(15, 23, 42, 0)',
  elevation: 0,
}

function lift(color: string, spec: ShadowSpec, opacityScale: number): ViewStyle {
  const opacity = Number((spec.opacity * opacityScale).toFixed(3))
  return {
    boxShadow: `0px ${spec.offsetY}px ${spec.radius}px ${hexToRgba(color, opacity)}`,
    elevation: spec.elevation,
  }
}

export function shadows(mode: ThemeMode): ThemeShadows {
  const color = mode === 'light' ? colors.light.textPrimary : colors.dark.textPrimary
  const opacityScale = mode === 'light' ? 1 : 1.25

  return {
    none,
    sm: lift(color, specs.sm, opacityScale),
    md: lift(color, specs.md, opacityScale),
    lg: lift(color, specs.lg, opacityScale),
  }
}
