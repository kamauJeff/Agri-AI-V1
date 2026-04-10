import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach stored access token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 — refresh and retry once
let isRefreshing = false
let failQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  failQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise((resolve, reject) => failQueue.push({ resolve, reject }))
        .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original) })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      const newToken = data.data.tokens.accessToken
      await AsyncStorage.setItem('accessToken', newToken)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (err) {
      processQueue(err, null)
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user'])
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
