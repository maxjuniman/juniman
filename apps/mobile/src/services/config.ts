import Constants from 'expo-constants'
import { Platform } from 'react-native'

export function apiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL
  if (configured) return configured.replace(/\/$/, '')
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host) return `http://${host}:3333`
  if (Platform.OS === 'android') return 'http://10.0.2.2:3333'
  return 'http://localhost:3333'
}

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${apiBaseUrl()}${path}`
}
