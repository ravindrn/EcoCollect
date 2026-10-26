import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const LANGUAGE_KEY = 'ecocollect.driver.language'
const MODE_KEY = 'ecocollect.driver.colorMode'

export type AppLanguage = 'en' | 'si' | 'ta'
export type ColorMode = 'light' | 'dark'

function isLanguage(value: string | null): value is AppLanguage {
  return value === 'en' || value === 'si' || value === 'ta'
}

export function readLanguage(): AppLanguage {
  if (typeof localStorage === 'undefined') return 'en'
  const value = localStorage.getItem(LANGUAGE_KEY)
  return isLanguage(value) ? value : 'en'
}

export function saveLanguage(language: AppLanguage): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(LANGUAGE_KEY, language)
  if (Platform.OS !== 'web') void SecureStore.setItemAsync(LANGUAGE_KEY, language)
}

export function readColorMode(): ColorMode {
  if (typeof localStorage === 'undefined') return 'light'
  return localStorage.getItem(MODE_KEY) === 'dark' ? 'dark' : 'light'
}

export function saveColorMode(mode: ColorMode): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(MODE_KEY, mode)
  if (Platform.OS !== 'web') void SecureStore.setItemAsync(MODE_KEY, mode)
}

export async function hydratePreferences(): Promise<{ language: AppLanguage; mode: ColorMode }> {
  if (Platform.OS === 'web') {
    return { language: readLanguage(), mode: readColorMode() }
  }
  const [language, mode] = await Promise.all([
    SecureStore.getItemAsync(LANGUAGE_KEY),
    SecureStore.getItemAsync(MODE_KEY),
  ])
  return {
    language: isLanguage(language) ? language : 'en',
    mode: mode === 'dark' ? 'dark' : 'light',
  }
}
