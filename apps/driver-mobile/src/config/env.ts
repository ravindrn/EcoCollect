import Constants from 'expo-constants'

type Extra = { apiBaseUrl?: string }

const extra = (Constants.expoConfig?.extra ?? {}) as Extra
const apiBaseUrl = extra.apiBaseUrl

if (!apiBaseUrl) {
  throw new Error('apiBaseUrl is missing from app.json extra')
}

export const env = { apiBaseUrl }
