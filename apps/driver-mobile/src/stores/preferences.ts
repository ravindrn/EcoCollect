import { create } from 'zustand'
import i18n from '@/i18n'
import {
  hydratePreferences,
  readColorMode,
  readLanguage,
  saveColorMode,
  saveLanguage,
  type AppLanguage,
  type ColorMode,
} from '@/i18n/language'

type PreferencesState = {
  language: AppLanguage
  mode: ColorMode
  setLanguage: (language: AppLanguage) => void
  setMode: (mode: ColorMode) => void
  hydrate: () => Promise<void>
}

export const usePreferences = create<PreferencesState>((set) => ({
  language: readLanguage(),
  mode: readColorMode(),
  setLanguage: (language) => {
    saveLanguage(language)
    void i18n.changeLanguage(language)
    set({ language })
  },
  setMode: (mode) => {
    saveColorMode(mode)
    set({ mode })
  },
  hydrate: async () => {
    try {
      const next = await hydratePreferences()
      await i18n.changeLanguage(next.language)
      set(next)
    } catch {
      set({ language: 'en', mode: 'light' })
    }
  },
}))
