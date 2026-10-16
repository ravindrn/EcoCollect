import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ecocollect.access_token';

const isWeb = Platform.OS === 'web';

// Web fallback: localStorage. This is only for development convenience —
// browser storage is not a secure enclave. On Android/iOS we use the
// platform Keystore/Keychain via expo-secure-store.
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export async function saveToken(token: string): Promise<void> {
  if (isWeb) return webStorage.setItem(TOKEN_KEY, token);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (isWeb) return webStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  if (isWeb) return webStorage.removeItem(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}