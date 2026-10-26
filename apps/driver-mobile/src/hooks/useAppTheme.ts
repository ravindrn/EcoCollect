import { useMemo } from 'react'
import { themeFor, type AppTheme } from '@/theme'
import { usePreferences } from '@/stores/preferences'

export function useAppTheme(): AppTheme {
  const mode = usePreferences((state) => state.mode)
  return useMemo(() => themeFor(mode), [mode])
}
