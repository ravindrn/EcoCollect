let accessToken: string | null = null

export const adminSession = {
    getToken(): string |null {
        return accessToken
    },
    setToken(token: string): void {
        accessToken = token
    },
    clear(): void {
        accessToken = null
    },
}
