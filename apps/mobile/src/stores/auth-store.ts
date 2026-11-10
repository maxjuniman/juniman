import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import type { AuthSession, PublicUser } from '../shared'
import { apiBaseUrl } from '../services/config'

const STORAGE_KEY = '@junimans/session'

type AuthState = {
  user: PublicUser | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  pushEnabled: boolean
  setPushEnabled: (value: boolean) => void
  hydrate: () => Promise<void>
  setSession: (session: AuthSession) => Promise<void>
  setUser: (user: PublicUser) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  pushEnabled: false,
  setPushEnabled: (pushEnabled) => set({ pushEnabled }),
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const session = JSON.parse(raw) as AuthSession
        set({ ...session, hydrated: true })
        return
      }
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY)
    }
    set({ user: null, accessToken: null, refreshToken: null, hydrated: true })
  },
  setSession: async (session) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    set(session)
  },
  setUser: async (user) => {
    const { accessToken, refreshToken } = get()
    if (!accessToken || !refreshToken) return
    const session = { user, accessToken, refreshToken }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    set({ user })
  },
  logout: async () => {
    const refreshToken = get().refreshToken
    set({ user: null, accessToken: null, refreshToken: null, pushEnabled: false })
    await AsyncStorage.removeItem(STORAGE_KEY)
    const notifications = await import('../services/notifications')
    await notifications.cancelAllTaskNotifications().catch(() => undefined)
    if (!refreshToken) return
    await fetch(`${apiBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined)
  },
}))
