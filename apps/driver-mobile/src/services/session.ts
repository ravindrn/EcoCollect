import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'ecocollect.driver.access_token'
let webToken: string | null = null

export async function saveToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
        webToken = token
        return
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
    if (Platform.OS === 'web')return webToken
    return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function clearToken(): Promise<void> {
    if(Platform.OS === 'web') {
        webToken = null
        return
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY)
}
