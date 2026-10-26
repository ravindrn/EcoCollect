import { create } from 'zustand'
import { clearToken, getToken } from '@/services/session'

type SessionState = {
  token: string | null
  ready: boolean
  setToken: (token: string) => void
  clear: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useSession = create<SessionState>((set) => ({
  token: null,
  ready: false,
  setToken: (token) => set({ token }),
  clear: async () => {
    await clearToken()
    set({ token: null })
  },
  hydrate: async () => {
    try {
      const token = await getToken()
      set({ token, ready: true })
    } catch {
      set({ token: null, ready: true })
    }
  },
}))
