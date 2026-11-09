import { gradients, themeColors, type ThemeMode } from './colors'
import { radii, spacing, strokes, touchTarget } from './spacing'
import { shadows } from './shadows'
import { typography } from './typography'

export { gradients, themeColors as colors, themeModes } from './colors'
export type { GradientPoint, ThemeColors, ThemeGradient, ThemeGradients, ThemeMode } from './colors'
export { radii, spacing, strokes, touchTarget } from './spacing'
export type { Radii, Spacing } from './spacing'
export { elevationLevels, shadows } from './shadows'
export type { Elevation, ThemeShadows } from './shadows'
export { typography } from './typography'
export type { TypographyVariant } from './typography'

export function themeFor(mode: ThemeMode) {
  return {
    mode,
    colors: themeColors[mode],
    gradients: gradients(mode),
    spacing,
    radii,
    strokes,
    touchTarget,
    typography,
    shadows: shadows(mode),
  }
}

export type AppTheme = ReturnType<typeof themeFor>
