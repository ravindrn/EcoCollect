export const themeModes = ['light', 'dark'] as const

export type ThemeMode = (typeof themeModes)[number]

export type ThemeColors = {
  primary: string
  primarySoft: string
  secondary: string
  background: string
  card: string
  textPrimary: string
  textSecondary: string
  success: string
  warning: string
  danger: string
  gradientStart: string
  gradientEnd: string
  onPrimary: string
  onSecondary: string
  onSuccess: string
  onWarning: string
  onDanger: string
  border: string
  focus: string
}

const ink = '#0F172A'
const paper = '#FFFFFF'

// Filled controls use these inks so labels stay readable in sunlight.

export const colors: Record<ThemeMode, ThemeColors> = {
  light: {
    primary: '#0F766E',
    primarySoft: '#CCFBF1',
    secondary: '#0EA5E9',
    background: '#F8FAFC',
    card: paper,
    textPrimary: ink,
    textSecondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    gradientStart: '#0F766E',
    gradientEnd: '#0EA5E9',
    onPrimary: paper,
    onSecondary: ink,
    onSuccess: ink,
    onWarning: ink,
    onDanger: ink,
    border: '#64748B',
    focus: '#0EA5E9',
  },
  dark: {
    primary: '#14B8A6',
    primarySoft: '#134E4A',
    secondary: '#38BDF8',
    background: '#0F172A',
    card: '#1E293B',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    gradientStart: '#134E4A',
    gradientEnd: '#0C4A6E',
    onPrimary: ink,
    onSecondary: ink,
    onSuccess: ink,
    onWarning: ink,
    onDanger: ink,
    border: '#94A3B8',
    focus: '#38BDF8',
  },
}

export type GradientPoint = {
  x: number
  y: number
}

export type ThemeGradient = {
  colors: [string, string]
  start: GradientPoint
  end: GradientPoint
}

export type ThemeGradients = {
  brand: ThemeGradient
  vertical: ThemeGradient
  horizontal: ThemeGradient
}

export function gradients(mode: ThemeMode): ThemeGradients {
  const palette = colors[mode]
  const pair: [string, string] = [palette.gradientStart, palette.gradientEnd]

  return {
    brand: {
      colors: pair,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    vertical: {
      colors: pair,
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
    },
    horizontal: {
      colors: pair,
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    },
  }
}
