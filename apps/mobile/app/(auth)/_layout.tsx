import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '../../src/stores/auth-store'

export default function AuthLayout() {
  const hydrated = useAuthStore((state) => state.hydrated)
  const accessToken = useAuthStore((state) => state.accessToken)
  if (!hydrated) return null
  if (accessToken) return <Redirect href="/(app)" />
  return <Stack screenOptions={{ headerShown: false }} />
}
