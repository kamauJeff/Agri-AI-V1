import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: string
  name: string
  phone: string
  email?: string | null
  role: 'FARMER' | 'AGENT' | 'ADMIN'
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)],
    ])
    set({ user, accessToken, refreshToken, isAuthenticated: true })
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  loadFromStorage: async () => {
    try {
      const [[, token], [, refresh], [, userStr]] = await AsyncStorage.multiGet([
        'accessToken', 'refreshToken', 'user',
      ])
      if (token && userStr) {
        set({
          accessToken: token,
          refreshToken: refresh,
          user: JSON.parse(userStr),
          isAuthenticated: true,
        })
      }
    } catch {}
    finally { set({ isLoading: false }) }
  },
}))
