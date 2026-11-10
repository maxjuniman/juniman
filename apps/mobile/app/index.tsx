import { Redirect } from 'expo-router'
import { BootScreen } from '../src/components/BootScreen'
import { useAuthStore } from '../src/stores/auth-store'

export default function Gate() {
  const hydrated = useAuthStore((state) => state.hydrated)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!hydrated) return <BootScreen />
  if (accessToken) return <Redirect href="/(app)" />
  return <Redirect href="/(auth)/login" />
}
