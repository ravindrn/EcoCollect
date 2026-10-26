export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  screen: 24,
  card: 16,
  stack: 12,
  touch: 48,
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const

export const strokes = {
  hairline: 1,
  strong: 2,
} as const

export const touchTarget = {
  minWidth: 48,
  minHeight: 48,
} as const

export type Spacing = typeof spacing
export type Radii = typeof radii
